"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { formatCurrency, getStatusLabel } from '@/lib/utils'
import { Plus, HardHat, Search, CheckCircle } from 'lucide-react'
import type { Profile, CrewPayProfile } from '@/types'

interface CrewRow extends Profile {
  pay_profile: CrewPayProfile | null
  active_jobs: number
}

export default function AdminCrewsPage() {
  const router = useRouter()
  const [crews, setCrews] = useState<CrewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // New crew form fields
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newTempPassword, setNewTempPassword] = useState('')
  const [newPayType, setNewPayType] = useState('hourly')
  const [newHourlyRate, setNewHourlyRate] = useState('')
  const [newPerJobRate, setNewPerJobRate] = useState('')

  const fetchCrews = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch crew profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'crew')
      .order('full_name')

    if (error || !profiles) {
      console.error('Error fetching crews:', error)
      setCrews([])
      setLoading(false)
      return
    }

    const crewIds = profiles.map((p) => p.id)

    // Fetch pay profiles
    const { data: payProfiles } = await supabase
      .from('crew_pay_profiles')
      .select('*')
      .in('profile_id', crewIds.length > 0 ? crewIds : ['__none__'])

    // Fetch active jobs count (non-completed, non-canceled)
    const { data: activeAssignments } = await supabase
      .from('dispatch_assignments')
      .select('crew_member_id, booking:bookings!inner(status)')
      .in('crew_member_id', crewIds.length > 0 ? crewIds : ['__none__'])
      .not('booking.status', 'in', '("completed","canceled")')

    const payMap: Record<string, CrewPayProfile> = {}
    for (const pp of payProfiles || []) {
      payMap[pp.profile_id] = pp
    }

    const activeJobsMap: Record<string, number> = {}
    for (const a of activeAssignments || []) {
      activeJobsMap[a.crew_member_id] = (activeJobsMap[a.crew_member_id] || 0) + 1
    }

    const rows: CrewRow[] = profiles.map((p) => ({
      ...p,
      pay_profile: payMap[p.id] || null,
      active_jobs: activeJobsMap[p.id] || 0,
    }))

    setCrews(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCrews()
  }, [fetchCrews])

  const filteredCrews = crews.filter((c) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      c.full_name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    )
  })

  function resetForm() {
    setNewName('')
    setNewEmail('')
    setNewPhone('')
    setNewTempPassword('')
    setNewPayType('hourly')
    setNewHourlyRate('')
    setNewPerJobRate('')
    setFormError('')
  }

  async function handleAddCrew() {
    // Validate required fields
    if (!newName.trim()) {
      setFormError('Full name is required.')
      return
    }
    if (!newEmail.trim()) {
      setFormError('Email is required.')
      return
    }
    if (!newTempPassword) {
      setFormError('Temporary password is required.')
      return
    }
    if (newTempPassword.length < 8) {
      setFormError('Temporary password must be at least 8 characters.')
      return
    }

    setSaving(true)
    setFormError('')
    setSuccessMessage('')

    try {
      const rateInCents =
        newPayType === 'hourly'
          ? Math.round(parseFloat(newHourlyRate || '0') * 100)
          : Math.round(parseFloat(newPerJobRate || '0') * 100)

      const res = await fetch('/api/admin/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          full_name: newName.trim(),
          phone: newPhone.trim() || null,
          temp_password: newTempPassword,
          pay_type: newPayType,
          hourly_rate: newPayType === 'hourly' ? rateInCents : null,
          per_job_rate: newPayType === 'per_job' ? rateInCents : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'Failed to create crew member.')
        setSaving(false)
        return
      }

      // Success
      setShowAddForm(false)
      resetForm()
      setSuccessMessage(`Crew member "${newName.trim()}" created successfully. They can log in with their email and temporary password.`)
      await fetchCrews()

      // Auto-dismiss success message after 6 seconds
      setTimeout(() => setSuccessMessage(''), 6000)
    } catch (err) {
      console.error('Create crew error:', err)
      setFormError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crew Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage crew members, pay rates, and assignments.
          </p>
        </div>
        <Button onClick={() => { setShowAddForm(true); setFormError(''); setSuccessMessage(''); }}>
          <Plus className="h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search crew members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCrews.length === 0 ? (
            <div className="py-12 text-center">
              <HardHat className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No crew members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Pay Type</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Rate</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Active Jobs</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCrews.map((crew) => (
                    <tr
                      key={crew.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/admin/crews/${crew.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{crew.full_name}</p>
                          <p className="text-xs text-gray-500">{crew.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{crew.phone || '--'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {crew.pay_profile
                          ? getStatusLabel(crew.pay_profile.pay_type)
                          : '--'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {crew.pay_profile
                          ? crew.pay_profile.pay_type === 'hourly'
                            ? `${formatCurrency(crew.pay_profile.hourly_rate || 0)}/hr`
                            : `${formatCurrency(crew.pay_profile.per_job_rate || 0)}/job`
                          : '--'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">{crew.active_jobs}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={crew.pay_profile?.is_active !== false ? 'success' : 'secondary'}
                        >
                          {crew.pay_profile?.is_active !== false ? 'Active' : 'Inactive'}
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

      {/* Add Crew Dialog */}
      <Dialog open={showAddForm} onOpenChange={(open) => { setShowAddForm(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Crew Member Account</DialogTitle>
          </DialogHeader>
          <DialogClose onClick={() => { setShowAddForm(false); resetForm(); }} />

          <div className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{formError}</p>
            )}

            <Input
              label="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="John Smith"
              required
            />

            <Input
              label="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />

            <Input
              label="Phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />

            <Input
              label="Temporary Password"
              type="password"
              value={newTempPassword}
              onChange={(e) => setNewTempPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              error={newTempPassword.length > 0 && newTempPassword.length < 8 ? 'Must be at least 8 characters' : undefined}
            />

            <Select
              label="Pay Type"
              value={newPayType}
              onChange={(e) => setNewPayType(e.target.value)}
              options={[
                { value: 'hourly', label: 'Hourly' },
                { value: 'per_job', label: 'Per Job' },
              ]}
            />

            {newPayType === 'hourly' && (
              <Input
                label="Hourly Rate ($)"
                type="number"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                placeholder="25"
                min="0"
                step="0.01"
              />
            )}

            {newPayType === 'per_job' && (
              <Input
                label="Per Job Rate ($)"
                type="number"
                value={newPerJobRate}
                onChange={(e) => setNewPerJobRate(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddCrew} disabled={saving}>
              {saving ? 'Creating Account...' : 'Create Crew Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
