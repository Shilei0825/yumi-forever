import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendBookingReminderEmail } from '@/lib/emails/send'

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate the target date (48 hours from now)
    const now = new Date()
    const targetDate = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const dateString = targetDate.toISOString().split('T')[0]

    // Find bookings scheduled for targetDate that haven't been reminded
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, booking_items:booking_items(name, price)')
      .eq('scheduled_date', dateString)
      .is('reminder_sent_at', null)
      .not('status', 'in', '("canceled","completed")')

    if (error) {
      console.error('Cron query error:', error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    let sent = 0
    for (const booking of bookings || []) {
      // Look up service name
      let serviceName = 'Service'
      if (booking.service_id) {
        const { data: svc } = await supabase
          .from('services')
          .select('name')
          .eq('id', booking.service_id)
          .single()
        if (svc) serviceName = svc.name
      }

      await sendBookingReminderEmail(booking, serviceName)

      // Mark as sent
      await supabase
        .from('bookings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id)

      sent++
    }

    return NextResponse.json({ sent, date: dateString })
  } catch (error) {
    console.error('Cron handler error:', error)
    return NextResponse.json(
      { error: 'Cron handler failed' },
      { status: 500 }
    )
  }
}
