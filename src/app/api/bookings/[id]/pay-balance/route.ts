import { createClient } from '@/lib/supabase/server'
import { getSquareClient, getSquareLocationId } from '@/lib/square'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const supabase = await createClient()

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Look up the booking and verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('id', bookingId)
      .eq('profile_id', user.id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Cannot pay balance on canceled bookings
    if (booking.status === 'canceled') {
      return NextResponse.json(
        { error: 'Cannot pay balance on a canceled booking' },
        { status: 400 }
      )
    }

    // Check existing payments to determine what's already been paid
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status, payment_type')
      .eq('booking_id', bookingId)
      .eq('status', 'paid')

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0)
    const remainingBalance = booking.total - totalPaid

    if (remainingBalance <= 0) {
      return NextResponse.json(
        { error: 'Booking is already fully paid' },
        { status: 400 }
      )
    }

    const squareClient = getSquareClient()

    // Get or create Square customer
    let squareCustomerId: string | undefined

    const { data: profile } = await supabase
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

        squareCustomerId = customer.customer?.id

        if (squareCustomerId) {
          await supabase
            .from('profiles')
            .update({ square_customer_id: squareCustomerId })
            .eq('id', user.id)
        }
      } catch (err) {
        console.error('Square customer creation error:', err)
      }
    }

    // Get origin for redirect URL
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    const serviceName = booking.service?.name || 'Service'

    // Create Square checkout payment link for the remaining balance
    const paymentLink = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: getSquareLocationId(),
        lineItems: [
          {
            name: `Yumi Forever - ${serviceName} (Remaining Balance)`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(remainingBalance),
              currency: 'USD',
            },
          },
        ],
        metadata: {
          booking_id: bookingId,
          payment_type: 'balance',
        },
        referenceId: bookingId,
      },
      checkoutOptions: {
        redirectUrl: `${origin}/portal/bookings/${bookingId}?success=true`,
      },
      prePopulatedData: {
        buyerEmail: booking.customer_email,
      },
    })

    const checkoutUrl = paymentLink.paymentLink?.url
    const orderId = paymentLink.paymentLink?.orderId

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create checkout link' },
        { status: 500 }
      )
    }

    // Insert payment record with status 'unpaid' (webhook will update to 'paid')
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: bookingId,
      profile_id: user.id,
      amount: remainingBalance,
      status: 'unpaid',
      payment_type: 'balance',
      square_order_id: orderId || null,
    })

    if (paymentError) {
      console.error('Payment record insert error:', paymentError)
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Pay balance error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
