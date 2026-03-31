"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Users } from 'lucide-react'
import type { Profile } from '@/types'

interface CustomerRow extends Profile {
  bookings_count: number
  total_spent: number
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch customer profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (error || !profiles) {
      console.error('Error fetching customers:', error)
      setCustomers([])
      setLoading(false)
      return
    }

    // For each customer, get booking count and total spent
    const customerIds = profiles.map((p) => p.id)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('profile_id, total')
      .in('profile_id', customerIds.length > 0 ? customerIds : ['__none__'])

    const bookingStats: Record<string, { count: number; total: number }> = {}
    for (const b of bookings || []) {
      if (!bookingStats[b.profile_id]) {
        bookingStats[b.profile_id] = { count: 0, total: 0 }
      }
      bookingStats[b.profile_id].count++
      bookingStats[b.profile_id].total += b.total
    }

    const rows: CustomerRow[] = profiles.map((p) => ({
      ...p,
      bookings_count: bookingStats[p.id]?.count || 0,
      total_spent: bookingStats[p.id]?.total || 0,
    }))

    setCustomers(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      c.full_name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all customer accounts.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No customers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Bookings</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Total Spent</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{customer.full_name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.phone || '--'}</td>
                      <td className="px-4 py-3 text-center text-gray-900">{customer.bookings_count}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(customer.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(customer.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
