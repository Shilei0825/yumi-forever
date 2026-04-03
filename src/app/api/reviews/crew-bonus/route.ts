import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FIVE_STAR_BONUS = 500 // $5 in cents

/**
 * POST /api/reviews/crew-bonus — Issue crew bonus when admin approves a 5-star review
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { review_id } = await request.json()

    if (!review_id) {
      return NextResponse.json({ error: 'review_id required' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Get the review
    const { data: review, error: reviewError } = await serviceClient
      .from('reviews')
      .select('id, booking_id, rating, is_approved')
      .eq('id', review_id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Only issue bonus for approved 5-star reviews with a booking
    if (!review.is_approved) {
      return NextResponse.json({ error: 'Review must be approved' }, { status: 400 })
    }

    if (review.rating !== 5) {
      return NextResponse.json({ message: 'Bonus only for 5-star reviews' }, { status: 200 })
    }

    if (!review.booking_id) {
      return NextResponse.json({ message: 'No booking associated' }, { status: 200 })
    }

    // Find crew assigned to this booking
    const { data: assignments } = await serviceClient
      .from('dispatch_assignments')
      .select('crew_member_id')
      .eq('booking_id', review.booking_id)

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ message: 'No crew assigned to booking' }, { status: 200 })
    }

    const updatedEntries = []

    for (const assignment of assignments) {
      // Find their payroll entry for this booking
      const { data: entry } = await serviceClient
        .from('payroll_entries')
        .select('id, bonus_amount, review_id')
        .eq('crew_member_id', assignment.crew_member_id)
        .eq('booking_id', review.booking_id)
        .single()

      if (entry) {
        // Skip if already has a review bonus for this review
        if (entry.review_id === review.id) continue

        // Add bonus
        const { data: updated } = await serviceClient
          .from('payroll_entries')
          .update({
            bonus_amount: entry.bonus_amount + FIVE_STAR_BONUS,
            review_id: review.id,
          })
          .eq('id', entry.id)
          .select()
          .single()

        if (updated) updatedEntries.push(updated)
      }

      // Notify crew member
      await serviceClient.from('notifications').insert({
        profile_id: assignment.crew_member_id,
        type: 'review_bonus',
        title: 'Review Bonus Earned!',
        message: `You earned a $${(FIVE_STAR_BONUS / 100).toFixed(0)} bonus for a 5-star review!`,
        metadata: { review_id: review.id, bonus: FIVE_STAR_BONUS },
      })
    }

    return NextResponse.json({
      message: `Bonus issued to ${updatedEntries.length} crew member(s)`,
      entries: updatedEntries,
    })
  } catch (error) {
    console.error('Crew bonus error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
