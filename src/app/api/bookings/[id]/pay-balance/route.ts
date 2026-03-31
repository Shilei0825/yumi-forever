import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
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

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: profile?.email || booking.customer_email,
        name: profile?.full_name || booking.customer_name,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      stripeCustomerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id)
    }

    // Get origin for redirect URLs
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    const serviceName = booking.service?.name || 'Service'

    // Create Stripe checkout session for the remaining balance
    const sessionParams: Record<string, unknown> = {
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Yumi Forever - ${serviceName} (Remaining Balance)`,
            },
            unit_amount: remainingBalance,
          },
          quantity: 1,
        },
      ],
      mode: 'payment' as const,
      success_url: `${origin}/portal/bookings/${bookingId}?success=true`,
      cancel_url: `${origin}/portal/bookings/${bookingId}?canceled=true`,
      metadata: {
        booking_id: bookingId,
        payment_type: 'balance',
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

    // Insert payment record with status 'unpaid' (webhook will update to 'paid')
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: bookingId,
      profile_id: user.id,
      amount: remainingBalance,
      status: 'unpaid',
      payment_type: 'balance',
      stripe_checkout_session_id: session.id,
    })

    if (paymentError) {
      console.error('Payment record insert error:', paymentError)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Pay balance error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
