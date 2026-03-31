import { resend } from '@/lib/resend'
import { NextResponse } from 'next/server'

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  'Yumi Forever Careers <onboarding@resend.dev>'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // Parse text fields
    const firstName = formData.get('firstName') as string | null
    const lastName = formData.get('lastName') as string | null
    const email = formData.get('email') as string | null
    const phone = formData.get('phone') as string | null
    const position = formData.get('position') as string | null
    const experience = formData.get('experience') as string | null
    const message = formData.get('message') as string | null
    const agreedToEEOValue = formData.get('agreedToEEO') as string | null
    const agreedToEEO = agreedToEEOValue === 'true'

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !position) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: firstName, lastName, email, phone, position',
        },
        { status: 400 }
      )
    }

    if (!agreedToEEO) {
      return NextResponse.json(
        { error: 'You must agree to the EEO statement to apply' },
        { status: 400 }
      )
    }

    // Parse resume file
    const resume = formData.get('resume') as File | null

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(resume.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, and DOCX files are accepted' },
        { status: 400 }
      )
    }

    // Validate file size
    if (resume.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB limit' },
        { status: 400 }
      )
    }

    // Convert file to buffer for attachment
    const resumeBuffer = Buffer.from(await resume.arrayBuffer())

    // Build the email HTML body
    const html = `
      <h2>New Career Application</h2>
      <hr />
      <h3>Position: ${position}</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Name:</td>
          <td style="padding: 8px 12px;">${firstName} ${lastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Email:</td>
          <td style="padding: 8px 12px;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Phone:</td>
          <td style="padding: 8px 12px;">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Experience:</td>
          <td style="padding: 8px 12px;">${experience || 'Not specified'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Message:</td>
          <td style="padding: 8px 12px;">${message || 'No message provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Agreed to EEO:</td>
          <td style="padding: 8px 12px;">Yes</td>
        </tr>
      </table>
      <hr />
      <p style="color: #666; font-size: 12px;">
        The applicant's resume is attached to this email.
      </p>
    `

    // Send email via Resend with resume attachment
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'business@yumiforever.com',
      subject: `New Application: ${position} - ${firstName} ${lastName}`,
      html,
      attachments: [
        {
          filename: resume.name,
          content: resumeBuffer,
        },
      ],
    })

    if (emailError) {
      console.error('Failed to send application email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send application. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Career application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
