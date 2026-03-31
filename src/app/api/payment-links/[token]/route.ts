import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Look up the payment link by token
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (paymentLink.paid_at) {
      return NextResponse.json(
        { error: 'This payment link has already been used' },
        { status: 410 }
      )
    }

    // Check if expired
    if (new Date(paymentLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This payment link has expired' },
        { status: 410 }
      )
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        'id, booking_number, customer_name, customer_email, scheduled_date, scheduled_time, total, deposit_amount, remaining_balance, status, service_id'
      )
      .eq('id', paymentLink.booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Get service name
    let serviceName = 'Service'
    if (booking.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', booking.service_id)
        .single()

      if (service) {
        serviceName = service.name
      }
    }

    return NextResponse.json({
      payment_link: {
        id: paymentLink.id,
        amount: paymentLink.amount,
        token: paymentLink.token,
        expires_at: paymentLink.expires_at,
      },
      booking: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        customer_name: booking.customer_name,
        service_name: serviceName,
        scheduled_date: booking.scheduled_date,
        total_amount: booking.total,
        deposit_paid: booking.deposit_amount,
        remaining_balance: paymentLink.amount,
      },
    })
  } catch (error) {
    console.error('Payment link lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
