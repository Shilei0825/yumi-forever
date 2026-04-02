import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use service role to bypass RLS (guest bookings have no profile_id)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'booking_number, customer_name, customer_email, customer_phone, scheduled_date, scheduled_time, address_text, total, deposit_amount, deposit_paid, remaining_balance, payment_status, status, booking_items:booking_items(name, price)'
      )
      .eq('id', id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Look up service name
    const { data: bookingFull } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('id', id)
      .single()

    let serviceName = 'Service'
    if (bookingFull?.service_id) {
      const { data: svc } = await supabase
        .from('services')
        .select('name')
        .eq('id', bookingFull.service_id)
        .single()
      if (svc) serviceName = svc.name
    }

    return NextResponse.json({
      booking: { ...booking, service_name: serviceName },
    })
  } catch (error) {
    console.error('Public booking lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
