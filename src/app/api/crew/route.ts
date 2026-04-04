import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is crew role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'crew') {
      return NextResponse.json(
        { error: 'Forbidden - crew role required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, booking_id, ...rest } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action field' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'start_job': {
        if (!booking_id) {
          return NextResponse.json(
            { error: 'Missing booking_id' },
            { status: 400 }
          )
        }

        // Update booking status to 'in_progress'
        const { data: booking, error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', booking_id)
          .select()
          .single()

        if (updateError) {
          console.error('Start job error:', updateError)
          return NextResponse.json(
            { error: 'Failed to start job' },
            { status: 500 }
          )
        }

        // Insert status history
        await supabase.from('booking_status_history').insert({
          booking_id,
          status: 'in_progress',
          changed_by: user.id,
          notes: 'Job started by crew member',
        })

        return NextResponse.json({ booking })
      }

      case 'complete_job': {
        if (!booking_id) {
          return NextResponse.json(
            { error: 'Missing booking_id' },
            { status: 400 }
          )
        }

        const { payment_method } = rest // 'cash' | 'square_device' | undefined (customer pays later)

        // Use service client for payment inserts
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Get the booking to calculate actual duration and amount
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('started_at, total, final_price, deposit_paid, profile_id')
          .eq('id', booking_id)
          .single()

        const completedAt = new Date()
        let actualDurationMinutes: number | null = null

        if (existingBooking?.started_at) {
          const startedAt = new Date(existingBooking.started_at)
          actualDurationMinutes = Math.round(
            (completedAt.getTime() - startedAt.getTime()) / 60000
          )
        }

        // Determine payment status based on payment_method
        const effectiveTotal = existingBooking?.final_price ?? existingBooking?.total ?? 0
        const alreadyPaid = existingBooking?.deposit_paid ?? 0
        const remainingBalance = Math.max(0, effectiveTotal - alreadyPaid)
        const isPaidOnsite = payment_method === 'cash' || payment_method === 'square_device'

        // Build booking update
        const bookingUpdate: Record<string, unknown> = {
          status: 'completed',
          completed_at: completedAt.toISOString(),
          actual_duration_minutes: actualDurationMinutes,
        }

        if (isPaidOnsite) {
          bookingUpdate.payment_status = 'paid'
          bookingUpdate.remaining_balance = 0
          bookingUpdate.deposit_paid = effectiveTotal
        }

        // Update booking status to 'completed'
        const { data: booking, error: updateError } = await supabase
          .from('bookings')
          .update(bookingUpdate)
          .eq('id', booking_id)
          .select()
          .single()

        if (updateError) {
          console.error('Complete job error:', updateError)
          return NextResponse.json(
            { error: 'Failed to complete job' },
            { status: 500 }
          )
        }

        // Record payment if paid onsite
        if (isPaidOnsite && remainingBalance > 0) {
          await supabaseAdmin.from('payments').insert({
            booking_id,
            profile_id: existingBooking?.profile_id || null,
            amount: remainingBalance,
            status: 'paid',
            payment_type: 'balance',
            payment_method,
            square_payment_id: null,
            square_order_id: null,
          })
        }

        // Build completion notes
        const paymentLabel = payment_method === 'cash'
          ? 'Cash collected'
          : payment_method === 'square_device'
            ? 'Card collected via device'
            : 'Customer pays later'

        // Insert status history
        await supabase.from('booking_status_history').insert({
          booking_id,
          status: 'completed',
          changed_by: user.id,
          notes: `Job completed. Duration: ${actualDurationMinutes ?? 'N/A'} min. Payment: ${paymentLabel}`,
        })

        // Create payroll entry based on crew pay profile
        const { data: payProfile } = await supabase
          .from('crew_pay_profiles')
          .select('*')
          .eq('profile_id', user.id)
          .eq('is_active', true)
          .single()

        if (payProfile) {
          let payAmount = 0
          let hoursWorked: number | null = null

          if (payProfile.pay_type === 'hourly' && actualDurationMinutes) {
            hoursWorked = Math.round((actualDurationMinutes / 60) * 100) / 100
            payAmount = Math.round(
              hoursWorked * (payProfile.hourly_rate || 0)
            )
          } else if (payProfile.pay_type === 'per_job') {
            payAmount = payProfile.per_job_rate || 0
          }

          await supabase.from('payroll_entries').insert({
            crew_member_id: user.id,
            booking_id,
            pay_amount: payAmount,
            bonus_amount: 0,
            tip_amount: 0,
            hours_worked: hoursWorked,
            status: 'pending',
            notes: `Auto-generated from completed booking ${booking_id}`,
          })
        }

        return NextResponse.json({ booking })
      }

      case 'upload_photo': {
        const { photo_type, url, caption } = rest

        if (!booking_id || !url) {
          return NextResponse.json(
            { error: 'Missing booking_id or url' },
            { status: 400 }
          )
        }

        const { data: photo, error: photoError } = await supabase
          .from('uploaded_photos')
          .insert({
            booking_id,
            uploaded_by: user.id,
            photo_type: photo_type || 'other',
            url,
            caption: caption || null,
          })
          .select()
          .single()

        if (photoError) {
          console.error('Upload photo error:', photoError)
          return NextResponse.json(
            { error: 'Failed to save photo record' },
            { status: 500 }
          )
        }

        return NextResponse.json({ photo })
      }

      case 'add_note': {
        const { note } = rest

        if (!booking_id || !note) {
          return NextResponse.json(
            { error: 'Missing booking_id or note' },
            { status: 400 }
          )
        }

        // Get existing notes and append
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('service_notes')
          .eq('id', booking_id)
          .single()

        const timestamp = new Date().toISOString()
        const newNote = `[${timestamp}] ${note}`
        const updatedNotes = existingBooking?.service_notes
          ? `${existingBooking.service_notes}\n${newNote}`
          : newNote

        const { data: booking, error: noteError } = await supabase
          .from('bookings')
          .update({ service_notes: updatedNotes })
          .eq('id', booking_id)
          .select()
          .single()

        if (noteError) {
          console.error('Add note error:', noteError)
          return NextResponse.json(
            { error: 'Failed to add note' },
            { status: 500 }
          )
        }

        return NextResponse.json({ booking })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Crew action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is crew role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'crew') {
      return NextResponse.json(
        { error: 'Forbidden - crew role required' },
        { status: 403 }
      )
    }

    // Get crew member's assigned jobs for today or upcoming
    const today = new Date().toISOString().split('T')[0]

    const { data: assignments, error } = await supabase
      .from('dispatch_assignments')
      .select('*, booking:bookings(*, service:services(*))')
      .eq('crew_member_id', user.id)

    if (error) {
      console.error('Fetch crew jobs error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    // Filter to today and upcoming jobs
    const jobs = (assignments || [])
      .filter((a) => {
        const booking = a.booking as Record<string, unknown> | null
        if (!booking) return false
        return (
          (booking.scheduled_date as string) >= today &&
          booking.status !== 'completed' &&
          booking.status !== 'canceled'
        )
      })
      .map((a) => a.booking)

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Crew GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
