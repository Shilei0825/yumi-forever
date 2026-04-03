import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const errors: { field: string; message: string }[] = []

    // Check email in profiles
    if (email) {
      const { data: emailMatch } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1)
        .maybeSingle()

      if (emailMatch) {
        errors.push({
          field: 'email',
          message: 'This email is already associated with an account.',
        })
      }
    }

    // Check phone in profiles (normalize to digits only)
    if (phone && phone.trim()) {
      const normalized = phone.replace(/\D/g, '')
      if (normalized.length >= 10) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('phone')
          .not('phone', 'is', null)

        const phoneMatch = profiles?.some((p) => {
          const pNormalized = (p.phone || '').replace(/\D/g, '')
          return pNormalized === normalized
        })

        if (phoneMatch) {
          errors.push({
            field: 'phone',
            message: 'This phone number is already associated with an account.',
          })
        }
      }
    }

    return NextResponse.json({ errors })
  } catch {
    return NextResponse.json({ errors: [] })
  }
}
