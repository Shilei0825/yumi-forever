import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** POST — customer sends a message */
export async function POST(request: Request) {
  try {
    const { message, sessionId, profileId } = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing message or sessionId' }, { status: 400 })
    }

    const supabase = getSupabase()

    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      profile_id: profileId || null,
      sender: 'user',
      message,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

/** GET — fetch messages for a session */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ messages: [] })
    }

    const supabase = getSupabase()

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
