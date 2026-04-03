import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * PATCH /api/admin/payroll/[id] — Approve or mark payroll as paid
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify admin auth
    const supabase = await createServerClient()
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!['approved', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "paid"' },
        { status: 400 }
      )
    }

    const serviceClient = getServiceClient()

    // Get current record
    const { data: record } = await serviceClient
      .from('crew_payroll')
      .select('id, status, crew_member_id, total_pay')
      .eq('id', id)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Validate state transitions
    if (status === 'approved' && record.status !== 'pending') {
      return NextResponse.json({ error: 'Can only approve pending records' }, { status: 400 })
    }
    if (status === 'paid' && record.status !== 'approved') {
      return NextResponse.json({ error: 'Can only pay approved records' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    const { data: updated, error } = await serviceClient
      .from('crew_payroll')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Payroll update error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    // Notify crew member
    if (status === 'paid') {
      await serviceClient.from('notifications').insert({
        profile_id: record.crew_member_id,
        type: 'payroll_paid',
        title: 'Payment Processed',
        message: `Your payroll of $${(record.total_pay / 100).toFixed(2)} has been processed!`,
        metadata: { payroll_id: id, amount: record.total_pay },
      })
    }

    return NextResponse.json({ record: updated })
  } catch (error) {
    console.error('Update payroll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
