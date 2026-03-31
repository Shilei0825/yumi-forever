import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Provide email or phone to look up bookings' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS (public lookup by email/phone)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('bookings')
      .select(
        'id, booking_number, customer_name, customer_email, customer_phone, scheduled_date, scheduled_time, total, deposit_amount, remaining_balance, payment_status, status, service_id'
      )
      .not('status', 'eq', 'canceled')
      .gt('remaining_balance', 0)
      .order('scheduled_date', { ascending: false })

    if (email) {
      query = query.ilike('customer_email', email.trim())
    } else if (phone) {
      const normalized = normalizePhone(phone)
      query = query.eq('customer_phone', normalized)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Booking lookup error:', error)
      return NextResponse.json(
        { error: 'Failed to look up bookings' },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    // Look up service names for each booking
    const serviceIds = [
      ...new Set(bookings.map((b) => b.service_id).filter(Boolean)),
    ]

    let serviceMap: Record<string, string> = {}
    if (serviceIds.length > 0) {
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .in('id', serviceIds)

      if (services) {
        serviceMap = Object.fromEntries(services.map((s) => [s.id, s.name]))
      }
    }

    // Calculate actual remaining balance based on paid payments
    const bookingIds = bookings.map((b) => b.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('booking_id, amount, status')
      .in('booking_id', bookingIds)
      .in('status', ['paid', 'deposit_paid'])

    const paidByBooking: Record<string, number> = {}
    if (payments) {
      for (const p of payments) {
        paidByBooking[p.booking_id] =
          (paidByBooking[p.booking_id] || 0) + p.amount
      }
    }

    const results = bookings.map((b) => {
      const totalPaid = paidByBooking[b.id] || 0
      const computedRemaining = Math.max(0, b.total - totalPaid)

      return {
        booking_id: b.id,
        booking_number: b.booking_number,
        service_name: serviceMap[b.service_id] || 'Service',
        scheduled_date: b.scheduled_date,
        total_amount: b.total,
        deposit_paid: b.deposit_amount,
        remaining_balance: computedRemaining,
      }
    }).filter((b) => b.remaining_balance > 0)

    return NextResponse.json({ bookings: results })
  } catch (error) {
    console.error('Booking lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
