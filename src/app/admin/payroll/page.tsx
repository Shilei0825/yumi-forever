import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { CREW_PAY_CONFIG } from '@/lib/payroll'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, CheckCircle2, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Payroll | Yumi Forever Admin',
}

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

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusFilter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('crew_payroll')
    .select('*, profiles:crew_member_id(full_name)')
    .order('period_start', { ascending: false })

  if (statusFilter && ['pending', 'approved', 'paid'].includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  const { data: payrollRecords } = await query

  const records = (payrollRecords || []) as PayrollRecord[]

  const allRecordsQuery = await supabase
    .from('crew_payroll')
    .select('crew_member_id, total_pay, status')

  const allRecords = allRecordsQuery.data || []

  const totalPending = allRecords
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.total_pay, 0)

  const totalPaid = allRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.total_pay, 0)

  const activeCrewIds = new Set(allRecords.map((r) => r.crew_member_id))
  const activeCrewCount = activeCrewIds.size

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage crew payroll records.
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
                <p className="text-lg font-bold text-gray-900">{activeCrewCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = (statusFilter || '') === tab.value
          return (
            <Link
              key={tab.value}
              href={
                tab.value
                  ? `/admin/payroll?status=${tab.value}`
                  : '/admin/payroll'
              }
            >
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
              >
                {tab.label}
              </Button>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
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
                            <Button size="sm" variant="outline">
                              Approve
                            </Button>
                          )}
                          {record.status === 'approved' && (
                            <span className="text-xs text-blue-600 font-medium">Approved</span>
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
