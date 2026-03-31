import { createClient } from '@/lib/supabase/server'
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

    // Verify user is admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin role required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ...rest } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action field' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'assign_crew': {
        const { booking_id, crew_member_id } = rest

        if (!booking_id || !crew_member_id) {
          return NextResponse.json(
            { error: 'Missing booking_id or crew_member_id' },
            { status: 400 }
          )
        }

        // Insert into dispatch_assignments
        const { data: assignment, error: assignError } = await supabase
          .from('dispatch_assignments')
          .insert({
            booking_id,
            crew_member_id,
          })
          .select()
          .single()

        if (assignError) {
          console.error('Assign crew error:', assignError)
          return NextResponse.json(
            { error: 'Failed to assign crew' },
            { status: 500 }
          )
        }

        // Update booking status to 'assigned'
        const { error: statusError } = await supabase
          .from('bookings')
          .update({ status: 'assigned' })
          .eq('id', booking_id)

        if (statusError) {
          console.error('Update booking status error:', statusError)
        }

        // Insert status history
        await supabase.from('booking_status_history').insert({
          booking_id,
          status: 'assigned',
          changed_by: user.id,
          notes: `Crew member assigned: ${crew_member_id}`,
        })

        return NextResponse.json({ success: true, assignment })
      }

      case 'update_booking_status': {
        const { booking_id, status, notes } = rest

        if (!booking_id || !status) {
          return NextResponse.json(
            { error: 'Missing booking_id or status' },
            { status: 400 }
          )
        }

        // Update booking status
        const { data: booking, error: updateError } = await supabase
          .from('bookings')
          .update({ status })
          .eq('id', booking_id)
          .select()
          .single()

        if (updateError) {
          console.error('Update booking status error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update booking status' },
            { status: 500 }
          )
        }

        // Insert status history
        await supabase.from('booking_status_history').insert({
          booking_id,
          status,
          changed_by: user.id,
          notes: notes || `Status updated to ${status} by admin`,
        })

        return NextResponse.json({ success: true, booking })
      }

      case 'mark_payroll_paid': {
        const { payroll_entry_ids } = rest

        if (
          !payroll_entry_ids ||
          !Array.isArray(payroll_entry_ids) ||
          payroll_entry_ids.length === 0
        ) {
          return NextResponse.json(
            { error: 'Missing or invalid payroll_entry_ids array' },
            { status: 400 }
          )
        }

        // Update payroll entries status to 'paid'
        const { data: entries, error: payrollError } = await supabase
          .from('payroll_entries')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .in('id', payroll_entry_ids)
          .select()

        if (payrollError) {
          console.error('Mark payroll paid error:', payrollError)
          return NextResponse.json(
            { error: 'Failed to mark payroll as paid' },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, entries })
      }

      case 'update_payroll': {
        const { payroll_entry_id, pay_amount, bonus_amount, tip_amount, notes } =
          rest

        if (!payroll_entry_id) {
          return NextResponse.json(
            { error: 'Missing payroll_entry_id' },
            { status: 400 }
          )
        }

        const updateData: Record<string, unknown> = {}
        if (pay_amount !== undefined) updateData.pay_amount = pay_amount
        if (bonus_amount !== undefined) updateData.bonus_amount = bonus_amount
        if (tip_amount !== undefined) updateData.tip_amount = tip_amount
        if (notes !== undefined) updateData.notes = notes

        const { data: entry, error: updateError } = await supabase
          .from('payroll_entries')
          .update(updateData)
          .eq('id', payroll_entry_id)
          .select()
          .single()

        if (updateError) {
          console.error('Update payroll error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update payroll entry' },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, entry })
      }

      case 'create_commercial_account': {
        const {
          company_name,
          contact_name,
          contact_email,
          contact_phone,
          account_type,
          notes,
        } = rest

        if (!company_name || !contact_name || !contact_email) {
          return NextResponse.json(
            {
              error:
                'Missing required fields: company_name, contact_name, contact_email',
            },
            { status: 400 }
          )
        }

        const { data: account, error: accountError } = await supabase
          .from('commercial_accounts')
          .insert({
            company_name,
            contact_name,
            contact_email,
            contact_phone: contact_phone || null,
            account_type: account_type || 'commercial',
            notes: notes || null,
            is_active: true,
          })
          .select()
          .single()

        if (accountError) {
          console.error('Create commercial account error:', accountError)
          return NextResponse.json(
            { error: 'Failed to create commercial account' },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, account })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
