import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { sendBookingConfirmationEmail } from '@/lib/emails/send'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', message)
      return NextResponse.json(
        { error: `Webhook Error: ${message}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const bookingId = session.metadata?.booking_id
        const paymentType = session.metadata?.payment_type

        if (!bookingId) {
          console.error('No booking_id in session metadata')
          break
        }

        // Update payment record status
        const newPaymentStatus =
          paymentType === 'full' ? 'paid' : 'deposit_paid'

        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: newPaymentStatus,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null,
          })
          .eq('stripe_checkout_session_id', session.id)

        if (paymentUpdateError) {
          console.error('Payment update error:', paymentUpdateError)
        }

        // Update booking status to 'confirmed' if full payment
        if (paymentType === 'full') {
          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId)

          if (bookingUpdateError) {
            console.error('Booking status update error:', bookingUpdateError)
          }

          // Insert status history entry
          const { error: historyError } = await supabase
            .from('booking_status_history')
            .insert({
              booking_id: bookingId,
              status: 'confirmed',
              changed_by: null,
              notes: 'Payment completed - booking confirmed',
            })

          if (historyError) {
            console.error('Status history insert error:', historyError)
          }
        } else {
          // Deposit paid - insert status history but keep booking status as is
          const { error: historyError } = await supabase
            .from('booking_status_history')
            .insert({
              booking_id: bookingId,
              status: 'new',
              changed_by: null,
              notes: 'Deposit payment received',
            })

          if (historyError) {
            console.error('Status history insert error:', historyError)
          }
        }

        // Send booking confirmation email
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*, booking_items:booking_items(name, price)')
          .eq('id', bookingId)
          .single()

        if (bookingData) {
          let serviceName = 'Service'
          if (bookingData.service_id) {
            const { data: svc } = await supabase
              .from('services')
              .select('name')
              .eq('id', bookingData.service_id)
              .single()
            if (svc) serviceName = svc.name
          }
          sendBookingConfirmationEmail(bookingData, serviceName)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object

        // Update payment status to 'failed'
        const { error: failedUpdateError } = await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (failedUpdateError) {
          console.error('Payment failed update error:', failedUpdateError)
        }

        break
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
