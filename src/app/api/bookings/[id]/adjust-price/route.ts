import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is crew or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['crew', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden — crew or admin role required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { finalPrice, reason } = body

    if (!finalPrice || typeof finalPrice !== 'number' || finalPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid final price' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json(
        { error: 'Adjustment reason is required (min 3 characters)' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // If crew, verify they are assigned to this booking
    if (profile.role === 'crew') {
      const { data: assignment } = await serviceSupabase
        .from('dispatch_assignments')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('crew_member_id', user.id)
        .limit(1)

      if (!assignment || assignment.length === 0) {
        return NextResponse.json(
          { error: 'You are not assigned to this booking' },
          { status: 403 }
        )
      }
    }

    // Verify booking exists
    const { data: booking, error: fetchError } = await serviceSupabase
      .from('bookings')
      .select('id, total, final_price')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Convert dollars to cents
    const finalPriceCents = Math.round(finalPrice * 100)

    // Update booking with adjusted price
    const { error: updateError } = await serviceSupabase
      .from('bookings')
      .update({
        final_price: finalPriceCents,
        price_adjusted: true,
        adjustment_reason: reason.trim(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Price adjustment update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update price' },
        { status: 500 }
      )
    }

    // Add audit trail entry
    await serviceSupabase.from('booking_status_history').insert({
      booking_id: bookingId,
      status: 'price_adjusted',
      notes: `Price adjusted by ${profile.full_name} (${profile.role}): $${(booking.total / 100).toFixed(2)} → $${finalPrice.toFixed(2)}. Reason: ${reason.trim()}`,
      changed_by: user.id,
    })

    return NextResponse.json({
      success: true,
      originalTotal: booking.total,
      finalPrice: finalPriceCents,
    })
  } catch (error) {
    console.error('Price adjustment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
