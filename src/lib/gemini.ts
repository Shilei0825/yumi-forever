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
  }
): Promise<HomeAnalysisResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    return { factors: [], confidenceAdjustment: 0, suggestion: '' }
  }

  const prompt = `You are a professional home cleaning pricing expert. A customer is booking a cleaning service and has provided additional notes about their home layout.

Customer's home details:
- Building: ${context.buildingType || 'not specified'}
- Bedrooms: ${context.bedrooms || 'not specified'}
- Bathrooms: ${context.bathrooms || 'not specified'}
- Square footage: ${context.sqft || 'not specified'}
- Carpet: ${context.carpetType || 'not specified'}
- Service type: ${context.serviceType || 'standard cleaning'}

Customer's notes: "${notes}"

Analyze the notes and identify factors that could affect the cleaning price quote. Consider:
- Extra rooms or large spaces (walk-in closets, sunrooms, bonus rooms, finished basements)
- Unusual features (high ceilings, lots of windows, heavy furniture)
- Special cleaning needs mentioned
- Anything that suggests the home is larger or more complex than the basic details indicate

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "factors": ["factor1", "factor2"],
  "confidenceAdjustment": -5,
  "suggestion": "Brief suggestion for the customer about quote accuracy"
}

Rules for confidenceAdjustment:
- 0 if notes don't significantly affect pricing
- -3 to -8 if notes suggest minor additional work
- -10 to -20 if notes suggest major additional work or complexity
- +5 if notes confirm the space is simple/standard

Keep suggestion under 100 characters. Return 1-4 factors max.`

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
          ? Math.max(-20, Math.min(5, parsed.confidenceAdjustment))
          : 0,
      suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion.slice(0, 150) : '',
    }
  } catch (err) {
    console.error('Gemini analysis error:', err)
    return { factors: [], confidenceAdjustment: 0, suggestion: '' }
  }
}
