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

    // Only link by the user's VERIFIED auth email (not profile data, which could be spoofed)
    const verifiedEmail = user.email
    if (!verifiedEmail) {
      return NextResponse.json({ linked: 0 })
    }

    const { data: emailLinked } = await supabaseAdmin
      .from('bookings')
      .update({ profile_id: user.id })
      .is('profile_id', null)
      .ilike('customer_email', verifiedEmail)
      .select('id')

    linked += emailLinked?.length || 0

    return NextResponse.json({ linked })
  } catch (error) {
    console.error('Link bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
