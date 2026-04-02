import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * One-time setup endpoint to create the admin account.
 * POST /api/setup
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Block re-runs: if admin already exists, deny
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. Admin account exists.' },
        { status: 403 }
      )
    }

    const ADMIN_EMAIL = 'linda20010515@gmail.com'
    const ADMIN_PASSWORD = '12345678'
    const ADMIN_NAME = 'Linda Zhang'

    const results: string[] = []

    // Step 1: Fix the trigger — recreate with error handling
    // Use direct REST API to run SQL
    const fixTriggerSQL = `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, role, full_name, email)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE(NEW.email, '')
        )
        ON CONFLICT (id) DO UPDATE SET
          role = COALESCE(EXCLUDED.role, profiles.role),
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Try to fix trigger via REST API
    const sqlRes = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({}),
    })
    // Ignore result — RPC might not exist

    // Step 2: Check if user exists in auth
    const { data: userList } = await supabase.auth.admin.listUsers()
    const existingUser = userList?.users?.find((u) => u.email === ADMIN_EMAIL)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      results.push('Auth user already exists')

      // Update password
      await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      })
      results.push('Password updated')
    } else {
      // Try to create user — if trigger fails, we'll handle it
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            full_name: ADMIN_NAME,
          },
        })

      if (createError) {
        results.push(`createUser failed: ${createError.message}`)

        // Check if user was partially created
        const { data: retryList } = await supabase.auth.admin.listUsers()
        const partialUser = retryList?.users?.find(
          (u) => u.email === ADMIN_EMAIL
        )

        if (partialUser) {
          userId = partialUser.id
          results.push('Found partially created user')
        } else {
          return NextResponse.json({
            error: 'Cannot create admin user — the handle_new_user trigger is failing.',
            hint: 'Run this SQL in Supabase Dashboard > SQL Editor to fix the trigger, then retry:',
            sql: fixTriggerSQL.trim(),
            results,
          })
        }
      } else {
        userId = newUser!.user!.id
        results.push('Auth user created')
      }
    }

    // Step 3: Upsert profile with admin role
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId!,
          full_name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: 'admin',
        },
        { onConflict: 'id' }
      )

    if (upsertError) {
      results.push(`Profile upsert error: ${upsertError.message}`)
      // Try plain insert
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId!,
        full_name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin',
      })
      if (insertError) {
        results.push(`Profile insert error: ${insertError.message}`)
      } else {
        results.push('Profile inserted')
      }
    } else {
      results.push('Profile upserted with admin role')
    }

    // Step 4: Verify
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('email', ADMIN_EMAIL)
      .single()

    return NextResponse.json({
      message: 'Setup complete',
      profile: finalProfile,
      login: {
        url: '/login/user',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
      results,
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
