export type UserRole = 'customer' | 'crew' | 'dispatcher' | 'admin'

export type BookingStatus =
  | 'new'
  | 'pending_quote'
  | 'quote_sent'
  | 'confirmed'
  | 'assigned'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'canceled_refundable'
  | 'canceled_nonrefundable'
  | 'no_show'

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'failed'

export type PayType = 'hourly' | 'per_job'

export type PayrollStatus = 'pending' | 'approved' | 'paid'

export type ServiceCategory = 'home_care' | 'auto_care' | 'truck_fleet'

export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'commercial'

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'convertible' | 'other'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ServiceCategoryRecord {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  sort_order: number
}

export interface Service {
  id: string
  category_id: string
  name: string
  slug: string
  description: string
  base_price: number
  duration_minutes: number
  requires_quote: boolean
  requires_deposit: boolean
  deposit_amount: number | null
  is_active: boolean
  sort_order: number
}

export interface ServiceAddon {
  id: string
  service_id: string | null
  category_id: string | null
  name: string
  description: string
  price: number
  is_active: boolean
}

export interface Address {
  id: string
  profile_id: string
  label: string
  street: string
  unit: string | null
  city: string
  state: string
  zip_code: string
  gate_code: string | null
  parking_instructions: string | null
  property_type: PropertyType | null
  is_default: boolean
}

export interface Vehicle {
  id: string
  profile_id: string
  make: string
  model: string
  year: number
  color: string
  type: VehicleType
  license_plate: string | null
  condition_notes: string | null
}

export interface Booking {
  id: string
  booking_number: string
  profile_id: string
  service_id: string
  address_id: string | null
  vehicle_id: string | null
  status: BookingStatus
  payment_status: PaymentStatus
  scheduled_date: string
  scheduled_time: string
  estimated_duration: number
  subtotal: number
  tax: number
  total: number
  final_price: number | null
  deposit_amount: number
  adjustment_reason: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  address_text: string
  gate_code: string | null
  parking_instructions: string | null
  vehicle_info: string | null
  service_notes: string | null
  internal_notes: string | null
  started_at: string | null
  completed_at: string | null
  actual_duration_minutes: number | null
  deposit_waived: boolean
  review_credit_applied: number | null
  review_credit_id: string | null
  created_at: string
  updated_at: string
  // Joined
  service?: Service
  assigned_crew?: CrewAssignment[]
  payments?: Payment[]
  photos?: UploadedPhoto[]
}

export interface BookingItem {
  id: string
  booking_id: string
  addon_id: string
  name: string
  price: number
}

export interface BookingStatusHistory {
  id: string
  booking_id: string
  status: BookingStatus
  changed_by: string
  notes: string | null
  created_at: string
}

export interface CrewAssignment {
  id: string
  booking_id: string
  crew_member_id: string
  assigned_at: string
  crew_member?: Profile
}

export type PaymentMethod = 'online' | 'cash' | 'square_device'

export interface Payment {
  id: string
  booking_id: string
  profile_id: string
  amount: number
  status: PaymentStatus
  payment_type: 'deposit' | 'balance' | 'full' | 'tip' | 'refund'
  payment_method: PaymentMethod
  square_payment_id: string | null
  square_order_id: string | null
  created_at: string
}

export interface CrewPayProfile {
  id: string
  profile_id: string
  pay_type: PayType
  hourly_rate: number | null
  per_job_rate: number | null
  is_active: boolean
}

export interface PayrollEntry {
  id: string
  crew_member_id: string
  booking_id: string | null
  period_id: string | null
  pay_amount: number
  bonus_amount: number
  tip_amount: number
  hours_worked: number | null
  status: PayrollStatus
  paid_at: string | null
  notes: string | null
  created_at: string
}

export interface PayrollPeriod {
  id: string
  start_date: string
  end_date: string
  status: 'open' | 'closed' | 'paid'
  created_at: string
}

export interface UploadedPhoto {
  id: string
  booking_id: string
  uploaded_by: string
  photo_type: 'condition' | 'before' | 'after' | 'other'
  url: string
  caption: string | null
  created_at: string
}

export interface Review {
  id: string
  booking_id: string | null
  profile_id: string | null
  customer_name: string
  customer_email: string
  service_name: string
  rating: number
  comment: string | null
  is_approved: boolean
  is_featured: boolean
  is_published?: boolean
  created_at: string
}

export interface Subscription {
  id: string
  profile_id: string
  plan_name: string
  square_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'paused'
  current_period_start: string
  current_period_end: string
  created_at: string
}

export interface CommercialAccount {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  account_type: 'apartment' | 'dealership' | 'fleet' | 'commercial'
  notes: string | null
  is_active: boolean
  created_at: string
}

export type ReviewCreditStatus = 'active' | 'used' | 'expired'

export interface ReviewCredit {
  id: string
  profile_id: string
  review_id: string
  amount: number
  remaining: number
  status: ReviewCreditStatus
  used_on_booking_id: string | null
  expires_at: string
  created_at: string
  used_at: string | null
}

export type ViolationType = 'no_show' | 'late_cancellation'

export interface CustomerViolation {
  id: string
  customer_email: string | null
  customer_phone: string | null
  violation_type: ViolationType
  booking_id: string | null
  notes: string | null
  created_at: string
}

export interface QuoteRequest {
  id: string
  name: string
  email: string
  phone: string
  service_type: string
  description: string
  status: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed'
  created_at: string
}
