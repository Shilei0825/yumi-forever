import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile for phone
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, phone')
      .eq('id', user.id)
      .single()

    let linked = 0

    // Link by email (case-insensitive)
    if (user.email) {
      const { data: emailLinked } = await supabaseAdmin
        .from('bookings')
        .update({ profile_id: user.id })
        .is('profile_id', null)
        .ilike('customer_email', user.email)
        .select('id')

      linked += emailLinked?.length || 0
    }

    // Link by phone if available (normalize both sides)
    const phone = profile?.phone
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '')
      if (normalizedPhone) {
        const { data: phoneLinked } = await supabaseAdmin
          .from('bookings')
          .update({ profile_id: user.id })
          .is('profile_id', null)
          .eq('customer_phone', normalizedPhone)
          .select('id')

        linked += phoneLinked?.length || 0
      }
    }

    return NextResponse.json({ linked })
  } catch (error) {
    console.error('Link bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
