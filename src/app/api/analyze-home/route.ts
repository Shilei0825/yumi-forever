import { analyzeHomeNotes } from '@/lib/gemini'
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

    const result = await analyzeHomeNotes(notes.trim(), {
      bedrooms,
      bathrooms,
      sqft,
      buildingType,
      carpetType,
      serviceType,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analyze home error:', error)
    return NextResponse.json(
      { factors: [], confidenceAdjustment: 0, suggestion: '' },
      { status: 200 }
    )
  }
}
