import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateBookingNumber, normalizePhone } from '@/lib/utils'
import { getSquareClient, getSquareLocationId } from '@/lib/square'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    // Use service role for inserts to bypass RLS (guest bookings need this)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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
      home_carpet_type,
      home_building_type,
      price_confidence,
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
      const { data: svc } = await supabaseAdmin
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

    // Insert booking (use admin client to bypass RLS for guest bookings)
    const { data: booking, error: bookingError } = await supabaseAdmin
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
        deposit_paid: 0,
        remaining_balance: total,
        payment_status: 'unpaid',
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
        { error: `Failed to create booking: ${bookingError.message}`, details: bookingError },
        { status: 500 }
      )
    }

    // Insert addon items into booking_items table
    if (addons.length > 0) {
      const bookingItems = addons.map(
        (addon: { id: string; name: string; price: number }) => ({
          booking_id: booking.id,
          name: addon.name,
          price: addon.price,
        })
      )

      const { error: itemsError } = await supabaseAdmin
        .from('booking_items')
        .insert(bookingItems)

      if (itemsError) {
        console.error('Booking items insert error:', itemsError)
      }
    }

    // Insert booking details into category-specific tables
    if (category === 'auto_care' && vehicle_class) {
      const { error: autoError } = await supabaseAdmin
        .from('booking_auto_details')
        .insert({
          booking_id: booking.id,
          vehicle_class,
          dirtiness_level: auto_condition || null,
          pet_hair: condition_addons.includes('pet_hair'),
          stains: condition_addons.includes('stains'),
          smoke_odor: condition_addons.includes('smoke'),
          vehicle_make: vehicle_make || null,
          vehicle_model: vehicle_model || null,
          vehicle_year: vehicle_year ? parseInt(String(vehicle_year), 10) : null,
        })
      if (autoError) {
        console.error('Auto details insert error:', autoError)
      }
    }

    if (category === 'home_care' && (home_sqft || floorplan)) {
      const { error: homeError } = await supabaseAdmin
        .from('booking_home_details')
        .insert({
          booking_id: booking.id,
          floorplan: floorplan || null,
          dirtiness_level: home_dirtiness || null,
          last_cleaned: last_cleaned || null,
          special_notes: special_instructions || null,
          sqft: home_sqft || null,
          bedrooms: home_bedrooms || null,
          bathrooms: home_bathrooms || null,
          carpet_type: home_carpet_type || null,
          building_type: home_building_type || null,
        })
      if (homeError) {
        console.error('Home details insert error:', homeError)
      }
    }

    // Insert initial status into booking_status_history
    const { error: historyError } = await supabaseAdmin
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

    // Create Square checkout link if deposit is required
    let checkoutUrl: string | null = null

    if (deposit_amount > 0) {
      try {
        const squareClient = getSquareClient()
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''

        // Get service name for line item
        let serviceName = 'Service'
        if (service_id) {
          const { data: svc } = await supabaseAdmin
            .from('services')
            .select('name')
            .eq('id', service_id)
            .single()
          if (svc) serviceName = svc.name
        }

        const paymentLink = await squareClient.checkout.paymentLinks.create({
          idempotencyKey: crypto.randomUUID(),
          order: {
            locationId: getSquareLocationId(),
            lineItems: [
              {
                name: `Yumi Forever - ${serviceName}`,
                quantity: '1',
                basePriceMoney: {
                  amount: BigInt(deposit_amount),
                  currency: 'USD',
                },
              },
            ],
            metadata: {
              booking_id: booking.id,
              payment_type: 'deposit',
            },
            referenceId: booking.id,
          },
          checkoutOptions: {
            redirectUrl: `${origin}/booking-confirmation?booking_id=${booking.id}`,
          },
          prePopulatedData: {
            buyerEmail: customer_email,
          },
        })

        checkoutUrl = paymentLink.paymentLink?.url || null
        const orderId = paymentLink.paymentLink?.orderId

        // Insert payment record
        if (checkoutUrl) {
          await supabaseAdmin.from('payments').insert({
            booking_id: booking.id,
            profile_id: user?.id || null,
            amount: deposit_amount,
            status: 'unpaid',
            payment_type: 'deposit',
            square_order_id: orderId || null,
          })
        }
      } catch (squareErr) {
        console.error('Square checkout creation error:', squareErr)
        // Don't fail the booking — user can pay later via /pay
      }
    }

    return NextResponse.json(
      {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        total,
        deposit_amount,
        checkoutUrl,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
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
