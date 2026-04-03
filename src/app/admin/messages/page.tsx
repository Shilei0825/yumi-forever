'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, RefreshCw, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChatSession {
  session_id: string
  last_message: string
  last_at: string
  unread: number
  message_count: number
}

interface ChatMessage {
  id: string
  session_id: string
  sender: 'user' | 'admin'
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminMessagesPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all sessions
  async function loadSessions() {
    try {
      const res = await fetch('/api/chat/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 15000)
    return () => clearInterval(interval)
  }, [])

  // Load messages for active session
  async function loadMessages(sessionId: string) {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession)
      const interval = setInterval(() => loadMessages(activeSession), 5000)
      return () => clearInterval(interval)
    }
  }, [activeSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeSession) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [activeSession])

  async function handleReply() {
    if (!reply.trim() || !activeSession || sending) return

    setSending(true)
    try {
      await fetch('/api/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession, message: reply.trim() }),
      })
      setReply('')
      loadMessages(activeSession)
      loadSessions()
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-sm text-gray-500">Customer chat messages from the website</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadSessions(); if (activeSession) loadMessages(activeSession) }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <Card className={cn('lg:col-span-1', activeSession && 'hidden lg:block')}>
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Loading...</p>
            ) : sessions.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {sessions.map((s) => (
                  <button
                    key={s.session_id}
                    onClick={() => setActiveSession(s.session_id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      activeSession === s.session_id && 'bg-violet-50'
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-gray-900">
                          Visitor
                        </p>
                        <span className="text-xs text-gray-400">{formatTime(s.last_at)}</span>
                      </div>
                      <p className="truncate text-xs text-gray-500">{s.last_message}</p>
                    </div>
                    {s.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-medium text-white">
                        {s.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className={cn('lg:col-span-2', !activeSession && 'hidden lg:block')}>
          {!activeSession ? (
            <div className="flex h-96 items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-2 h-10 w-10" />
                <p className="text-sm">Select a conversation to reply</p>
              </div>
            </div>
          ) : (
            <div className="flex h-[600px] flex-col">
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <button
                  onClick={() => setActiveSession(null)}
                  className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Visitor</p>
                  <p className="text-xs text-gray-400">
                    {sessions.find((s) => s.session_id === activeSession)?.message_count || 0} messages
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className="max-w-[75%]">
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            msg.sender === 'admin'
                              ? 'bg-violet-700 text-white'
                              : 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {msg.message}
                        </div>
                        <p className={cn(
                          'mt-1 text-xs text-gray-400',
                          msg.sender === 'admin' && 'text-right'
                        )}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Reply Input */}
              <div className="border-t px-4 py-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleReply() }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-700 text-white transition-colors hover:bg-violet-800 disabled:bg-gray-300"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
