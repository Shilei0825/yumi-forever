import Link from 'next/link'
import {
  Calendar,
  CreditCard,
  Crown,
  ArrowRight,
  Clock,
  MapPin,
  Plus,
  CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'

export default async function PortalDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch upcoming bookings (not completed or canceled)
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('*, service:services(*)')
    .eq('profile_id', user.id)
    .not('status', 'in', '("completed","canceled","canceled_refundable","canceled_nonrefundable","no_show")')
    .order('scheduled_date', { ascending: true })
    .limit(5)

  // Fetch recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*, booking:bookings(booking_number)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {firstName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/book" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">Book a Service</p>
                <p className="text-sm text-gray-500">
                  Schedule home or auto care
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/bookings" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">View All Bookings</p>
                <p className="text-sm text-gray-500">
                  Manage your appointments
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled services</CardDescription>
              </div>
              <Link href="/portal/bookings">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!upcomingBookings || upcomingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900">
                    No upcoming bookings
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Book a service to get started.
                  </p>
                  <Link href="/portal/book" className="mt-4">
                    <Button size="sm">Book Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/portal/bookings/${booking.id}`}
                      className="flex items-start gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.service?.name || 'Service'}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              #{booking.booking_number}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(booking.scheduled_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(booking.scheduled_time)}
                          </span>
                          {booking.address_text && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]">
                                {booking.address_text}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Membership Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-amber-500" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {subscription.plan_name}
                    </span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-500">
                    <p>
                      Renews{' '}
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                  <Link href="/portal/memberships">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Plan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    No active membership
                  </p>
                  <Link href="/portal/memberships" className="mt-3 inline-block">
                    <Button variant="outline" size="sm">
                      View Plans
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Recent Payments</CardTitle>
              <Link href="/portal/payments">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!recentPayments || recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CreditCard className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
