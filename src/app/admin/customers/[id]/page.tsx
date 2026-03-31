import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Car,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch customer profile
  const { data: customer, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (profileError || !customer) {
    redirect('/admin/customers')
  }

  // Fetch related data in parallel
  const [bookingsRes, paymentsRes, addressesRes, vehiclesRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('profile_id', id)
      .order('scheduled_date', { ascending: false }),
    supabase
      .from('payments')
      .select('*, booking:bookings(booking_number)')
      .eq('profile_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', id)
      .order('is_default', { ascending: false }),
    supabase
      .from('vehicles')
      .select('*')
      .eq('profile_id', id),
  ])

  const bookings = bookingsRes.data || []
  const payments = paymentsRes.data || []
  const addresses = addressesRes.data || []
  const vehicles = vehiclesRes.data || []

  const totalSpent = bookings.reduce((sum, b) => sum + b.total, 0)
  const totalBookings = bookings.length
  const completedBookings = bookings.filter((b) => b.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{customer.full_name}</h2>
          <p className="mt-1 text-sm text-gray-500">Customer since {formatDate(customer.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.full_name}</p>
                    <p className="text-xs text-gray-500">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{customer.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{customer.phone || 'Not provided'}</p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{formatDate(customer.created_at)}</p>
                    <p className="text-xs text-gray-500">Joined</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking History ({totalBookings})</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-500">No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Booking #</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Date</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Service</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Status</th>
                        <th className="pb-2 text-right font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
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
                          <td className="py-2.5 pr-4">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right font-medium text-gray-900">
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

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payments recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Date</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Booking</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Type</th>
                        <th className="pb-2 pr-4 text-left font-medium text-gray-500">Status</th>
                        <th className="pb-2 text-right font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="py-2.5 pr-4 text-gray-500">
                            {formatDate(payment.created_at)}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-700">
                            {(payment.booking as any)?.booking_number || '--'}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-700">
                            {getStatusLabel(payment.payment_type)}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
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
          {/* Lifetime Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Spent</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Bookings</span>
                <span className="font-medium text-gray-900">{totalBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Completed</span>
                <span className="font-medium text-gray-900">{completedBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg Order Value</span>
                <span className="font-medium text-gray-900">
                  {totalBookings > 0 ? formatCurrency(Math.round(totalSpent / totalBookings)) : '$0.00'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Addresses ({addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500">No addresses on file.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="rounded-md bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                        {addr.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {addr.street}{addr.unit ? `, ${addr.unit}` : ''}, {addr.city}, {addr.state} {addr.zip_code}
                      </p>
                      {addr.property_type && (
                        <p className="mt-1 text-xs text-gray-400">{getStatusLabel(addr.property_type)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicles ({vehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-sm text-gray-500">No vehicles on file.</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div key={v.id} className="rounded-md bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {v.color} {getStatusLabel(v.type)}
                        {v.license_plate ? ` - ${v.license_plate}` : ''}
                      </p>
                      {v.condition_notes && (
                        <p className="mt-1 text-xs text-gray-400">{v.condition_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                No customer notes. This section can be used for internal notes about the customer.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
