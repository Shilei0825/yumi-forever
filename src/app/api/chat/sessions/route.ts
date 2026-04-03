import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** GET — list all chat sessions with customer info, last message, and unread count */
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

    // Get all messages with profile info
    const { data: messages } = await serviceClient
      .from('chat_messages')
      .select('session_id, profile_id, sender, message, is_read, created_at')
      .order('created_at', { ascending: false })

    if (!messages || messages.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    // Collect unique profile_ids from user messages
    const profileIds = new Set<string>()
    for (const msg of messages) {
      if (msg.sender === 'user' && msg.profile_id) {
        profileIds.add(msg.profile_id)
      }
    }

    // Fetch profile names
    let profileMap = new Map<string, { full_name: string; email: string; phone: string | null }>()
    if (profileIds.size > 0) {
      const { data: profiles } = await serviceClient
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', Array.from(profileIds))

      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, { full_name: p.full_name, email: p.email, phone: p.phone })
        }
      }
    }

    // Group by session_id
    const sessionMap = new Map<string, {
      session_id: string
      profile_id: string | null
      customer_name: string
      customer_email: string | null
      last_message: string
      last_at: string
      unread: number
      message_count: number
    }>()

    for (const msg of messages) {
      const existing = sessionMap.get(msg.session_id)
      if (!existing) {
        // Get customer info from the first user message's profile
        const custProfile = msg.sender === 'user' && msg.profile_id
          ? profileMap.get(msg.profile_id)
          : null

        sessionMap.set(msg.session_id, {
          session_id: msg.session_id,
          profile_id: msg.sender === 'user' ? msg.profile_id : null,
          customer_name: custProfile?.full_name || 'Visitor',
          customer_email: custProfile?.email || null,
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
        // Fill in profile info if we haven't found it yet
        if (existing.customer_name === 'Visitor' && msg.sender === 'user' && msg.profile_id) {
          const custProfile = profileMap.get(msg.profile_id)
          if (custProfile) {
            existing.profile_id = msg.profile_id
            existing.customer_name = custProfile.full_name
            existing.customer_email = custProfile.email
          }
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
