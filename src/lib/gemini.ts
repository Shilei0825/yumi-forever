// ---------------------------------------------------------------------------
// Google Gemini API Client — Free tier (gemini-2.0-flash)
// ---------------------------------------------------------------------------

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
  }[]
}

export interface HistoricalData {
  matchCount: number
  avgDeviation: number // percentage, e.g. 12 means quotes were off by 12% on average
  adjustmentRate: number // percentage of bookings that needed adjustment
  commonReasons: string[]
}

export interface HomeAnalysisResult {
  factors: string[]
  confidenceAdjustment: number
  suggestion: string
}

export async function analyzeHomeNotes(
  notes: string,
  context: {
    bedrooms?: string
    bathrooms?: string
    sqft?: string
    buildingType?: string
    carpetType?: string
    serviceType?: string
  },
  historicalData?: HistoricalData
): Promise<HomeAnalysisResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    return { factors: [], confidenceAdjustment: 0, suggestion: '' }
  }

  let historicalSection = ''
  if (historicalData && historicalData.matchCount > 0) {
    historicalSection = `
Historical data from ${historicalData.matchCount} similar past bookings:
- ${historicalData.adjustmentRate.toFixed(0)}% of similar bookings needed on-site price adjustment
- Average price deviation when adjusted: ${historicalData.avgDeviation.toFixed(1)}%
- Common adjustment reasons: ${historicalData.commonReasons.length > 0 ? historicalData.commonReasons.join(', ') : 'none recorded'}

Use this data to calibrate your confidence assessment. If many similar bookings needed adjustment, lower confidence. If few needed adjustment, this is a more predictable setup.`
  } else {
    historicalSection = `
No historical data available for similar bookings yet. Without past data to compare against, be more conservative with confidence (lean toward lower confidence).`
  }

  const prompt = `You are a professional home cleaning pricing expert with access to historical booking data. A customer is booking a cleaning service and has provided details about their home.

Customer's home details:
- Building: ${context.buildingType || 'not specified'}
- Bedrooms: ${context.bedrooms || 'not specified'}
- Bathrooms: ${context.bathrooms || 'not specified'}
- Square footage: ${context.sqft || 'not specified'}
- Carpet: ${context.carpetType || 'not specified'}
- Service type: ${context.serviceType || 'standard cleaning'}

Customer's notes: "${notes}"
${historicalSection}

Analyze the notes and historical patterns to assess how accurate our price quote is likely to be. Consider:
- Extra rooms or large spaces (walk-in closets, sunrooms, bonus rooms, finished basements)
- Unusual features (high ceilings, lots of windows, heavy furniture)
- Special cleaning needs mentioned
- How well the description matches our pricing model
- Historical accuracy for similar setups

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "factors": ["factor1", "factor2"],
  "confidenceAdjustment": -5,
  "suggestion": "Brief suggestion for the customer about quote accuracy"
}

Rules for confidenceAdjustment (this adjusts our base confidence score):
- +5 to +10 if notes confirm simple/standard layout AND historical data shows high accuracy
- 0 if notes don't significantly affect pricing
- -3 to -8 if notes suggest minor additional work or moderate complexity
- -10 to -20 if notes suggest major additional work or complexity
- -20 to -30 if notes describe highly unusual property that's hard to estimate

Keep suggestion under 120 characters. Return 1-4 factors max.`

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      }),
    })

    if (!res.ok) {
      console.error('Gemini API error:', res.status)
      return { factors: [], confidenceAdjustment: 0, suggestion: '' }
    }

    const data: GeminiResponse = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!text) {
      return { factors: [], confidenceAdjustment: 0, suggestion: '' }
    }

    // Parse JSON — handle potential markdown code fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 4) : [],
      confidenceAdjustment:
        typeof parsed.confidenceAdjustment === 'number'
          ? Math.max(-30, Math.min(10, parsed.confidenceAdjustment))
          : 0,
      suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion.slice(0, 150) : '',
    }
  } catch (err) {
    console.error('Gemini analysis error:', err)
    return { factors: [], confidenceAdjustment: 0, suggestion: '' }
  }
}
