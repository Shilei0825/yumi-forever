'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, CheckCircle2, Users, Loader2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PayrollRecord {
  id: string
  crew_member_id: string
  period_start: string
  period_end: string
  role: 'lead' | 'helper'
  total_jobs: number
  total_revenue: number
  total_commission: number
  base_pay: number
  review_bonus: number
  weekly_bonus: number
  total_pay: number
  five_star_count: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
  profiles: {
    full_name: string
  } | null
}

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Paid', value: 'paid' },
] as const

function getPayrollStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getLastMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getLastSunday(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

export default function AdminPayrollPage() {
  const supabase = createClient()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [generating, setGenerating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState(getLastMonday())
  const [weekEnd, setWeekEnd] = useState(getLastSunday())

  const fetchRecords = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('crew_payroll')
      .select('*, profiles:crew_member_id(full_name)')
      .order('period_start', { ascending: false })

    if (statusFilter && ['pending', 'approved', 'paid'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setRecords((data || []) as PayrollRecord[])
    setLoading(false)
  }, [supabase, statusFilter])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const totalPending = records
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.total_pay, 0)

  const totalPaid = records
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.total_pay, 0)

  const activeCrewIds = new Set(records.map((r) => r.crew_member_id))

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, week_end: weekEnd }),
      })
      const data = await res.json()
      if (res.ok) {
        fetchRecords()
        alert(data.message || 'Payroll generated')
      } else {
        alert(data.error || 'Failed to generate')
      }
    } catch {
      alert('Error generating payroll')
    } finally {
      setGenerating(false)
    }
  }

  async function handleStatusChange(id: string, newStatus: 'approved' | 'paid') {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchRecords()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update')
      }
    } catch {
      alert('Error updating payroll')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generate, review, and manage crew payroll records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Payroll (Pending)</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Payroll (Paid)</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Active Crew</p>
                <p className="text-lg font-bold text-gray-900">{activeCrewIds.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Payroll */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Week End</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Generate Payroll
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value
          return (
            <Button
              key={tab.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : records.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No payroll records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Crew Member</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Period</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Jobs</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Commission</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Base Pay</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Bonuses</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Total Pay</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => {
                    const bonuses = record.review_bonus + record.weekly_bonus
                    const crewName = record.profiles?.full_name || 'Unknown'
                    const isLoading = actionLoading === record.id

                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {crewName}
                        </td>
                        <td className="px-4 py-3 text-gray-700 capitalize">
                          {record.role}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(record.period_start)} &ndash; {formatDate(record.period_end)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {record.total_jobs}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(record.total_revenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(record.total_commission)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(record.base_pay)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(bonuses)}
                          {record.five_star_count > 0 && (
                            <span className="ml-1 text-xs text-yellow-600">
                              ({record.five_star_count} x 5-star)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(record.total_pay)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={getPayrollStatusColor(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {record.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoading}
                              onClick={() => handleStatusChange(record.id, 'approved')}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                            </Button>
                          )}
                          {record.status === 'approved' && (
                            <Button
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleStatusChange(record.id, 'paid')}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark Paid'}
                            </Button>
                          )}
                          {record.status === 'paid' && (
                            <span className="text-xs text-green-600 font-medium">Paid</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
