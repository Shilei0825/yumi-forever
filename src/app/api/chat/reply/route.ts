import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** POST — admin/crew replies to a chat session */
export async function POST(request: Request) {
  try {
    // Verify auth — must be admin or crew
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'crew', 'dispatcher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { sessionId, message } = await request.json()

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Missing sessionId or message' }, { status: 400 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await serviceClient.from('chat_messages').insert({
      session_id: sessionId,
      profile_id: user.id,
      sender: 'admin',
      message: `${profile.full_name}: ${message}`,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
    }

    // Mark all user messages in this session as read
    await serviceClient
      .from('chat_messages')
      .update({ is_read: true })
      .eq('session_id', sessionId)
      .eq('sender', 'user')

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Chat reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
