interface BookingReminderProps {
  bookingNumber: string
  customerName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  addressText: string
  depositAmount: string
}

export function bookingReminderHtml(props: BookingReminderProps): string {
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
  <h2 style="margin:0 0 8px;color:#2A2A2A;font-size:20px;">Your Appointment is Coming Up!</h2>
  <p style="margin:0 0 24px;color:#555;font-size:15px;">Hi ${props.customerName}, this is a friendly reminder that your appointment is in <strong>48 hours</strong>.</p>

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

  <!-- Preparation Tips -->
  <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 8px;color:#2A2A2A;font-size:14px;font-weight:600;">How to Prepare</p>
    <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:13px;line-height:1.6;">
      <li>Ensure the service area is accessible</li>
      <li>Remove personal belongings from the vehicle or area</li>
      <li>Have any gate codes or access instructions ready</li>
    </ul>
  </div>

  <!-- Cancellation Policy -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 4px;color:#166534;font-size:14px;font-weight:600;">Cancellation Policy</p>
    <p style="margin:0;color:#15803d;font-size:13px;">You can still cancel for free! Cancel at least 24 hours before your appointment and your full deposit of ${props.depositAmount} will be returned to your card within 5–10 business days.</p>
    <p style="margin:8px 0 0;color:#15803d;font-size:13px;">Late cancellations (less than 24 hours) will forfeit the deposit.</p>
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

export function bookingReminderSubject(bookingNumber: string): string {
  return `Reminder: Your Yumi Forever Appointment is in 48 Hours - ${bookingNumber}`
}
