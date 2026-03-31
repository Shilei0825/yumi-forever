import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin role required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, full_name, phone, pay_type, hourly_rate, per_job_rate, temp_password } = body

    // Validate required fields
    if (!email || !full_name || !temp_password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, temp_password' },
        { status: 400 }
      )
    }

    if (temp_password.length < 8) {
      return NextResponse.json(
        { error: 'Temporary password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (pay_type && !['hourly', 'per_job'].includes(pay_type)) {
      return NextResponse.json(
        { error: 'Invalid pay_type. Must be "hourly" or "per_job"' },
        { status: 400 }
      )
    }

    // Create a service role client for admin user creation
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create the user via Supabase Auth admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,
      user_metadata: {
        role: 'crew',
        full_name,
        phone: phone || null,
      },
    })

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'User creation returned no user' },
        { status: 500 }
      )
    }

    const newUserId = newUser.user.id

    // Insert profile row with role='crew'
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        full_name,
        email,
        phone: phone || null,
        role: 'crew',
      })

    if (profileInsertError) {
      console.error('Insert profile error:', profileInsertError)
      // Attempt to clean up the created auth user on profile insert failure
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { error: profileInsertError.message || 'Failed to create crew profile' },
        { status: 500 }
      )
    }

    // Create crew_pay_profile entry
    const payType = pay_type || 'hourly'
    const { error: payProfileError } = await supabaseAdmin
      .from('crew_pay_profiles')
      .insert({
        profile_id: newUserId,
        pay_type: payType,
        hourly_rate: payType === 'hourly' ? (hourly_rate ?? 0) : null,
        per_job_rate: payType === 'per_job' ? (per_job_rate ?? 0) : null,
        is_active: true,
      })

    if (payProfileError) {
      console.error('Insert pay profile error:', payProfileError)
      // Non-fatal: profile was created, pay profile can be set up later
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        email: newUser.user.email,
        full_name,
        role: 'crew',
      },
    })
  } catch (error) {
    console.error('Admin crew creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
