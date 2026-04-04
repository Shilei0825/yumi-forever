import { resend } from '@/lib/resend'
import { bookingConfirmationHtml, bookingConfirmationSubject } from './booking-confirmation'
import { bookingReminderHtml, bookingReminderSubject } from './booking-reminder'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Yumi Forever <onboarding@resend.dev>'

interface BookingData {
  booking_number: string
  customer_name: string
  customer_email: string
  scheduled_date: string
  scheduled_time: string
  address_text: string
  total: number
  deposit_amount: number
  remaining_balance: number
  booking_items?: { name: string; price: number }[]
}

export async function sendBookingConfirmationEmail(
  booking: BookingData,
  serviceName: string,
  hasAccount?: boolean
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customer_email,
      subject: bookingConfirmationSubject(booking.booking_number),
      html: bookingConfirmationHtml({
        bookingNumber: booking.booking_number,
        customerName: booking.customer_name,
        serviceName,
        scheduledDate: formatDate(booking.scheduled_date),
        scheduledTime: formatTime(booking.scheduled_time),
        addressText: booking.address_text,
        total: formatCurrency(booking.total),
        depositAmount: formatCurrency(booking.deposit_amount),
        remainingBalance: formatCurrency(booking.remaining_balance),
        addons: (booking.booking_items || []).map((item) => ({
          name: item.name,
          price: formatCurrency(item.price),
        })),
        hasAccount,
      }),
    })
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error)
  }
}

export async function sendBookingReminderEmail(
  booking: BookingData,
  serviceName: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customer_email,
      subject: bookingReminderSubject(booking.booking_number),
      html: bookingReminderHtml({
        bookingNumber: booking.booking_number,
        customerName: booking.customer_name,
        serviceName,
        scheduledDate: formatDate(booking.scheduled_date),
        scheduledTime: formatTime(booking.scheduled_time),
        addressText: booking.address_text,
        depositAmount: formatCurrency(booking.deposit_amount),
      }),
    })
  } catch (error) {
    console.error('Failed to send booking reminder email:', error)
  }
}
