'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReviewCredit } from '@/types'

export default function CreditsPage() {
  const [credits, setCredits] = useState<ReviewCredit[]>([])
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchCredits = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/credits')
      const data = await res.json()
      setCredits(data.credits || [])
      setTotalAvailable(data.totalAvailable || 0)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  const now = new Date()
  const activeCredits = credits.filter(
    (c) => c.status === 'active' && new Date(c.expires_at) > now
  )
  const usedCredits = credits.filter((c) => c.status === 'used')
  const expiredCredits = credits.filter(
    (c) => c.status === 'expired' || (c.status === 'active' && new Date(c.expires_at) <= now)
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Review Credits
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Earn credits by leaving reviews — they&apos;re automatically applied to your next booking!
        </p>
      </div>

      {/* Balance Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100">
            <DollarSign className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Available Balance</p>
            <p className="text-3xl font-bold text-green-900">
              {formatCurrency(totalAvailable)}
            </p>
            {activeCredits.length > 0 && (
              <p className="mt-0.5 text-xs text-green-700">
                {activeCredits.length} active credit{activeCredits.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-5 w-5 text-purple-500" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. Complete a service and leave a review</p>
          <p>2. Once approved, you earn a <strong className="text-gray-900">$10 credit</strong></p>
          <p>3. Credits are automatically applied to your next booking</p>
          <p className="text-xs text-gray-400">Credits expire after 90 days. Max 3 active credits at a time.</p>
        </CardContent>
      </Card>

      {/* Active Credits */}
      {activeCredits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Active Credits</h3>
          {activeCredits.map((credit) => (
            <Card key={credit.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Gift className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Review Reward
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Expires {formatDate(credit.expires_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(credit.remaining)}
                  </p>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Used Credits */}
      {usedCredits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Used Credits</h3>
          {usedCredits.map((credit) => (
            <Card key={credit.id} className="opacity-60">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Review Reward</p>
                    <p className="text-xs text-gray-400">
                      Used {credit.used_at ? formatDate(credit.used_at) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 line-through">
                    {formatCurrency(credit.amount)}
                  </p>
                  <Badge variant="secondary" className="text-xs">Used</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Expired Credits */}
      {expiredCredits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Expired Credits</h3>
          {expiredCredits.map((credit) => (
            <Card key={credit.id} className="opacity-40">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <XCircle className="h-5 w-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Review Reward</p>
                    <p className="text-xs text-gray-400">
                      Expired {formatDate(credit.expires_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-400 line-through">
                    {formatCurrency(credit.amount)}
                  </p>
                  <Badge variant="secondary" className="text-xs">Expired</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {credits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Gift className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-900">No credits yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Leave a review after your next service to earn a credit!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
