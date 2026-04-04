import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const supabase = await createClient()

    // Auth check — only admin and crew can mark no-show
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'crew', 'dispatcher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, customer_email, customer_phone, booking_number')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Parse request body for optional notes
    let notes = 'Customer did not show up for scheduled service'
    try {
      const body = await request.json()
      if (body.notes) notes = body.notes
    } catch {
      // No body provided, use default notes
    }

    // Update booking status to no_show
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'no_show' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('No-show update error:', updateError)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    // Record violation
    const normalizedPhone = booking.customer_phone ? normalizePhone(booking.customer_phone) : null
    const normalizedEmail = booking.customer_email?.toLowerCase().trim() || null

    const { error: violationError } = await supabaseAdmin
      .from('customer_violations')
      .insert({
        customer_email: normalizedEmail,
        customer_phone: normalizedPhone,
        violation_type: 'no_show',
        booking_id: bookingId,
        notes,
      })

    if (violationError) {
      console.error('Violation insert error:', violationError)
    }

    // Insert status history
    await supabaseAdmin.from('booking_status_history').insert({
      booking_id: bookingId,
      status: 'no_show',
      changed_by: user.id,
      notes: `Marked as no-show: ${notes}`,
    })

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      status: 'no_show',
    })
  } catch (error) {
    console.error('No-show error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
