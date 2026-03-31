import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
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

    let stripeCustomerId: string | undefined

    // Check if user has a stripe_customer_id in profile
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id
      } else {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: profile?.email || booking.customer_email,
          name: profile?.full_name || booking.customer_name,
          metadata: {
            supabase_user_id: user.id,
          },
        })

        stripeCustomerId = customer.id

        // Save stripe_customer_id to profile
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customer.id })
          .eq('id', user.id)
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

    // Get the origin for redirect URLs
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    // Create Stripe checkout session
    const sessionParams: Record<string, unknown> = {
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Yumi Forever - ${serviceName}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment' as const,
      success_url: `${origin}/booking-confirmation?booking_id=${booking_id}`,
      cancel_url: `${origin}/book?canceled=true`,
      metadata: {
        booking_id,
        payment_type,
      },
    }

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId
    } else {
      sessionParams.customer_email = booking.customer_email
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    )

    // Insert payment record with status 'unpaid'
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id,
      profile_id: user?.id || null,
      amount,
      status: 'unpaid',
      payment_type,
      stripe_checkout_session_id: session.id,
    })

    if (paymentError) {
      console.error('Payment record insert error:', paymentError)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
