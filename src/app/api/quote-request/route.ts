import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { name, email, phone, company_name, service_type, description } = body

    // Validate required fields
    if (!name || !email || !phone || !service_type || !description) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, email, phone, service_type, description',
        },
        { status: 400 }
      )
    }

    // Insert into quote_requests table
    const { data: quoteRequest, error } = await supabase
      .from('quote_requests')
      .insert({
        name,
        email,
        phone,
        company_name: company_name || null,
        service_type,
        description,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Quote request insert error:', error)
      return NextResponse.json(
        { error: 'Failed to submit quote request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: quoteRequest.id }, { status: 201 })
  } catch (error) {
    console.error('Quote request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
