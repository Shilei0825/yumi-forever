import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
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
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    // Build Stripe checkout session
    const sessionParams: Record<string, unknown> = {
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Yumi Forever - ${serviceName} (Remaining Balance)`,
              description: `Booking #${booking.booking_number}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment' as const,
      success_url: `${origin}/pay/success?booking_id=${booking_id}`,
      cancel_url: `${origin}/pay${token ? `?token=${token}` : ''}`,
      customer_email: booking.customer_email,
      metadata: {
        booking_id,
        payment_type: 'remaining_balance',
        payment_link_token: token || '',
      },
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    )

    // Insert payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id,
      profile_id: booking.profile_id || null,
      amount,
      status: 'pending',
      payment_type: 'remaining_balance',
      stripe_checkout_session_id: session.id,
    })

    if (paymentError) {
      console.error('Payment record insert error:', paymentError)
    }

    // If using a payment link token, mark it as paid
    if (token) {
      const { error: updateError } = await supabase
        .from('payment_links')
        .update({ paid_at: new Date().toISOString() })
        .eq('token', token)

      if (updateError) {
        console.error('Payment link update error:', updateError)
      }
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout-balance error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
