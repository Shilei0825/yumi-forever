import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Crown, Users, DollarSign } from 'lucide-react'
import type { Subscription } from '@/types'

export default async function AdminMembershipsPage() {
  const supabase = await createClient()

  // Fetch all subscriptions with profile info
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  const allSubs = (subscriptions || []) as (Subscription & { profile: { full_name: string; email: string } | null })[]
  const activeSubs = allSubs.filter((s) => s.status === 'active')

  // Calculate MRR from active subscriptions
  // We need to map plan names to prices from constants
  const planPrices: Record<string, number> = {
    'Auto Care Monthly': 9900,
    'Home Care Monthly': 24900,
    'Premium Bundle': 29900,
  }

  const totalMRR = activeSubs.reduce((sum, sub) => {
    return sum + (planPrices[sub.plan_name] || 0)
  }, 0)

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'canceled': return 'destructive'
      case 'past_due': return 'warning'
      case 'paused': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Membership Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage subscriber memberships.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Active Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{activeSubs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMRR)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4" />
            All Subscribers ({allSubs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allSubs.length === 0 ? (
            <div className="py-12 text-center">
              <Crown className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No subscribers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Name</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Email</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Plan</th>
                    <th className="pb-3 pr-4 text-center font-medium text-gray-500">Status</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Current Period</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Renewal Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allSubs.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {sub.profile?.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {sub.profile?.email || '--'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Crown className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="text-gray-900">{sub.plan_name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Badge variant={statusBadgeVariant(sub.status) as any}>
                          {getStatusLabel(sub.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(sub.current_period_end)}
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
  )
}
