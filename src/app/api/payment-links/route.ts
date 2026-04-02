import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify admin auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { booking_id, amount } = body

    if (!booking_id) {
      return NextResponse.json(
        { error: 'booking_id is required' },
        { status: 400 }
      )
    }

    // Use service role to read booking data
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get booking to determine remaining balance
    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .select('id, total, remaining_balance, payment_status')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Calculate actual remaining from paid payments
    const { data: payments } = await serviceSupabase
      .from('payments')
      .select('amount, status')
      .eq('booking_id', booking_id)
      .in('status', ['paid', 'deposit_paid'])

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0)
    const computedRemaining = Math.max(0, booking.total - totalPaid)

    if (computedRemaining <= 0) {
      return NextResponse.json(
        { error: 'Booking is already fully paid' },
        { status: 400 }
      )
    }

    // Use specified amount or default to remaining balance
    const linkAmount = amount || computedRemaining

    if (linkAmount > computedRemaining) {
      return NextResponse.json(
        { error: 'Amount exceeds remaining balance' },
        { status: 400 }
      )
    }

    // Create payment link using service role (bypasses RLS INSERT policy)
    const { data: paymentLink, error: insertError } = await serviceSupabase
      .from('payment_links')
      .insert({
        booking_id,
        amount: linkAmount,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Payment link insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    const payUrl = `${origin}/pay?token=${paymentLink.token}`

    return NextResponse.json({
      id: paymentLink.id,
      token: paymentLink.token,
      amount: paymentLink.amount,
      expires_at: paymentLink.expires_at,
      url: payUrl,
    })
  } catch (error) {
    console.error('Create payment link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
