import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Yumi, the friendly customer support assistant for Yumi Forever — a professional cleaning and detailing company serving the NYC & NJ area.

Services we offer:
- Auto Detailing: Express Exterior ($149+), Express Interior ($169+), Express In & Out ($269+), Premium Exterior ($349+), Premium Interior ($389+), Premium Detail ($579+)
- Home Cleaning: Standard Cleaning ($130+), Deep Cleaning ($220+), Move-In/Move-Out ($260+), Carpet Cleaning ($100+)
- Office & Commercial Cleaning: Essential, Professional, Premier plans (monthly contracts)
- Truck & Fleet Services: Fleet Wash, Fleet Detailing, Commercial Contracts (quote-based)

Key info:
- Phone: (555) 123-4567
- Email: support@yumiforever.com
- Website: yumiforever.com
- We come to you — mobile service
- Service area: Northern NJ, NYC boroughs
- Prices vary by vehicle size and home size

Guidelines:
- Keep responses short and helpful (2-3 sentences max)
- Be warm and professional
- For booking questions, direct them to our booking pages or suggest calling
- For pricing, you can share the starting prices above and note they vary by size
- For complaints or urgent issues, suggest calling directly or emailing support@yumiforever.com
- If they want to talk to a real person, let them know their message will be forwarded to the team`

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function callGemini(message: string, history: { sender: string; message: string }[]) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const chatHistory = (history || []).map((msg) => ({
    role: msg.sender === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: msg.message }],
  }))

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'System instructions: ' + SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood! I\'m Yumi, ready to help customers of Yumi Forever.' }] },
      ...chatHistory,
    ],
  })

  const result = await chat.sendMessage(message)
  return result.response.text()
}

export async function POST(request: Request) {
  try {
    const { message, sessionId, history } = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing message or sessionId' }, { status: 400 })
    }

    let botReply: string

    try {
      botReply = await callGemini(message, history || [])
    } catch (error: unknown) {
      // Rate limit — retry once after delay
      const isRateLimit = error instanceof Error && error.message?.includes('429')
      if (isRateLimit) {
        await new Promise((r) => setTimeout(r, 8000))
        try {
          botReply = await callGemini(message, history || [])
        } catch {
          // Store user message anyway and return helpful fallback
          const supabase = getSupabaseClient()
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            sender: 'user',
            message,
          })
          return NextResponse.json({
            reply: "Thanks for your message! Our AI assistant is currently busy. Your message has been saved and our team will get back to you. In the meantime, feel free to call us at (555) 123-4567 or email support@yumiforever.com.",
          })
        }
      } else {
        throw error
      }
    }

    // Store both messages in DB
    const supabase = getSupabaseClient()
    await supabase.from('chat_messages').insert([
      { session_id: sessionId, sender: 'user', message },
      { session_id: sessionId, sender: 'bot', message: botReply },
    ])

    return NextResponse.json({ reply: botReply })
  } catch (error) {
    console.error('Chat API error:', error)

    // Still store the user message
    try {
      const { message, sessionId } = await request.clone().json()
      if (message && sessionId) {
        const supabase = getSupabaseClient()
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          sender: 'user',
          message,
        })
      }
    } catch { /* ignore storage failure */ }

    return NextResponse.json({
      reply: "Thanks for reaching out! Our AI assistant is temporarily unavailable. Your message has been saved — our team will review it. You can also call us at (555) 123-4567 or email support@yumiforever.com.",
    })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ messages: [] })
    }

    const supabase = getSupabaseClient()

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    return NextResponse.json({ messages: data || [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}
