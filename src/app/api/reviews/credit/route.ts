import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { REVIEW_CREDIT_CONFIG } from '@/lib/payroll'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/reviews/credit — Issue a review credit when admin approves a review
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
      .select('id, profile_id, rating, credit_issued, is_approved')
      .eq('id', review_id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Only issue credit for approved reviews with a logged-in customer
    if (!review.is_approved) {
      return NextResponse.json({ error: 'Review must be approved first' }, { status: 400 })
    }

    if (!review.profile_id) {
      return NextResponse.json({ error: 'No customer profile — guest reviews do not earn credits' }, { status: 400 })
    }

    if (review.credit_issued) {
      return NextResponse.json({ error: 'Credit already issued for this review' }, { status: 400 })
    }

    // Check max active credits
    const { count } = await serviceClient
      .from('review_credits')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', review.profile_id)
      .eq('status', 'active')

    if ((count || 0) >= REVIEW_CREDIT_CONFIG.MAX_ACTIVE_CREDITS) {
      return NextResponse.json({
        error: `Customer already has ${REVIEW_CREDIT_CONFIG.MAX_ACTIVE_CREDITS} active credits`,
      }, { status: 400 })
    }

    // Flat $10 credit for any approved review
    const creditAmount = REVIEW_CREDIT_CONFIG.ANY_REVIEW_CREDIT

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REVIEW_CREDIT_CONFIG.CREDIT_EXPIRY_DAYS)

    // Create the credit
    const { data: credit, error: creditError } = await serviceClient
      .from('review_credits')
      .insert({
        profile_id: review.profile_id,
        review_id: review.id,
        amount: creditAmount,
        remaining: creditAmount,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (creditError) {
      console.error('Credit creation error:', creditError)
      return NextResponse.json({ error: 'Failed to create credit' }, { status: 500 })
    }

    // Mark review as credit issued
    await serviceClient
      .from('reviews')
      .update({ credit_issued: true })
      .eq('id', review.id)

    // Insert notification for customer
    await serviceClient.from('notifications').insert({
      profile_id: review.profile_id,
      type: 'review_credit',
      title: 'Review Reward Earned!',
      message: `You earned a $${(creditAmount / 100).toFixed(0)} credit for your review. It will be applied to your next booking!`,
      metadata: { credit_id: credit.id, amount: creditAmount },
    })

    return NextResponse.json({ credit })
  } catch (error) {
    console.error('Issue credit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
