"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Plus, Building2, FileText, MessageSquare } from 'lucide-react'
import type { CommercialAccount, QuoteRequest } from '@/types'

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment Complex' },
  { value: 'dealership', label: 'Dealership' },
  { value: 'fleet', label: 'Fleet' },
  { value: 'commercial', label: 'Commercial' },
]

const QUOTE_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

export default function AdminCommercialPage() {
  const [activeTab, setActiveTab] = useState('accounts')
  const [accounts, setAccounts] = useState<CommercialAccount[]>([])
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Add account dialog
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newAccountType, setNewAccountType] = useState('commercial')
  const [newNotes, setNewNotes] = useState('')
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [accountsRes, quotesRes] = await Promise.all([
      supabase
        .from('commercial_accounts')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    setAccounts(accountsRes.data || [])
    setQuoteRequests(quotesRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleAddAccount() {
    if (!newCompanyName || !newContactName || !newContactEmail) {
      setFormError('Company name, contact name, and email are required.')
      return
    }

    setSaving(true)
    setFormError('')
    const supabase = createClient()

    const { error } = await supabase.from('commercial_accounts').insert({
      company_name: newCompanyName,
      contact_name: newContactName,
      contact_email: newContactEmail,
      contact_phone: newContactPhone,
      account_type: newAccountType,
      notes: newNotes || null,
      is_active: true,
    })

    if (error) {
      setFormError(error.message || 'Failed to add account.')
      setSaving(false)
      return
    }

    setShowAddAccount(false)
    setNewCompanyName('')
    setNewContactName('')
    setNewContactEmail('')
    setNewContactPhone('')
    setNewAccountType('commercial')
    setNewNotes('')
    setSaving(false)
    await fetchData()
  }

  async function updateQuoteStatus(quoteId: string, newStatus: string) {
    const supabase = createClient()
    await supabase
      .from('quote_requests')
      .update({ status: newStatus })
      .eq('id', quoteId)
    await fetchData()
  }

  const accountTypeBadgeColor: Record<string, string> = {
    apartment: 'bg-blue-100 text-blue-800',
    dealership: 'bg-purple-100 text-purple-800',
    fleet: 'bg-orange-100 text-orange-800',
    commercial: 'bg-green-100 text-green-800',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commercial Accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage commercial accounts, contracts, and quote requests.
          </p>
        </div>
        <Button onClick={() => setShowAddAccount(true)}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Accounts ({accounts.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Contracts
            </span>
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Quote Requests ({quoteRequests.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardContent className="p-0">
              {accounts.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No commercial accounts yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {account.company_name}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={accountTypeBadgeColor[account.account_type] || 'bg-gray-100 text-gray-800'}>
                              {getStatusLabel(account.account_type)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{account.contact_name}</td>
                          <td className="px-4 py-3 text-gray-600">{account.contact_email}</td>
                          <td className="px-4 py-3 text-gray-600">{account.contact_phone}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={account.is_active ? 'success' : 'secondary'}>
                              {account.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatDate(account.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Contract management is coming soon. Active contracts will appear here with frequency and pricing details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote Requests Tab */}
        <TabsContent value="quotes">
          <Card>
            <CardContent className="p-0">
              {quoteRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No quote requests yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Service Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quoteRequests.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {quote.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{quote.email}</td>
                          <td className="px-4 py-3 text-gray-600">{quote.phone}</td>
                          <td className="px-4 py-3 text-gray-700">{quote.service_type}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                            {quote.description}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusColor(quote.status)}>
                              {getStatusLabel(quote.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatDate(quote.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <select
                              value={quote.status}
                              onChange={(e) => updateQuoteStatus(quote.id, e.target.value)}
                              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {QUOTE_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Commercial Account</DialogTitle>
          </DialogHeader>
          <DialogClose onClick={() => setShowAddAccount(false)} />
          <div className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{formError}</p>
            )}
            <Input
              label="Company Name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="ABC Fleet Services"
            />
            <Select
              label="Account Type"
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
              options={ACCOUNT_TYPE_OPTIONS}
            />
            <Input
              label="Contact Name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Jane Doe"
            />
            <Input
              label="Contact Email"
              type="email"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="jane@company.com"
            />
            <Input
              label="Contact Phone"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
            <Textarea
              label="Notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccount} disabled={saving}>
              {saving ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
