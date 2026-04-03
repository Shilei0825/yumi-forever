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

export interface QuoteAnalysisResult {
  factors: string[]
  confidenceAdjustment: number
  suggestion: string
}

// Keep old type for backward compatibility
export type HomeAnalysisResult = QuoteAnalysisResult

export type QuoteCategory = 'auto_care' | 'home_care' | 'office'

// ---------------------------------------------------------------------------
// Unified quote analysis — works for all service categories
// ---------------------------------------------------------------------------

export async function analyzeQuoteNotes(
  category: QuoteCategory,
  notes: string,
  details: Record<string, string>,
  historicalData?: HistoricalData
): Promise<QuoteAnalysisResult> {
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

Use this data to calibrate your confidence assessment.`
  } else {
    historicalSection = `
No historical data available for similar bookings yet. Be more conservative with confidence.`
  }

  const categoryPrompts: Record<QuoteCategory, string> = {
    auto_care: `You are a professional auto detailing pricing expert. A customer is booking a vehicle detailing service.

Customer's vehicle details:
- Vehicle type: ${details.vehicleType || 'not specified'}
- Service: ${details.serviceType || 'not specified'}
- Condition: ${details.condition || 'not specified'}

Customer's notes: "${notes}"
${historicalSection}

Analyze the notes for factors affecting pricing accuracy. Consider:
- Vehicle condition beyond checkboxes (hidden stains, pet damage severity, paint condition)
- Interior material types (leather vs fabric, specialty surfaces)
- Aftermarket modifications (tinted windows, wraps, custom paint)
- Unusual vehicle sizes or configurations
- How well the description matches our pricing model`,

    home_care: `You are a professional home cleaning pricing expert. A customer is booking a cleaning service.

Customer's home details:
- Building: ${details.buildingType || 'not specified'}
- Bedrooms: ${details.bedrooms || 'not specified'}
- Bathrooms: ${details.bathrooms || 'not specified'}
- Square footage: ${details.sqft || 'not specified'}
- Carpet: ${details.carpetType || 'not specified'}
- Service type: ${details.serviceType || 'standard cleaning'}

Customer's notes: "${notes}"
${historicalSection}

Analyze the notes for factors affecting pricing accuracy. Consider:
- Extra rooms or large spaces (walk-in closets, sunrooms, finished basements)
- Unusual features (high ceilings, lots of windows, heavy furniture)
- Special cleaning needs mentioned
- How well the description matches our pricing model`,

    office: `You are a professional commercial cleaning pricing expert. A customer is requesting a quote for commercial cleaning.

Customer's business details:
- Business type: ${details.businessType || 'not specified'}
- Space size: ${details.spaceSize || 'not specified'} sqft
- Restrooms: ${details.restrooms || 'not specified'}
- Service level: ${details.serviceLevel || 'not specified'}
- Frequency: ${details.frequency || 'not specified'}

Customer's notes: "${notes}"
${historicalSection}

Analyze the notes for factors affecting pricing accuracy. Consider:
- Specialized equipment needs (medical-grade, food service, industrial)
- After-hours access requirements or security constraints
- High-traffic areas requiring extra attention
- Industry-specific sanitation requirements
- Floor type variations (carpet, tile, concrete, specialty flooring)
- Unusual layout or multi-level spaces`,
  }

  const prompt = `${categoryPrompts[category]}

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "factors": ["factor1", "factor2"],
  "confidenceAdjustment": -5,
  "suggestion": "Brief suggestion for the customer about quote accuracy"
}

Rules for confidenceAdjustment — this value DIRECTLY affects the displayed quote accuracy percentage:
- +8 to +12 if notes provide genuinely useful details that help VERIFY the estimate (e.g. describing exact condition, listing specific areas, confirming standard layout, mentioning relevant details about the space/vehicle)
- +3 to +7 if notes contain some helpful details but are partially vague
- 0 if notes are generic platitudes like "please clean well" or "do a good job" — these add no pricing information
- -3 to -8 if notes suggest minor additional work or moderate complexity
- -10 to -20 if notes suggest major additional work or unusual complexity
- -20 to -30 if notes describe highly unusual situation that's hard to estimate

The KEY question is: do the customer's notes help us VERIFY that our pricing model matches their actual situation? Specific, detailed descriptions of the space/vehicle/condition increase accuracy. Vague or irrelevant comments do not.

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

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 4) : [],
      confidenceAdjustment:
        typeof parsed.confidenceAdjustment === 'number'
          ? Math.max(-30, Math.min(12, parsed.confidenceAdjustment))
          : 0,
      suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion.slice(0, 150) : '',
    }
  } catch (err) {
    console.error('Gemini analysis error:', err)
    return { factors: [], confidenceAdjustment: 0, suggestion: '' }
  }
}

// ---------------------------------------------------------------------------
// Legacy wrapper — still used by /api/analyze-home
// ---------------------------------------------------------------------------

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
  return analyzeQuoteNotes('home_care', notes, context, historicalData)
}
