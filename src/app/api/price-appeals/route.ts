import { createClient } from '@supabase/supabase-js'
import { resend } from '@/lib/resend'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  'Yumi Forever <onboarding@resend.dev>'

/**
 * POST /api/price-appeals — Submit a price appeal request
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      service_slug,
      service_name,
      quoted_price,
      customer_name,
      customer_email,
      customer_phone,
      contact_preference,
      message,
    } = body

    // Validate required fields
    if (!service_slug || !service_name || !quoted_price || !customer_name || !contact_preference) {
      return NextResponse.json(
        { error: 'Missing required fields: service_slug, service_name, quoted_price, customer_name, contact_preference' },
        { status: 400 }
      )
    }

    // Validate contact preference
    if (!['phone', 'text', 'email'].includes(contact_preference)) {
      return NextResponse.json(
        { error: 'contact_preference must be one of: phone, text, email' },
        { status: 400 }
      )
    }

    // At least email or phone must be provided
    if (!customer_email && !customer_phone) {
      return NextResponse.json(
        { error: 'At least an email or phone number must be provided' },
        { status: 400 }
      )
    }

    // If contact preference is email, email must be provided
    if (contact_preference === 'email' && !customer_email) {
      return NextResponse.json(
        { error: 'Email is required when contact preference is email' },
        { status: 400 }
      )
    }

    // If contact preference is phone or text, phone must be provided
    if ((contact_preference === 'phone' || contact_preference === 'text') && !customer_phone) {
      return NextResponse.json(
        { error: 'Phone number is required when contact preference is phone or text' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Insert the price appeal
    const { data: appeal, error } = await supabase
      .from('price_appeals')
      .insert({
        service_slug,
        service_name,
        quoted_price,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        contact_preference,
        message: message || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Price appeal insert error:', error)
      return NextResponse.json(
        { error: 'Failed to submit price appeal' },
        { status: 500 }
      )
    }

    // Format price for email display
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(quoted_price / 100)

    // Determine preferred contact display
    const contactLabels: Record<string, string> = {
      phone: 'Phone Call',
      text: 'Text Message',
      email: 'Email',
    }

    // Send notification email to business
    const html = `
      <h2>New Price Appeal Request</h2>
      <hr />
      <h3>Service: ${service_name}</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Customer:</td>
          <td style="padding: 8px 12px;">${customer_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Quoted Price:</td>
          <td style="padding: 8px 12px;">${formattedPrice}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Email:</td>
          <td style="padding: 8px 12px;">${customer_email ? `<a href="mailto:${customer_email}">${customer_email}</a>` : 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Phone:</td>
          <td style="padding: 8px 12px;">${customer_phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Preferred Contact:</td>
          <td style="padding: 8px 12px;">${contactLabels[contact_preference] || contact_preference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Message:</td>
          <td style="padding: 8px 12px;">${message || 'No message provided'}</td>
        </tr>
      </table>
      <hr />
      <p style="color: #666; font-size: 12px;">
        This price appeal was submitted from the Yumi Forever website.
        Please review and follow up with the customer via their preferred contact method.
      </p>
    `

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'business@yumiforever.com',
      subject: `Price Appeal: ${service_name} - ${customer_name}`,
      html,
    })

    if (emailError) {
      // Log but don't fail the request — the appeal is already saved
      console.error('Failed to send price appeal notification email:', emailError)
    }

    return NextResponse.json(
      { success: true, id: appeal.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Price appeal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
