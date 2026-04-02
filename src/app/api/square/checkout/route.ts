import { createClient } from '@/lib/supabase/server'
import { getSquareClient, getSquareLocationId } from '@/lib/square'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { booking_id, payment_type, amount } = body

    if (!booking_id || !payment_type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, payment_type, amount' },
        { status: 400 }
      )
    }

    // Get booking from DB to verify
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Get authenticated user if exists
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const squareClient = getSquareClient()

    // Check if user has a square_customer_id in profile
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('square_customer_id, email, full_name')
        .eq('id', user.id)
        .single()

      if (!profile?.square_customer_id) {
        // Create Square customer
        try {
          const customer = await squareClient.customers.create({
            emailAddress: profile?.email || booking.customer_email,
            givenName: profile?.full_name || booking.customer_name,
            referenceId: user.id,
            idempotencyKey: crypto.randomUUID(),
          })

          if (customer.customer?.id) {
            await supabase
              .from('profiles')
              .update({ square_customer_id: customer.customer.id })
              .eq('id', user.id)
          }
        } catch (err) {
          console.error('Square customer creation error:', err)
        }
      }
    }

    // Determine the service name from the booking
    let serviceName = 'Service'
    if (booking.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', booking.service_id)
        .single()

      if (service) {
        serviceName = service.name
      }
    }

    // Get the origin for redirect URL
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    // Create Square checkout payment link
    const paymentLink = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: getSquareLocationId(),
        lineItems: [
          {
            name: `Yumi Forever - ${serviceName}`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(amount),
              currency: 'USD',
            },
          },
        ],
        metadata: {
          booking_id,
          payment_type,
        },
        referenceId: booking_id,
      },
      checkoutOptions: {
        redirectUrl: `${origin}/booking-confirmation?booking_id=${booking_id}`,
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

    // Insert payment record with status 'unpaid'
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id,
      profile_id: user?.id || null,
      amount,
      status: 'unpaid',
      payment_type,
      square_order_id: orderId || null,
    })

    if (paymentError) {
      console.error('Payment record insert error:', paymentError)
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Square checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
