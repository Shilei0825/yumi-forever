import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  calculateDailyPay,
  calculateWeeklyPay,
  type CrewRole,
  type CompletedJob,
} from '@/lib/payroll'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/admin/payroll/generate — Generate weekly payroll records
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

    const { week_start, week_end } = await request.json()

    if (!week_start || !week_end) {
      return NextResponse.json(
        { error: 'week_start and week_end required' },
        { status: 400 }
      )
    }

    const serviceClient = getServiceClient()

    // Get all completed bookings in the date range
    const { data: bookings } = await serviceClient
      .from('bookings')
      .select(`
        id, total, final_price, scheduled_date, completed_at,
        dispatch_assignments(crew_member_id, crew_role),
        reviews(id, rating, is_approved)
      `)
      .eq('status', 'completed')
      .gte('scheduled_date', week_start)
      .lte('scheduled_date', week_end)

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'No completed bookings in period' }, { status: 200 })
    }

    // Group by crew member
    const crewJobs = new Map<string, { role: CrewRole; jobs: CompletedJob[]; dates: Set<string> }>()

    for (const booking of bookings) {
      const assignments = (booking.dispatch_assignments || []) as {
        crew_member_id: string
        crew_role: string | null
      }[]
      const reviews = (booking.reviews || []) as {
        id: string
        rating: number
        is_approved: boolean
      }[]

      const approvedReview = reviews.find((r) => r.is_approved)
      const finalPrice = booking.final_price || booking.total || 0

      for (const assignment of assignments) {
        const crewId = assignment.crew_member_id
        const role = (assignment.crew_role as CrewRole) || 'helper'

        if (!crewJobs.has(crewId)) {
          crewJobs.set(crewId, { role, jobs: [], dates: new Set() })
        }

        const crew = crewJobs.get(crewId)!
        crew.dates.add(booking.scheduled_date)
        crew.jobs.push({
          bookingId: booking.id,
          finalPrice,
          hasReview: !!approvedReview,
          reviewRating: approvedReview?.rating || 0,
        })
      }
    }

    // Generate payroll for each crew member
    const generated = []

    for (const [crewId, data] of crewJobs) {
      // Check if payroll already exists for this period + crew
      const { data: existing } = await serviceClient
        .from('crew_payroll')
        .select('id')
        .eq('crew_member_id', crewId)
        .eq('period_start', week_start)
        .eq('period_end', week_end)
        .single()

      if (existing) continue // Skip if already generated

      // Calculate daily results
      const dailyResults = []
      const sortedDates = Array.from(data.dates).sort()

      for (const date of sortedDates) {
        const dayJobs = data.jobs.filter((j) => {
          const booking = bookings.find((b) => b.id === j.bookingId)
          return booking?.scheduled_date === date
        })

        const dailyResult = calculateDailyPay(crewId, data.role, date, dayJobs)
        dailyResults.push(dailyResult)
      }

      // Calculate weekly summary
      const weeklySummary = calculateWeeklyPay(
        crewId,
        data.role,
        week_start,
        week_end,
        dailyResults,
        data.jobs
      )

      // Insert crew_payroll record
      const { data: payroll, error: payrollError } = await serviceClient
        .from('crew_payroll')
        .insert({
          crew_member_id: crewId,
          period_start: week_start,
          period_end: week_end,
          role: data.role,
          total_jobs: weeklySummary.totalJobs,
          total_revenue: weeklySummary.totalRevenue,
          total_commission: dailyResults.reduce((s, d) => s + d.totalCommission, 0),
          base_pay: dailyResults.reduce((s, d) => s + d.adjustedBase, 0),
          review_bonus: dailyResults.reduce((s, d) => s + d.reviewBonus, 0),
          weekly_bonus: weeklySummary.weeklyReviewBonus,
          total_pay: weeklySummary.totalPay,
          five_star_count: weeklySummary.fiveStarCount,
          status: 'pending',
        })
        .select()
        .single()

      if (payrollError) {
        console.error('Payroll insert error:', payrollError)
        continue
      }

      generated.push(payroll)
    }

    return NextResponse.json({
      message: `Generated ${generated.length} payroll record(s)`,
      records: generated,
    })
  } catch (error) {
    console.error('Generate payroll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
