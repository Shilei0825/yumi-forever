-- Migration 010: Rename Stripe columns to Square
-- Using RENAME COLUMN preserves all existing data, indexes, and constraints

-- profiles table
ALTER TABLE profiles RENAME COLUMN stripe_customer_id TO square_customer_id;

-- payments table
ALTER TABLE payments RENAME COLUMN stripe_payment_intent_id TO square_payment_id;
ALTER TABLE payments RENAME COLUMN stripe_checkout_session_id TO square_order_id;

-- invoices table (not actively used but rename for consistency)
ALTER TABLE invoices RENAME COLUMN stripe_invoice_id TO square_invoice_id;

-- subscriptions table (not actively used but rename for consistency)
ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO square_subscription_id;
ALTER TABLE subscriptions RENAME COLUMN stripe_price_id TO square_plan_id;
