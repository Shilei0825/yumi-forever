interface BookingConfirmationProps {
  bookingNumber: string
  customerName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  addressText: string
  total: string
  depositAmount: string
  remainingBalance: string
  addons: { name: string; price: string }[]
  hasAccount?: boolean
  siteUrl?: string
}

export function bookingConfirmationHtml(props: BookingConfirmationProps): string {
  const siteUrl = props.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://yumiforever.com'

  const addonRows = props.addons
    .map(
      (a) =>
        `<tr><td style="padding:4px 0;color:#555;">${a.name}</td><td style="padding:4px 0;text-align:right;color:#555;">${a.price}</td></tr>`
    )
    .join('')

  const portalCta = props.hasAccount
    ? `
  <!-- Manage Booking CTA -->
  <div style="background:#f8f4fc;border:1px solid #eedcf7;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
    <p style="margin:0 0 8px;color:#2A2A2A;font-size:14px;font-weight:600;">Manage Your Booking</p>
    <p style="margin:0 0 16px;color:#555;font-size:13px;">Sign in to your account to view, modify, or cancel your booking. You can also pay your balance through the portal.</p>
    <a href="${siteUrl}/login" style="display:inline-block;background:#57068C;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Sign In to Your Account</a>
  </div>`
    : `
  <!-- Sign Up CTA -->
  <div style="background:#f8f4fc;border:1px solid #eedcf7;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
    <p style="margin:0 0 8px;color:#2A2A2A;font-size:14px;font-weight:600;">Manage Your Booking Online</p>
    <p style="margin:0 0 16px;color:#555;font-size:13px;">Create a free account using the same email or phone number you booked with. You&rsquo;ll be able to modify, cancel, or pay your balance through your personal portal.</p>
    <a href="${siteUrl}/sign-up" style="display:inline-block;background:#57068C;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Create Your Account</a>
  </div>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

<!-- Header -->
<tr><td style="background:#57068C;padding:32px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Yumi Forever</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 8px;color:#2A2A2A;font-size:20px;">Booking Confirmed!</h2>
  <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi ${props.customerName}, your appointment has been booked.</p>

  <!-- Booking Number -->
  <div style="background:#f8f4fc;border:1px solid #eedcf7;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
    <p style="margin:0 0 4px;color:#7A7A7A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Number</p>
    <p style="margin:0;color:#57068C;font-size:24px;font-weight:700;letter-spacing:2px;">${props.bookingNumber}</p>
  </div>

  <!-- Details -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#7A7A7A;font-size:13px;">Service</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#2A2A2A;font-weight:600;">${props.serviceName}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#7A7A7A;font-size:13px;">Date</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#2A2A2A;font-weight:600;">${props.scheduledDate}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#7A7A7A;font-size:13px;">Time</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#2A2A2A;font-weight:600;">${props.scheduledTime}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#7A7A7A;font-size:13px;">Location</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#2A2A2A;font-weight:600;">${props.addressText}</td></tr>
  </table>

  ${addonRows ? `
  <p style="margin:0 0 8px;color:#2A2A2A;font-size:14px;font-weight:600;">Add-ons</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;font-size:14px;">
    ${addonRows}
  </table>` : ''}

  <!-- Payment Summary -->
  <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr><td style="padding:4px 0;color:#555;">Total</td>
          <td style="padding:4px 0;text-align:right;color:#2A2A2A;font-weight:600;">${props.total}</td></tr>
      <tr><td style="padding:4px 0;color:#555;">Deposit Paid</td>
          <td style="padding:4px 0;text-align:right;color:#57068C;font-weight:600;">${props.depositAmount}</td></tr>
      <tr><td style="padding:4px 0;color:#555;">Remaining Balance</td>
          <td style="padding:4px 0;text-align:right;color:#2A2A2A;font-weight:600;">${props.remainingBalance}</td></tr>
    </table>
  </div>

  ${portalCta}

  <!-- Cancellation Policy -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 4px;color:#166534;font-size:14px;font-weight:600;">Free Cancellation</p>
    <p style="margin:0;color:#15803d;font-size:13px;">Cancel at least 24 hours before your appointment for free. No-shows or late cancellations may result in a deposit requirement for future bookings.</p>
  </div>

  <p style="margin:0;color:#7A7A7A;font-size:13px;">Questions? Reply to this email or call us at (555) 123-4567.</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f5f5f5;padding:24px;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0;color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} Yumi Forever. All rights reserved.</p>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`
}

export function bookingConfirmationSubject(bookingNumber: string): string {
  return `Booking Confirmed - ${bookingNumber}`
}
