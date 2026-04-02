import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getSquareClient } from '@/lib/square'
import { NextResponse } from 'next/server'
import { sendBookingConfirmationEmail } from '@/lib/emails/send'

export const runtime = 'nodejs'

function verifySquareWebhook(
  body: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  const hmac = crypto.createHmac('sha256', signatureKey)
  hmac.update(notificationUrl + body)
  const expectedSignature = hmac.digest('base64')
  return signature === expectedSignature
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-square-hmacsha256-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Square signature header' },
        { status: 400 }
      )
    }

    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
    const webhookUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || 'https://yumiforever.com') +
      '/api/square/webhook'

    // Verify webhook signature
    if (signatureKey) {
      const isValid = verifySquareWebhook(
        body,
        signature,
        signatureKey,
        webhookUrl
      )

      if (!isValid) {
        console.error('Square webhook signature verification failed')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        )
      }
    }

    const event = JSON.parse(body)

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const squareClient = getSquareClient()

    if (event.type === 'payment.updated') {
      const payment = event.data?.object?.payment
      if (!payment) {
        console.error('No payment object in webhook event')
        return NextResponse.json({ received: true })
      }

      // Handle failed payments
      if (payment.status === 'FAILED' && payment.order_id) {
        const { error: failedUpdateError } = await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('square_order_id', payment.order_id)

        if (failedUpdateError) {
          console.error('Payment failed update error:', failedUpdateError)
        }
        return NextResponse.json({ received: true })
      }

      // Handle completed payments
      if (payment.status === 'COMPLETED') {
        const squarePaymentId = payment.id
        const squareOrderId = payment.order_id

        // Look up the order to get metadata
        let bookingId: string | undefined
        let paymentType: string | undefined
        let paymentLinkToken: string | undefined

        if (squareOrderId) {
          try {
            const orderResponse = await squareClient.orders.get(squareOrderId)
            const metadata = orderResponse.order?.metadata
            bookingId = metadata?.booking_id || orderResponse.order?.referenceId || undefined
            paymentType = metadata?.payment_type ?? undefined
            paymentLinkToken = metadata?.payment_link_token ?? undefined
          } catch (err) {
            console.error('Failed to retrieve Square order:', err)
          }
        }

        // Fallback: try to find by square_order_id in our payments table
        if (!bookingId && squareOrderId) {
          const { data: paymentRecord } = await supabase
            .from('payments')
            .select('booking_id')
            .eq('square_order_id', squareOrderId)
            .single()

          if (paymentRecord) {
            bookingId = paymentRecord.booking_id
          }
        }

        if (!bookingId) {
          console.error('Could not determine booking_id from Square webhook')
          return NextResponse.json({ received: true })
        }

        // Update payment record status
        const newPaymentStatus =
          paymentType === 'full' ? 'paid' : paymentType === 'remaining_balance' ? 'paid' : paymentType === 'balance' ? 'paid' : 'deposit_paid'

        if (squareOrderId) {
          const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
              status: newPaymentStatus,
              square_payment_id: squarePaymentId || null,
            })
            .eq('square_order_id', squareOrderId)

          if (paymentUpdateError) {
            console.error('Payment update error:', paymentUpdateError)
          }
        }

        // Update booking status
        if (paymentType === 'full' || paymentType === 'remaining_balance' || paymentType === 'balance') {
          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed', payment_status: 'paid' })
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
          // Deposit paid
          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({ payment_status: 'deposit_paid' })
            .eq('id', bookingId)

          if (bookingUpdateError) {
            console.error('Booking payment status update error:', bookingUpdateError)
          }

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
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Square webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
