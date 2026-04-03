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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source_id, booking_id, amount, payment_type = 'deposit' } = body

    if (!source_id || !booking_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: source_id, booking_id, amount' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
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

    // Process payment via Square Payments API
    const idempotencyKey = crypto.randomUUID()

    const paymentResponse = await squareClient.payments.create({
      sourceId: source_id,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amount),
        currency: 'USD',
      },
      locationId: getSquareLocationId(),
      referenceId: booking_id,
      customerId: squareCustomerId,
      note: `Yumi Forever - Booking #${booking.booking_number} (${payment_type})`,
    })

    const sqPayment = paymentResponse.payment

    if (!sqPayment || sqPayment.status !== 'COMPLETED') {
      const errorDetail = paymentResponse.errors?.[0]?.detail || 'Payment failed'
      return NextResponse.json({ error: errorDetail }, { status: 400 })
    }

    // Insert payment record
    await serviceClient.from('payments').insert({
      booking_id,
      profile_id: user?.id || null,
      amount,
      status: payment_type === 'deposit' ? 'deposit_paid' : 'paid',
      payment_type,
      square_payment_id: sqPayment.id || null,
      square_order_id: sqPayment.orderId || null,
    })

    // Update booking
    if (payment_type === 'full' || payment_type === 'balance') {
      await serviceClient
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          deposit_paid: booking.total,
          remaining_balance: 0,
        })
        .eq('id', booking_id)

      await serviceClient.from('booking_status_history').insert({
        booking_id,
        status: 'confirmed',
        changed_by: user?.id || null,
        notes: 'Full payment completed',
      })
    } else {
      // Deposit payment
      const { data: currentBooking } = await serviceClient
        .from('bookings')
        .select('total, deposit_paid')
        .eq('id', booking_id)
        .single()

      const updatedDepositPaid = (currentBooking?.deposit_paid || 0) + amount
      const updatedRemaining = (currentBooking?.total || 0) - updatedDepositPaid

      await serviceClient
        .from('bookings')
        .update({
          payment_status: 'deposit_paid',
          deposit_paid: updatedDepositPaid,
          remaining_balance: Math.max(0, updatedRemaining),
        })
        .eq('id', booking_id)

      await serviceClient.from('booking_status_history').insert({
        booking_id,
        status: 'new',
        changed_by: user?.id || null,
        notes: 'Deposit payment received',
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
      payment_id: sqPayment.id,
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
