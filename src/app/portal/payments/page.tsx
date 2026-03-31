import {
  CreditCard,
  DollarSign,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: payments } = await supabase
    .from('payments')
    .select('*, booking:bookings(booking_number, service:services(name))')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const allPayments = payments || []

  // Calculate summary
  const totalSpent = allPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = allPayments
    .filter((p) => p.status !== 'paid' && p.status !== 'refunded' && p.status !== 'failed')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalRefunded = allPayments
    .filter((p) => p.status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0)

  function getPaymentTypeLabel(type: string) {
    const labels: Record<string, string> = {
      deposit: 'Deposit',
      balance: 'Balance',
      full: 'Full Payment',
      tip: 'Tip',
      refund: 'Refund',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Payments
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          View your payment history and transaction details.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalPending)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Refunded</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalRefunded)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>
            All payments associated with your bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-900">No payments yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Payments will appear here when you book services.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Booking</th>
                        <th className="pb-3 pr-4">Service</th>
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4 text-right">Amount</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="py-3 pr-4 text-sm text-gray-600">
                            {formatDate(payment.created_at)}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm font-medium text-gray-900">
                              #{payment.booking?.booking_number || '--'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-sm text-gray-600">
                            {payment.booking?.service?.name || '--'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              {getPaymentTypeLabel(payment.payment_type)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 text-right">
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile List */}
              <div className="space-y-3 sm:hidden">
                {allPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        #{payment.booking?.booking_number || '--'}
                      </span>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </span>
                    </div>
                    {payment.booking?.service?.name && (
                      <p className="mt-1 text-xs text-gray-500">
                        {payment.booking.service.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
