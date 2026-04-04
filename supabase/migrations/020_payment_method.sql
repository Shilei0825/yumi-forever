-- Track how payments were collected: online (Square checkout), cash, or square_device
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online'
  CHECK (payment_method IN ('online', 'cash', 'square_device'));
