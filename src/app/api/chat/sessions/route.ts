import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** GET — list all chat sessions with last message and unread count (admin/crew only) */
export async function GET() {
  try {
    // Verify auth
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

    if (!profile || !['admin', 'crew', 'dispatcher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all messages ordered by time
    const { data: messages } = await serviceClient
      .from('chat_messages')
      .select('session_id, sender, message, is_read, created_at')
      .order('created_at', { ascending: false })

    if (!messages || messages.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    // Group by session_id
    const sessionMap = new Map<string, {
      session_id: string
      last_message: string
      last_at: string
      unread: number
      message_count: number
    }>()

    for (const msg of messages) {
      const existing = sessionMap.get(msg.session_id)
      if (!existing) {
        sessionMap.set(msg.session_id, {
          session_id: msg.session_id,
          last_message: msg.message,
          last_at: msg.created_at,
          unread: msg.sender === 'user' && !msg.is_read ? 1 : 0,
          message_count: 1,
        })
      } else {
        existing.message_count++
        if (msg.sender === 'user' && !msg.is_read) {
          existing.unread++
        }
      }
    }

    // Sort by last_at descending
    const sessions = Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
    )

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Chat sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
