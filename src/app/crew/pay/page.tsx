'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  cn,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { PayrollEntry } from '@/types'

interface PayrollEntryWithBooking extends PayrollEntry {
  booking?: {
    booking_number: string
    service?: {
      name: string
    }
  } | null
}

export default function CrewPayPage() {
  const supabase = createClient()

  const [entries, setEntries] = useState<PayrollEntryWithBooking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayroll = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('payroll_entries')
        .select('*, booking:bookings(booking_number, service:services(name))')
        .eq('crew_member_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching payroll:', error)
        return
      }

      setEntries((data || []) as PayrollEntryWithBooking[])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPayroll()
  }, [fetchPayroll])

  // Calculate summary
  const pendingEntries = entries.filter((e) => e.status === 'pending')
  const approvedEntries = entries.filter((e) => e.status === 'approved')
  const paidEntries = entries.filter((e) => e.status === 'paid')
  const unpaidEntries = [...pendingEntries, ...approvedEntries]

  const currentPeriodEarnings = pendingEntries.reduce(
    (sum, e) => sum + e.pay_amount + e.bonus_amount + e.tip_amount,
    0
  )

  const totalUnpaid = unpaidEntries.reduce(
    (sum, e) => sum + e.pay_amount + e.bonus_amount + e.tip_amount,
    0
  )

  const lastPaidEntry = paidEntries.length > 0 ? paidEntries[0] : null
  const lastPaymentAmount = lastPaidEntry
    ? lastPaidEntry.pay_amount + lastPaidEntry.bonus_amount + lastPaidEntry.tip_amount
    : 0

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <h2 className="text-xl font-bold text-gray-900">Earnings</h2>

      {/* Summary Cards */}
      <div className="space-y-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentPeriodEarnings)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total Unpaid</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCurrency(totalUnpaid)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Last Payment</p>
              {lastPaidEntry ? (
                <>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(lastPaymentAmount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lastPaidEntry.paid_at
                      ? formatDate(lastPaidEntry.paid_at)
                      : 'N/A'}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-400">No payments yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <DollarSign className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No earnings yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Complete jobs to start earning
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const totalForEntry =
                  entry.pay_amount + entry.bonus_amount + entry.tip_amount

                return (
                  <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {entry.booking?.service?.name || 'Service'}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.created_at)}
                          </span>
                          {entry.booking?.booking_number && (
                            <span>#{entry.booking.booking_number}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {entry.bonus_amount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              +{formatCurrency(entry.bonus_amount)} review bonus
                            </span>
                          )}
                          {entry.tip_amount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              +{formatCurrency(entry.tip_amount)} tip
                            </span>
                          )}
                          {entry.hours_worked && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              {entry.hours_worked}h
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1">
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(totalForEntry)}
                        </p>
                        <Badge
                          className={cn('text-xs', getStatusColor(entry.status))}
                        >
                          {getStatusLabel(entry.status)}
                        </Badge>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {paidEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {paidEntries.map((entry) => {
                const totalForEntry =
                  entry.pay_amount + entry.bonus_amount + entry.tip_amount

                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.booking?.service?.name || 'Payment'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.paid_at
                          ? `Paid ${formatDate(entry.paid_at)}`
                          : formatDate(entry.created_at)}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-green-700">
                      {formatCurrency(totalForEntry)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
