"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'
import type { Profile, CrewPayProfile, PayrollEntry, Booking } from '@/types'

export default function AdminCrewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const crewId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [payProfile, setPayProfile] = useState<CrewPayProfile | null>(null)
  const [assignedJobs, setAssignedJobs] = useState<any[]>([])
  const [payrollHistory, setPayrollHistory] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Editable fields
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPayType, setEditPayType] = useState('hourly')
  const [editHourlyRate, setEditHourlyRate] = useState('')
  const [editPerJobRate, setEditPerJobRate] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  // Stats
  const [jobsCompleted, setJobsCompleted] = useState(0)
  const [avgDuration, setAvgDuration] = useState(0)

  const fetchCrew = useCallback(async () => {
    const supabase = createClient()

    const [profileRes, payRes, jobsRes, payrollRes, completedRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', crewId).single(),
      supabase.from('crew_pay_profiles').select('*').eq('profile_id', crewId).single(),
      supabase
        .from('dispatch_assignments')
        .select('*, booking:bookings(*, service:services(name))')
        .eq('crew_member_id', crewId)
        .order('assigned_at', { ascending: false })
        .limit(50),
      supabase
        .from('payroll_entries')
        .select('*')
        .eq('crew_member_id', crewId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('dispatch_assignments')
        .select('booking:bookings!inner(status, actual_duration_minutes)')
        .eq('crew_member_id', crewId)
        .eq('booking.status', 'completed'),
    ])

    if (profileRes.data) {
      setProfile(profileRes.data)
      setEditName(profileRes.data.full_name)
      setEditPhone(profileRes.data.phone || '')
    }

    if (payRes.data) {
      setPayProfile(payRes.data)
      setEditPayType(payRes.data.pay_type)
      setEditHourlyRate(payRes.data.hourly_rate ? (payRes.data.hourly_rate / 100).toString() : '')
      setEditPerJobRate(payRes.data.per_job_rate ? (payRes.data.per_job_rate / 100).toString() : '')
      setEditIsActive(payRes.data.is_active)
    }

    setAssignedJobs(jobsRes.data || [])
    setPayrollHistory(payrollRes.data || [])

    // Compute stats
    const completedJobs = completedRes.data || []
    setJobsCompleted(completedJobs.length)
    if (completedJobs.length > 0) {
      const totalDuration = completedJobs.reduce((sum, j: any) => {
        return sum + (j.booking?.actual_duration_minutes || 0)
      }, 0)
      setAvgDuration(Math.round(totalDuration / completedJobs.length))
    }

    setLoading(false)
  }, [crewId])

  useEffect(() => {
    fetchCrew()
  }, [fetchCrew])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: editName,
        phone: editPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (profileError) {
      setMessage({ type: 'error', text: 'Failed to update profile.' })
      setSaving(false)
      return
    }

    // Update or create pay profile
    const payData = {
      profile_id: profile.id,
      pay_type: editPayType,
      hourly_rate: editPayType === 'hourly' ? Math.round(parseFloat(editHourlyRate || '0') * 100) : null,
      per_job_rate: editPayType === 'per_job' ? Math.round(parseFloat(editPerJobRate || '0') * 100) : null,
      is_active: editIsActive,
    }

    if (payProfile) {
      const { error: payError } = await supabase
        .from('crew_pay_profiles')
        .update(payData)
        .eq('id', payProfile.id)

      if (payError) {
        setMessage({ type: 'error', text: 'Failed to update pay profile.' })
        setSaving(false)
        return
      }
    } else {
      await supabase.from('crew_pay_profiles').insert(payData)
    }

    setMessage({ type: 'success', text: 'Crew member updated successfully.' })
    await fetchCrew()
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Crew member not found.</p>
        <Link href="/admin/crews" className="mt-4 inline-block text-primary hover:underline">
          Back to Crews
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/crews')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
          <p className="mt-1 text-sm text-gray-500">Crew Member</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <p className="flex h-10 items-center rounded-md bg-gray-50 px-3 text-sm text-gray-600">
                    {profile.email}
                  </p>
                </div>
                <Input
                  label="Phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pay Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pay Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select
                  label="Pay Type"
                  value={editPayType}
                  onChange={(e) => setEditPayType(e.target.value)}
                  options={[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'per_job', label: 'Per Job' },
                  ]}
                />
                {editPayType === 'hourly' ? (
                  <Input
                    label="Hourly Rate ($)"
                    type="number"
                    step="0.01"
                    value={editHourlyRate}
                    onChange={(e) => setEditHourlyRate(e.target.value)}
                  />
                ) : (
                  <Input
                    label="Per Job Rate ($)"
                    type="number"
                    step="0.01"
                    value={editPerJobRate}
                    onChange={(e) => setEditPerJobRate(e.target.value)}
                  />
                )}
                <Select
                  label="Status"
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Assigned Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No jobs assigned.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Booking #</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Date</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Service</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Customer</th>
                        <th className="pb-2 text-left font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignedJobs.map((assignment) => {
                        const booking = assignment.booking
                        if (!booking) return null
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-4">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {booking.booking_number}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-4 text-gray-500">
                              {formatDate(booking.scheduled_date)}
                            </td>
                            <td className="py-2.5 pr-4 text-gray-700">
                              {booking.service?.name || 'N/A'}
                            </td>
                            <td className="py-2.5 pr-4 text-gray-700">
                              {booking.customer_name}
                            </td>
                            <td className="py-2.5">
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusLabel(booking.status)}
                              </Badge>
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

          {/* Payroll History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              {payrollHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No payroll entries yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Date</th>
                        <th className="pb-2 pr-4 text-right font-medium text-gray-500">Base Pay</th>
                        <th className="pb-2 pr-4 text-right font-medium text-gray-500">Bonus</th>
                        <th className="pb-2 pr-4 text-right font-medium text-gray-500">Tips</th>
                        <th className="pb-2 pr-4 text-right font-medium text-gray-500">Total</th>
                        <th className="pb-2 text-left font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payrollHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-2.5 pr-4 text-gray-500">
                            {formatDate(entry.created_at)}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-gray-900">
                            {formatCurrency(entry.pay_amount)}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-gray-900">
                            {formatCurrency(entry.bonus_amount)}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-gray-900">
                            {formatCurrency(entry.tip_amount)}
                          </td>
                          <td className="py-2.5 pr-4 text-right font-medium text-gray-900">
                            {formatCurrency(entry.pay_amount + entry.bonus_amount + entry.tip_amount)}
                          </td>
                          <td className="py-2.5">
                            <Badge className={getStatusColor(entry.status)}>
                              {getStatusLabel(entry.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500">Jobs Completed</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{jobsCompleted}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500">Avg Duration</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {avgDuration > 0 ? `${avgDuration} min` : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-gray-500">Active Assignments</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {assignedJobs.filter((j) => {
                    const b = j.booking
                    return b && b.status !== 'completed' && b.status !== 'canceled'
                  }).length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{profile.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {payProfile
                    ? payProfile.pay_type === 'hourly'
                      ? `${formatCurrency(payProfile.hourly_rate || 0)}/hr`
                      : `${formatCurrency(payProfile.per_job_rate || 0)}/job`
                    : 'Not configured'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Status:</span>
                <Badge variant={editIsActive ? 'success' : 'secondary'}>
                  {editIsActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
