import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Yumi, the friendly customer support assistant for Yumi Forever — a professional cleaning and detailing company serving the NYC & NJ area.

Services we offer:
- Auto Detailing: Express Exterior, Express Interior, Express In & Out, Premium Exterior, Premium Interior, Premium Detail
- Home Cleaning: Standard Cleaning, Deep Cleaning, Move-In/Move-Out Cleaning, Carpet Cleaning
- Office & Commercial Cleaning: Essential, Professional, Premier plans
- Truck & Fleet Services: Fleet Wash, Fleet Detailing, Commercial Contracts

Key info:
- Phone: (555) 123-4567
- Website: yumiforever.com
- We come to you — mobile service
- Service area: Northern NJ, NYC boroughs

Guidelines:
- Keep responses short and helpful (2-3 sentences max)
- Be warm and professional
- For booking questions, direct them to our booking pages or suggest calling
- For pricing questions, give general ranges and suggest getting a quote
- For complaints or urgent issues, suggest calling directly or emailing support@yumiforever.com
- Don't make up specific prices — suggest they check the website or get a quote
- If they want to talk to a real person, let them know their message will be forwarded to the team`

export async function POST(request: Request) {
  try {
    const { message, sessionId, history } = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing message or sessionId' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Build conversation history for context
    const chatHistory = (history || []).map((msg: { sender: string; message: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
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
    const botReply = result.response.text()

    // Store messages in DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('chat_messages').insert([
      { session_id: sessionId, sender: 'user', message },
      { session_id: sessionId, sender: 'bot', message: botReply },
    ])

    return NextResponse.json({ reply: botReply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: "I'm having trouble connecting right now. Please call us at (555) 123-4567 or email support@yumiforever.com for immediate help!" },
      { status: 200 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ messages: [] })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
