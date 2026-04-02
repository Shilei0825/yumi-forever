import { createClient } from '@supabase/supabase-js'
import { analyzeQuoteNotes, type HistoricalData, type QuoteCategory } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const VALID_CATEGORIES: QuoteCategory[] = ['auto_care', 'home_care', 'office']

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { category, notes, ...details } = body

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { factors: [], confidenceAdjustment: 0, suggestion: '' },
        { status: 200 }
      )
    }

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

      // Build category-specific query
      let query = supabase
        .from('bookings')
        .select('total, final_price, adjustment_reason, category')
        .eq('status', 'completed')
        .not('total', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

      // Filter by category
      if (category === 'auto_care') {
        query = query.eq('category', 'auto_care')
      } else if (category === 'home_care') {
        query = query.eq('category', 'home_care')
      } else if (category === 'office') {
        query = query.eq('category', 'office')
      }

      const { data: similarBookings } = await query

      if (similarBookings && similarBookings.length > 0) {
        const matches = similarBookings.slice(0, 20)

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

    const result = await analyzeQuoteNotes(
      category,
      notes.trim(),
      details,
      historicalData
    )

    return NextResponse.json({
      ...result,
      historicalData: historicalData || null,
    })
  } catch (error) {
    console.error('Analyze quote error:', error)
    return NextResponse.json(
      { factors: [], confidenceAdjustment: 0, suggestion: '' },
      { status: 200 }
    )
  }
}
