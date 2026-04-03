import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/** GET — fetch customer details for chat sidebar (admin/crew) */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: viewer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!viewer || !['admin', 'crew', 'dispatcher'].includes(viewer.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profileId = request.nextUrl.searchParams.get('profileId')
    if (!profileId) {
      return NextResponse.json({ customer: null })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch profile
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .eq('id', profileId)
      .single()

    if (!profile) {
      return NextResponse.json({ customer: null })
    }

    // Fetch bookings (recent 10)
    const { data: bookings } = await serviceClient
      .from('bookings')
      .select('id, booking_number, status, payment_status, scheduled_date, scheduled_time, total, service_notes, address_text, vehicle_info, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch reviews
    const { data: reviews } = await serviceClient
      .from('reviews')
      .select('id, rating, comment, is_approved, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch active credits
    const { data: credits } = await serviceClient
      .from('review_credits')
      .select('id, amount, remaining, status, expires_at')
      .eq('profile_id', profileId)
      .eq('status', 'active')

    // For crew — exclude payment details
    const isCrew = viewer.role === 'crew'

    const customer = {
      ...profile,
      bookings: (bookings || []).map((b) => ({
        id: b.id,
        booking_number: b.booking_number,
        status: b.status,
        scheduled_date: b.scheduled_date,
        scheduled_time: b.scheduled_time,
        address_text: b.address_text,
        vehicle_info: b.vehicle_info,
        service_notes: b.service_notes,
        created_at: b.created_at,
        // Hide financial info from crew
        ...(isCrew ? {} : {
          payment_status: b.payment_status,
          total: b.total,
        }),
      })),
      reviews: reviews || [],
      credits: isCrew ? [] : (credits || []),
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Chat customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
