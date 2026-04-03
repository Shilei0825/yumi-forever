'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  sender: 'user' | 'admin'
  message: string
}

function generateSessionId() {
  return 'chat_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function ChatWidget({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef<string>('')
  const profileIdRef = useRef<string | null>(null)

  // Get or create session ID + detect logged-in user
  useEffect(() => {
    const stored = localStorage.getItem('yumi_chat_session')
    if (stored) {
      sessionIdRef.current = stored
    } else {
      const id = generateSessionId()
      sessionIdRef.current = id
      localStorage.setItem('yumi_chat_session', id)
    }

    // Detect logged-in user
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) profileIdRef.current = user.id
    })
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Static greeting on first open
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true)
      // Load any existing messages from this session
      fetch(`/api/chat?sessionId=${sessionIdRef.current}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m: { id: string; sender: string; message: string }) => ({
                id: m.id,
                sender: m.sender === 'user' ? 'user' : 'admin',
                message: m.message,
              }))
            )
          }
        })
        .catch(() => {})
    }
  }, [open, greeted])

  // Poll for new admin replies every 10 seconds when chat is open
  useEffect(() => {
    if (!open || !greeted) return

    const interval = setInterval(() => {
      fetch(`/api/chat?sessionId=${sessionIdRef.current}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            const mapped: ChatMessage[] = data.messages.map(
              (m: { id: string; sender: string; message: string }) => ({
                id: m.id,
                sender: m.sender === 'user' ? 'user' : 'admin',
                message: m.message,
              })
            )
            // Only update if message count changed (avoid re-renders)
            setMessages((prev) => {
              if (prev.length !== mapped.length) return mapped
              return prev
            })
          }
        })
        .catch(() => {})
    }, 10000)

    return () => clearInterval(interval)
  }, [open, greeted])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: text,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionIdRef.current,
          profileId: profileIdRef.current,
        }),
      })
    } catch {
      // Message still shown locally even if save fails
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          'fixed z-[80] transition-all duration-300 ease-in-out',
          'inset-x-0 bottom-0 sm:inset-auto sm:bottom-24 sm:right-6',
          'sm:w-96',
          open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0',
          className
        )}
      >
        <div className="flex h-[70vh] max-h-[500px] flex-col rounded-t-2xl border border-gray-200 bg-white sm:rounded-2xl sm:shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-violet-700 px-4 py-3 text-white sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Yumi Forever</p>
                <p className="text-xs text-violet-200">Send us a message</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {/* Static welcome */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-relaxed text-gray-800">
                  Hi there! Send us a message and our team will get back to you shortly. You can also call us at (555) 123-4567.
                </div>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.sender === 'user'
                        ? 'bg-violet-700 text-white'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-700 text-white transition-colors hover:bg-violet-800 disabled:bg-gray-300 disabled:text-gray-500"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Bubble Button — desktop only */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-[70] hidden h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-white transition-all hover:bg-violet-800 hover:scale-105 sm:flex',
          open && 'scale-0 opacity-0'
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Hidden trigger for mobile CTA button */}
      <button
        id="mobile-chat-trigger"
        onClick={() => setOpen(!open)}
        className="hidden"
        aria-hidden="true"
      />
    </>
  )
}
