import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/credits — Get authenticated customer's active review credits
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all credits (active, used, expired)
    const { data: credits, error } = await supabase
      .from('review_credits')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Credits fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
    }

    // Calculate total available
    const now = new Date()
    const activeCredits = (credits || []).filter(
      (c) => c.status === 'active' && new Date(c.expires_at) > now
    )
    const totalAvailable = activeCredits.reduce(
      (sum: number, c: { remaining: number }) => sum + c.remaining,
      0
    )

    return NextResponse.json({
      credits: credits || [],
      totalAvailable,
      activeCount: activeCredits.length,
    })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
