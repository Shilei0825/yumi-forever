'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/update-password` }
      )

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Click the link in the email to set a new password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <Link
            href="/login/user"
            className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
