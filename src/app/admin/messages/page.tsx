'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Send,
  RefreshCw,
  ChevronLeft,
  User,
  Calendar,
  Star,
  MapPin,
  Car,
  Gift,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChatSession {
  session_id: string
  profile_id: string | null
  customer_name: string
  customer_email: string | null
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

interface CustomerBooking {
  id: string
  booking_number: string
  status: string
  scheduled_date: string
  scheduled_time: string
  address_text: string | null
  vehicle_info: string | null
  service_notes: string | null
  created_at: string
  payment_status?: string
  total?: number
}

interface CustomerReview {
  id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
}

interface CustomerCredit {
  id: string
  amount: number
  remaining: number
  status: string
  expires_at: string
}

interface CustomerDetail {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
  bookings: CustomerBooking[]
  reviews: CustomerReview[]
  credits: CustomerCredit[]
}

export default function AdminMessagesPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 15000)
    return () => clearInterval(interval)
  }, [loadSessions])

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession)
      const interval = setInterval(() => loadMessages(activeSession), 5000)
      return () => clearInterval(interval)
    }
  }, [activeSession, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeSession) {
      setTimeout(() => inputRef.current?.focus(), 200)
      // Load customer detail if profile exists
      const session = sessions.find((s) => s.session_id === activeSession)
      if (session?.profile_id) {
        fetch(`/api/chat/customer?profileId=${session.profile_id}`)
          .then((res) => res.json())
          .then((data) => setCustomerDetail(data.customer))
          .catch(() => setCustomerDetail(null))
      } else {
        setCustomerDetail(null)
      }
    }
  }, [activeSession, sessions])

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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const activeSessionData = sessions.find((s) => s.session_id === activeSession)

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
    canceled: 'bg-red-100 text-red-700',
    assigned: 'bg-purple-100 text-purple-700',
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sessions List */}
        <Card className={cn('lg:col-span-3', activeSession && 'hidden lg:block')}>
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
                    onClick={() => { setActiveSession(s.session_id); setShowDetail(false) }}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      activeSession === s.session_id && 'bg-violet-50'
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {s.customer_name}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">{formatTime(s.last_at)}</span>
                      </div>
                      {s.customer_email && (
                        <p className="truncate text-xs text-gray-400">{s.customer_email}</p>
                      )}
                      <p className="mt-0.5 truncate text-xs text-gray-500">{s.last_message}</p>
                    </div>
                    {s.unread > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-medium text-white">
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
        <Card className={cn(
          showDetail && customerDetail ? 'lg:col-span-5' : 'lg:col-span-9',
          !activeSession && 'hidden lg:block'
        )}>
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
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSession(null)}
                    className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activeSessionData?.customer_name || 'Visitor'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activeSessionData?.customer_email || `${activeSessionData?.message_count || 0} messages`}
                    </p>
                  </div>
                </div>
                {activeSessionData?.profile_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetail(!showDetail)}
                  >
                    <User className="mr-1 h-3 w-3" />
                    {showDetail ? 'Hide' : 'Details'}
                  </Button>
                )}
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
                        {msg.sender === 'admin' && (
                          <p className="mb-0.5 text-right text-xs font-medium text-violet-600">Yumi</p>
                        )}
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
                    placeholder="Reply as Yumi..."
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

        {/* Customer Detail Panel */}
        {showDetail && customerDetail && activeSession && (
          <Card className="lg:col-span-4">
            <div className="flex h-[600px] flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">Customer Details</h3>
                <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-4">
                {/* Profile Info */}
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{customerDetail.full_name}</p>
                      <p className="text-xs text-gray-500">{customerDetail.email}</p>
                    </div>
                  </div>
                  {customerDetail.phone && (
                    <p className="text-xs text-gray-500">Phone: {customerDetail.phone}</p>
                  )}
                  <p className="text-xs text-gray-400">Member since {formatDate(customerDetail.created_at)}</p>
                </div>

                {/* Bookings */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Recent Bookings ({customerDetail.bookings.length})
                  </h4>
                  {customerDetail.bookings.length === 0 ? (
                    <p className="text-xs text-gray-400">No bookings yet</p>
                  ) : (
                    <div className="space-y-2">
                      {customerDetail.bookings.map((b) => (
                        <div key={b.id} className="rounded-lg border border-gray-200 p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900">#{b.booking_number}</span>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              statusColors[b.status] || 'bg-gray-100 text-gray-700'
                            )}>
                              {b.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(b.scheduled_date)} at {b.scheduled_time}
                          </p>
                          {b.address_text && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />{b.address_text}
                            </p>
                          )}
                          {b.vehicle_info && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                              <Car className="h-3 w-3" />{b.vehicle_info}
                            </p>
                          )}
                          {b.total !== undefined && (
                            <p className="mt-1 text-xs font-medium text-gray-700">
                              ${(b.total / 100).toFixed(2)} — {b.payment_status?.replace(/_/g, ' ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviews */}
                {customerDetail.reviews.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Star className="h-3.5 w-3.5" />
                      Reviews ({customerDetail.reviews.length})
                    </h4>
                    <div className="space-y-2">
                      {customerDetail.reviews.map((r) => (
                        <div key={r.id} className="rounded-lg border border-gray-200 p-2.5">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-3 w-3',
                                  i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                )}
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-400">{formatDate(r.created_at)}</span>
                          </div>
                          {r.comment && (
                            <p className="mt-1 text-xs text-gray-600">{r.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Credits */}
                {customerDetail.credits.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Gift className="h-3.5 w-3.5" />
                      Active Credits
                    </h4>
                    <div className="space-y-1.5">
                      {customerDetail.credits.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-2.5 py-2">
                          <span className="text-xs font-medium text-green-700">${(c.remaining / 100).toFixed(0)} remaining</span>
                          <span className="text-xs text-gray-400">Exp: {formatDate(c.expires_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
