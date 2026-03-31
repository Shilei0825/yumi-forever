-- Add reminder_sent_at column to track when reminder emails are sent
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index for efficient cron queries (find bookings needing reminders)
CREATE INDEX IF NOT EXISTS idx_bookings_reminder
  ON bookings(scheduled_date)
  WHERE reminder_sent_at IS NULL;
