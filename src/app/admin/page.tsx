import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import {
  Calendar,
  DollarSign,
  FileQuestion,
  HardHat,
  CheckCircle2,
  AlertCircle,
  Plus,
  Truck,
  Receipt,
} from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch all stats in parallel
  const [
    todaysBookingsRes,
    todaysRevenueRes,
    pendingQuotesRes,
    activeCrewRes,
    completedTodayRes,
    unpaidRes,
    recentBookingsRes,
  ] = await Promise.all([
    // Today's bookings count
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', today),

    // Today's revenue (completed bookings today)
    supabase
      .from('bookings')
      .select('total')
      .eq('scheduled_date', today)
      .eq('status', 'completed'),

    // Pending quotes
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_quote'),

    // Active crew (crew members with in_progress jobs today)
    supabase
      .from('dispatch_assignments')
      .select('crew_member_id, booking:bookings!inner(status, scheduled_date)')
      .eq('booking.scheduled_date', today)
      .in('booking.status', ['in_progress', 'on_the_way']),

    // Completed today
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .eq('status', 'completed'),

    // Outstanding balances (unpaid/partially paid)
    supabase
      .from('bookings')
      .select('total')
      .in('status', ['completed', 'confirmed', 'assigned', 'in_progress'])
      .not('status', 'eq', 'canceled'),

    // Recent bookings (last 10)
    supabase
      .from('bookings')
      .select('*, service:services(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const todaysBookingsCount = todaysBookingsRes.count || 0
  const todaysRevenue = (todaysRevenueRes.data || []).reduce((sum, b) => sum + b.total, 0)
  const pendingQuotesCount = pendingQuotesRes.count || 0
  const activeCrewCount = new Set((activeCrewRes.data || []).map((a) => a.crew_member_id)).size
  const completedTodayCount = completedTodayRes.count || 0

  // Calculate outstanding balances from unpaid bookings
  // Get payments for outstanding bookings
  const outstandingBookings = (unpaidRes.data || [])
  const totalOutstanding = outstandingBookings.reduce((sum, b) => sum + b.total, 0)

  // Get payments sum
  const { data: paidPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')

  const totalPaid = (paidPayments || []).reduce((sum, p) => sum + p.amount, 0)
  const outstandingBalance = Math.max(0, totalOutstanding - totalPaid)

  const recentBookings = recentBookingsRes.data || []

  const stats = [
    {
      label: "Today's Bookings",
      value: todaysBookingsCount.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(todaysRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Pending Quotes',
      value: pendingQuotesCount.toString(),
      icon: FileQuestion,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Active Crews',
      value: activeCrewCount.toString(),
      icon: HardHat,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Completed Jobs',
      value: completedTodayCount.toString(),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Outstanding Balances',
      value: formatCurrency(outstandingBalance),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(today)} — Here is what is happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/book">
              <Button>
                <Plus className="h-4 w-4" />
                Create Booking
              </Button>
            </Link>
            <Link href="/admin/bookings">
              <Button variant="outline">
                <Truck className="h-4 w-4" />
                View Dispatch
              </Button>
            </Link>
            <Link href="/admin/payroll">
              <Button variant="outline">
                <Receipt className="h-4 w-4" />
                Run Payroll
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <Link href="/admin/bookings" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Booking #</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Customer</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Service</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Status</th>
                    <th className="pb-3 text-right font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {booking.booking_number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{booking.customer_name}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {booking.service?.name || 'N/A'}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {formatDate(booking.scheduled_date)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(booking.total)}
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
