import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json()

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for violations by email OR phone
    let query = supabase.from('customer_violations').select('id, violation_type, created_at, notes')

    const normalizedPhone = phone ? normalizePhone(phone) : null
    const normalizedEmail = email?.toLowerCase().trim()

    if (normalizedEmail && normalizedPhone) {
      query = query.or(`customer_email.eq.${normalizedEmail},customer_phone.eq.${normalizedPhone}`)
    } else if (normalizedEmail) {
      query = query.eq('customer_email', normalizedEmail)
    } else if (normalizedPhone) {
      query = query.eq('customer_phone', normalizedPhone)
    }

    const { data: violations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Deposit check error:', error)
      return NextResponse.json({ deposit_required: false })
    }

    if (violations && violations.length > 0) {
      const latest = violations[0]
      const typeLabel = latest.violation_type === 'no_show' ? 'no-show' : 'late cancellation'
      const date = new Date(latest.created_at).toLocaleDateString()

      return NextResponse.json({
        deposit_required: true,
        reason: `Previous ${typeLabel} on ${date}`,
        violation_count: violations.length,
      })
    }

    return NextResponse.json({ deposit_required: false })
  } catch (error) {
    console.error('Deposit check error:', error)
    return NextResponse.json({ deposit_required: false })
  }
}
