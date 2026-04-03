import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getSquareClient, getSquareLocationId } from '@/lib/square'
import { NextRequest, NextResponse } from 'next/server'
import { sendBookingConfirmationEmail } from '@/lib/emails/send'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/square/pay — Process a card payment using a Square payment token
 * Supports optional review credit application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source_id, booking_id, amount, payment_type = 'deposit', credit_amount } = body

    const creditToApply = typeof credit_amount === 'number' && credit_amount > 0 ? credit_amount : 0
    const cardAmount = typeof amount === 'number' ? amount : 0

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Missing required field: booking_id' },
        { status: 400 }
      )
    }

    // Must have either a card charge or credit to apply
    if (cardAmount <= 0 && creditToApply <= 0) {
      return NextResponse.json(
        { error: 'No payment amount specified' },
        { status: 400 }
      )
    }

    // Card payment requires source_id
    if (cardAmount > 0 && !source_id) {
      return NextResponse.json(
        { error: 'Missing source_id for card payment' },
        { status: 400 }
      )
    }

    const serviceClient = getServiceClient()
    const supabase = await createServerClient()

    // Verify booking exists
    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .select('id, booking_number, customer_email, customer_name, total, service_id')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get authenticated user if exists
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const squareClient = getSquareClient()

    // Ensure Square customer exists for logged-in users
    let squareCustomerId: string | undefined
    if (user) {
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('square_customer_id, email, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.square_customer_id) {
        squareCustomerId = profile.square_customer_id
      } else {
        try {
          const customer = await squareClient.customers.create({
            emailAddress: profile?.email || booking.customer_email,
            givenName: profile?.full_name || booking.customer_name,
            referenceId: user.id,
            idempotencyKey: crypto.randomUUID(),
          })
          if (customer.customer?.id) {
            squareCustomerId = customer.customer.id
            await serviceClient
              .from('profiles')
              .update({ square_customer_id: customer.customer.id })
              .eq('id', user.id)
          }
        } catch (err) {
          console.error('Square customer creation error:', err)
        }
      }
    }

    // --- Apply review credits if requested ---
    let creditApplied = 0
    if (creditToApply > 0 && user) {
      // Fetch active credits ordered by oldest first
      const { data: activeCredits } = await serviceClient
        .from('review_credits')
        .select('id, remaining')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .gt('remaining', 0)
        .order('created_at', { ascending: true })

      if (!activeCredits || activeCredits.length === 0) {
        return NextResponse.json({ error: 'No active credits available' }, { status: 400 })
      }

      // Verify enough credit
      const totalCreditAvailable = activeCredits.reduce((sum, c) => sum + c.remaining, 0)
      if (creditToApply > totalCreditAvailable) {
        return NextResponse.json({ error: 'Insufficient credit balance' }, { status: 400 })
      }

      // Deduct credits from oldest first
      let remaining = creditToApply
      for (const credit of activeCredits) {
        if (remaining <= 0) break
        const deduct = Math.min(remaining, credit.remaining)
        const newRemaining = credit.remaining - deduct
        await serviceClient
          .from('review_credits')
          .update({
            remaining: newRemaining,
            ...(newRemaining === 0 ? { status: 'used', used_at: new Date().toISOString(), used_on_booking_id: booking_id } : {}),
          })
          .eq('id', credit.id)
        remaining -= deduct
      }
      creditApplied = creditToApply
    }

    // --- Process card payment via Square if needed ---
    let sqPaymentId: string | null = null
    let sqOrderId: string | null = null

    if (cardAmount > 0) {
      const idempotencyKey = crypto.randomUUID()

      const paymentResponse = await squareClient.payments.create({
        sourceId: source_id,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(cardAmount),
          currency: 'USD',
        },
        locationId: getSquareLocationId(),
        referenceId: booking_id,
        customerId: squareCustomerId,
        note: `Yumi Forever - Booking #${booking.booking_number} (${payment_type})${creditApplied > 0 ? ` + $${(creditApplied / 100).toFixed(2)} credit` : ''}`,
      })

      const sqPayment = paymentResponse.payment

      if (!sqPayment || sqPayment.status !== 'COMPLETED') {
        const errorDetail = paymentResponse.errors?.[0]?.detail || 'Payment failed'
        return NextResponse.json({ error: errorDetail }, { status: 400 })
      }

      sqPaymentId = sqPayment.id || null
      sqOrderId = sqPayment.orderId || null
    }

    const totalPaid = cardAmount + creditApplied

    // Insert payment record
    await serviceClient.from('payments').insert({
      booking_id,
      profile_id: user?.id || null,
      amount: totalPaid,
      status: payment_type === 'deposit' ? 'deposit_paid' : 'paid',
      payment_type,
      square_payment_id: sqPaymentId,
      square_order_id: sqOrderId,
    })

    // Update booking
    const creditUpdateFields = creditApplied > 0
      ? { review_credit_applied: creditApplied }
      : {}

    if (payment_type === 'full' || payment_type === 'balance') {
      await serviceClient
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          deposit_paid: booking.total,
          remaining_balance: 0,
          ...creditUpdateFields,
        })
        .eq('id', booking_id)

      const creditNote = creditApplied > 0 ? ` ($${(creditApplied / 100).toFixed(2)} credit applied)` : ''
      await serviceClient.from('booking_status_history').insert({
        booking_id,
        status: 'confirmed',
        changed_by: user?.id || null,
        notes: `Full payment completed${creditNote}`,
      })
    } else {
      // Deposit payment
      const { data: currentBooking } = await serviceClient
        .from('bookings')
        .select('total, deposit_paid')
        .eq('id', booking_id)
        .single()

      const updatedDepositPaid = (currentBooking?.deposit_paid || 0) + totalPaid
      const updatedRemaining = (currentBooking?.total || 0) - updatedDepositPaid

      await serviceClient
        .from('bookings')
        .update({
          payment_status: 'deposit_paid',
          deposit_paid: updatedDepositPaid,
          remaining_balance: Math.max(0, updatedRemaining),
          ...creditUpdateFields,
        })
        .eq('id', booking_id)

      const creditNote = creditApplied > 0 ? ` ($${(creditApplied / 100).toFixed(2)} credit applied)` : ''
      await serviceClient.from('booking_status_history').insert({
        booking_id,
        status: 'new',
        changed_by: user?.id || null,
        notes: `Deposit payment received${creditNote}`,
      })
    }

    // Send confirmation email
    const { data: bookingData } = await serviceClient
      .from('bookings')
      .select('*, booking_items:booking_items(name, price)')
      .eq('id', booking_id)
      .single()

    if (bookingData) {
      let serviceName = 'Service'
      if (bookingData.service_id) {
        const { data: svc } = await serviceClient
          .from('services')
          .select('name')
          .eq('id', bookingData.service_id)
          .single()
        if (svc) serviceName = svc.name
      }
      sendBookingConfirmationEmail(bookingData, serviceName)
    }

    return NextResponse.json({
      success: true,
      payment_id: sqPaymentId || 'credit_only',
      booking_id,
    })
  } catch (error) {
    console.error('Square payment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}
