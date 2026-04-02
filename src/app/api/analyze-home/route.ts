import { createClient } from '@supabase/supabase-js'
import { analyzeHomeNotes, type HistoricalData } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { notes, bedrooms, bathrooms, sqft, buildingType, carpetType, serviceType } = body

    if (!notes || typeof notes !== 'string' || notes.trim().length < 3) {
      return NextResponse.json(
        { factors: [], confidenceAdjustment: 0, suggestion: '' },
        { status: 200 }
      )
    }

    // Query historical data for similar bookings
    let historicalData: HistoricalData | undefined
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Query completed bookings with home details
      const { data: similarBookings } = await supabase
        .from('bookings')
        .select('total, final_price, adjustment_reason, booking_home_details(bedrooms, bathrooms, sqft, building_type)')
        .eq('status', 'completed')
        .not('total', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (similarBookings && similarBookings.length > 0) {
        // Filter in JS for flexible matching
        const sqftNum = sqft ? parseInt(sqft, 10) : null
        const bedsNum = bedrooms ? parseInt(bedrooms, 10) : null

        const filtered = similarBookings.filter((b) => {
          const hd = Array.isArray(b.booking_home_details)
            ? b.booking_home_details[0]
            : b.booking_home_details
          if (!hd) return false

          if (buildingType && hd.building_type && hd.building_type !== buildingType) return false
          if (bedsNum !== null && hd.bedrooms !== null) {
            if (Math.abs(hd.bedrooms - bedsNum) > 1) return false
          }
          if (sqftNum && hd.sqft) {
            const ratio = hd.sqft / sqftNum
            if (ratio < 0.7 || ratio > 1.3) return false
          }
          return true
        })

        const matches = filtered.length > 0 ? filtered : similarBookings.slice(0, 20)

        // Calculate stats
        const adjusted = matches.filter((b) => b.final_price !== null && b.final_price !== b.total)
        const adjustmentRate = matches.length > 0 ? (adjusted.length / matches.length) * 100 : 0

        let avgDeviation = 0
        if (adjusted.length > 0) {
          const deviations = adjusted.map((b) => {
            return Math.abs((b.final_price! - b.total) / b.total) * 100
          })
          avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
        }

        const reasons = adjusted
          .map((b) => b.adjustment_reason)
          .filter((r): r is string => !!r && r.trim().length > 0)
        const uniqueReasons = [...new Set(reasons)].slice(0, 5)

        historicalData = {
          matchCount: matches.length,
          avgDeviation,
          adjustmentRate,
          commonReasons: uniqueReasons,
        }
      }
    } catch (dbErr) {
      console.error('Historical data query error:', dbErr)
    }

    const result = await analyzeHomeNotes(
      notes.trim(),
      { bedrooms, bathrooms, sqft, buildingType, carpetType, serviceType },
      historicalData
    )

    return NextResponse.json({
      ...result,
      historicalData: historicalData || null,
    })
  } catch (error) {
    console.error('Analyze home error:', error)
    return NextResponse.json(
      { factors: [], confidenceAdjustment: 0, suggestion: '' },
      { status: 200 }
    )
  }
}
