import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateBookingNumber, normalizePhone } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      service_slug,
      category,
      customer_name,
      customer_email,
      customer_phone,
      scheduled_date,
      scheduled_time,
      estimated_duration,
      subtotal,
      tax,
      total,
      estimated_price,
      deposit_amount = 0,
      payment_option,
      address_text,
      gate_code,
      parking_instructions,
      vehicle_info,
      service_notes,
      addons = [],
      // Auto details
      vehicle_class,
      auto_service_type,
      auto_condition,
      condition_addons = [],
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      // Home details
      floorplan,
      home_service_type,
      home_dirtiness,
      last_cleaned,
      special_instructions,
      home_sqft,
      home_bedrooms,
      home_bathrooms,
      // Recurring
      recurring_mode,
      remaining_balance,
      // Address
      street,
      unit,
      city,
      state,
      zip_code,
      pricing_breakdown,
    } = body

    // Generate booking number
    const booking_number = generateBookingNumber()

    // Look up service_id by slug if available
    let service_id: string | null = null
    if (service_slug) {
      const { data: svc } = await supabase
        .from('services')
        .select('id')
        .eq('slug', service_slug)
        .single()
      if (svc) {
        service_id = svc.id
      }
    }

    // Get authenticated user if exists (guest booking allowed)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Build address text if not provided
    const finalAddressText = address_text || [
      street,
      unit ? `Unit ${unit}` : '',
      city,
      state,
      zip_code,
    ].filter(Boolean).join(', ')

    // Build vehicle info string if not provided
    const finalVehicleInfo = vehicle_info || (
      vehicle_class ? JSON.stringify({
        vehicle_class,
        auto_service_type,
        auto_condition,
        condition_addons,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_color,
      }) : null
    )

    // Build service notes
    const finalServiceNotes = service_notes || (
      category === 'home_care' ? JSON.stringify({
        floorplan,
        home_dirtiness,
        last_cleaned,
        special_instructions,
      }) : null
    )

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number,
        profile_id: user?.id || null,
        service_id,
        status: 'new',
        scheduled_date,
        scheduled_time,
        estimated_duration,
        subtotal,
        tax,
        total,
        estimated_price: estimated_price || subtotal,
        deposit_amount,
        customer_name,
        customer_email,
        customer_phone: customer_phone ? normalizePhone(customer_phone) : null,
        address_text: finalAddressText,
        gate_code: gate_code || null,
        parking_instructions: parking_instructions || null,
        vehicle_info: finalVehicleInfo,
        property_type: category === 'home_care' ? 'home' : null,
        service_notes: finalServiceNotes,
        payment_option: payment_option || 'deposit',
        booking_category: category,
        auto_service_type: auto_service_type || null,
        home_service_type: home_service_type || null,
        vehicle_class: vehicle_class || null,
        pricing_breakdown: pricing_breakdown || null,
        deposit_paid: deposit_amount,
        remaining_balance: remaining_balance || (total - deposit_amount),
        payment_status: deposit_amount > 0 ? 'deposit_paid' : 'unpaid',
        recurring_mode: recurring_mode || null,
        is_recurring: !!recurring_mode,
        recurring_commitment_total: recurring_mode ? 3 : null,
        recurring_services_completed: recurring_mode ? 0 : null,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking insert error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Insert addon items into booking_items table
    if (addons.length > 0) {
      const bookingItems = addons.map(
        (addon: { id: string; name: string; price: number }) => ({
          booking_id: booking.id,
          addon_id: addon.id,
          name: addon.name,
          price: addon.price,
        })
      )

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(bookingItems)

      if (itemsError) {
        console.error('Booking items insert error:', itemsError)
      }
    }

    // Insert booking details into category-specific tables
    if (category === 'auto_care' && vehicle_class) {
      const { error: autoError } = await supabase
        .from('booking_auto_details')
        .insert({
          booking_id: booking.id,
          vehicle_class,
          auto_service_type: auto_service_type || null,
          condition_level: auto_condition || null,
          pet_hair: condition_addons.includes('pet_hair'),
          stains: condition_addons.includes('stains'),
          smoke_odor: condition_addons.includes('smoke'),
          sand_mud: condition_addons.includes('sand_mud'),
          vehicle_make: vehicle_make || null,
          vehicle_model: vehicle_model || null,
          vehicle_year: vehicle_year || null,
          vehicle_color: vehicle_color || null,
        })
      if (autoError) {
        console.error('Auto details insert error:', autoError)
      }
    }

    if (category === 'home_care' && (home_sqft || floorplan)) {
      const { error: homeError } = await supabase
        .from('booking_home_details')
        .insert({
          booking_id: booking.id,
          floorplan: floorplan || null,
          home_service_type: home_service_type || null,
          dirtiness_level: home_dirtiness,
          last_cleaned,
          special_notes: special_instructions || null,
          sqft: home_sqft || null,
          bedrooms: home_bedrooms || null,
          bathrooms: home_bathrooms || null,
        })
      if (homeError) {
        console.error('Home details insert error:', homeError)
      }
    }

    // Insert initial status into booking_status_history
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: booking.id,
        status: 'new',
        changed_by: user?.id || null,
        notes: 'Booking created',
      })

    if (historyError) {
      console.error('Status history insert error:', historyError)
    }

    return NextResponse.json(
      {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        total,
        deposit_amount,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Require authentication for listing bookings
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const role = profile.role

    if (role === 'customer') {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, service:services(*)')
        .eq('profile_id', user.id)
        .order('scheduled_date', { ascending: false })

      if (error) {
        console.error('Fetch bookings error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch bookings' },
          { status: 500 }
        )
      }

      return NextResponse.json({ bookings })
    }

    if (role === 'crew') {
      const { data: assignments, error } = await supabase
        .from('dispatch_assignments')
        .select('*, booking:bookings(*, service:services(*))')
        .eq('crew_member_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch crew bookings error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch bookings' },
          { status: 500 }
        )
      }

      const bookings = assignments?.map((a) => a.booking) || []
      return NextResponse.json({ bookings })
    }

    if (role === 'dispatcher' || role === 'admin') {
      const status = searchParams.get('status')
      const date = searchParams.get('date')
      const serviceId = searchParams.get('service_id')

      let query = supabase
        .from('bookings')
        .select('*, service:services(*)')
        .order('scheduled_date', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }
      if (date) {
        query = query.eq('scheduled_date', date)
      }
      if (serviceId) {
        query = query.eq('service_id', serviceId)
      }

      const { data: bookings, error } = await query

      if (error) {
        console.error('Fetch all bookings error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch bookings' },
          { status: 500 }
        )
      }

      return NextResponse.json({ bookings })
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('List bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
