import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/reviews — Submit a new review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      booking_id,
      rating,
      comment,
      customer_name,
      customer_email,
      service_name,
    } = body

    // Validate required fields
    if (!customer_name || !customer_email || !service_name) {
      return NextResponse.json(
        { error: 'Name, email, and service name are required' },
        { status: 400 }
      )
    }

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Prevent duplicate reviews for the same booking
    if (booking_id) {
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'A review has already been submitted for this booking' },
          { status: 409 }
        )
      }
    }

    // Look up profile_id from email (if user has an account)
    let profile_id: string | null = null
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customer_email)
      .maybeSingle()

    if (profile) {
      profile_id = profile.id
    }

    // Insert the review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: booking_id || null,
        profile_id,
        customer_name,
        customer_email,
        service_name,
        rating,
        comment: comment || null,
        is_approved: false,
        is_featured: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Review insert error:', error)
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Submit review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews — Get approved reviews
 *
 * Query params:
 *   ?featured=true  — only featured reviews
 *   ?limit=N        — limit results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    const supabase = getServiceClient()

    let query = supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (limit) {
      const n = parseInt(limit, 10)
      if (!isNaN(n) && n > 0) {
        query = query.limit(n)
      }
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Fetch reviews error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
