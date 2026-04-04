import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { evaluateCancellationPolicy } from '@/lib/recurring-pricing'
import { normalizePhone } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const supabase = await createClient()

    // Look up the booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, scheduled_date, scheduled_time, deposit_amount, customer_email, customer_phone')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Evaluate cancellation policy
    const result = evaluateCancellationPolicy(
      booking.scheduled_date,
      booking.scheduled_time,
      booking.deposit_amount ?? 0,
      booking.status
    )

    if (!result.canCancel) {
      return NextResponse.json(
        { error: result.reason },
        { status: 400 }
      )
    }

    const newStatus = result.isRefundable
      ? 'canceled_refundable'
      : 'canceled_nonrefundable'

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    // Insert status history record
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status: newStatus,
        changed_by: null,
        notes: result.isRefundable
          ? 'Booking canceled — deposit refundable'
          : 'Booking canceled — deposit non-refundable (within 24 hours)',
      })

    if (historyError) {
      console.error('Status history insert error:', historyError)
    }

    // Record violation for late cancellations (within 24 hours)
    if (!result.isRefundable) {
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const normalizedPhone = booking.customer_phone ? normalizePhone(booking.customer_phone) : null
      const normalizedEmail = booking.customer_email?.toLowerCase().trim() || null

      const { error: violationError } = await supabaseAdmin
        .from('customer_violations')
        .insert({
          customer_email: normalizedEmail,
          customer_phone: normalizedPhone,
          violation_type: 'late_cancellation',
          booking_id: bookingId,
          notes: 'Canceled within 24 hours of scheduled service',
        })

      if (violationError) {
        console.error('Violation insert error:', violationError)
      }
    }

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      status: newStatus,
      isRefundable: result.isRefundable,
      refundableAmount: result.refundableAmount,
      reason: result.reason,
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
