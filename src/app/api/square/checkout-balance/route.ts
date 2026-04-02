import { createClient } from '@supabase/supabase-js'
import { getSquareClient, getSquareLocationId } from '@/lib/square'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { booking_id, amount, token } = body

    if (!booking_id || !amount) {
      return NextResponse.json(
        { error: 'booking_id and amount are required' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // If a token was provided, validate the payment link
    if (token) {
      const { data: paymentLink, error: linkError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('token', token)
        .single()

      if (linkError || !paymentLink) {
        return NextResponse.json(
          { error: 'Invalid payment link' },
          { status: 400 }
        )
      }

      if (paymentLink.paid_at) {
        return NextResponse.json(
          { error: 'This payment link has already been used' },
          { status: 410 }
        )
      }

      if (new Date(paymentLink.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'This payment link has expired' },
          { status: 410 }
        )
      }
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status === 'canceled') {
      return NextResponse.json(
        { error: 'Cannot pay balance on a canceled booking' },
        { status: 400 }
      )
    }

    const serviceName = booking.service?.name || 'Service'
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''

    const squareClient = getSquareClient()

    // Create Square checkout payment link for balance
    const paymentLink = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: getSquareLocationId(),
        lineItems: [
          {
            name: `Yumi Forever - ${serviceName} (Remaining Balance)`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(amount),
              currency: 'USD',
            },
            note: `Booking #${booking.booking_number}`,
          },
        ],
        metadata: {
          booking_id,
          payment_type: 'remaining_balance',
          payment_link_token: token || '',
        },
        referenceId: booking_id,
      },
      checkoutOptions: {
        redirectUrl: `${origin}/pay/success?booking_id=${booking_id}`,
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

    // Insert payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id,
      profile_id: booking.profile_id || null,
      amount,
      status: 'unpaid',
      payment_type: 'balance',
      square_order_id: orderId || null,
    })

    if (paymentError) {
      console.error('Payment record insert error:', paymentError)
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Square checkout-balance error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
