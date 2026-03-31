# Yumi Care

**Premium On-Demand Home & Auto Services**

A production-ready MVP for a local premium service platform offering mobile car wash, car detailing, home cleaning, and fleet services.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn-style components
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4o (image analysis for booking estimates)
- **Deployment**: Vercel-ready

## Features

### Public Website
- Premium marketing homepage with service categories, membership plans, reviews
- Individual service pages (Home Care, Auto Care, Truck & Fleet)
- Pricing page, commercial solutions page, about, contact
- Mobile-first responsive design with sticky CTAs

### Customer Booking System
- Multi-step booking wizard (category > service > add-ons > details > schedule > review & pay)
- Service area validation by zip code
- Guest and authenticated booking support
- Stripe checkout for deposits and full payments
- Photo upload for vehicle condition with AI-powered analysis
- Real-time pricing estimates via OpenAI image analysis
- Automatic fallback to manual estimates if AI is unavailable

### Customer Portal (`/portal`)
- Dashboard with upcoming bookings and payment summary
- Booking management (view, reschedule, cancel)
- Payment history and invoices
- Membership management
- Review system with star ratings

### Crew Portal (`/crew`)
- Mobile-optimized for field use
- Today's jobs dashboard
- Job detail with Start/Complete actions
- Before/after photo upload
- Customer call and directions buttons
- Payroll and earnings visibility
- Checklist and notes per job

### Dispatch Dashboard (`/dispatch`)
- Daily job overview with assignment status
- Calendar/weekly view
- Job management with crew assignment
- Crew capacity planning
- Status updates and internal notes

### Admin Dashboard (`/admin`)
- Revenue and operations overview
- Full booking management
- Customer database
- Crew management with pay profiles
- Payroll dashboard (mark paid, export)
- Payment tracking
- Service catalog management
- Commercial accounts and contracts
- Membership management
- Review moderation
- Pricing controls (`/admin/pricing`) for base prices and AI estimate adjustments

### Payments (Stripe)
- One-time booking payments
- Deposit + remaining balance flow
- Webhook handling for payment status

### Payroll System
- Hourly and per-job pay models
- Automatic payroll entry on job completion
- Bonus and tip tracking
- Pay period management
- Crew earnings visibility

### AI Image Analysis (Booking Flow)

When customers upload photos during the booking process (e.g., vehicle condition photos), the app sends them to OpenAI's GPT-4o vision model for automated analysis. The AI evaluates the condition and complexity of the work needed, then returns a pricing estimate that factors in:

- Vehicle/home size and type
- Visible dirt, stains, or damage levels
- Estimated time and effort required
- Recommended add-on services

**Fallback Behavior:** If the AI analysis fails for any reason (missing API key, network error, rate limit, invalid image), the booking flow gracefully falls back to manual pricing estimates based on the service's configured base price and any selected add-ons. The customer can always proceed with booking regardless of whether AI analysis succeeds.

### Admin Pricing Controls (`/admin/pricing`)

Administrators can manage pricing through the dedicated pricing dashboard:

- Set and update base prices for all services
- Configure AI estimate adjustment multipliers
- Override AI-generated estimates for specific service categories
- View pricing history and trends

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase account (free tier works)
- Stripe account (test mode)

### 1. Clone and Install

```bash
git clone <your-repo-url> yumi-care
cd yumi-care
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Yumi Care
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema migrations in order:
   - Copy and paste the contents of `supabase/migrations/001_schema.sql`
   - Copy and paste the contents of `supabase/migrations/002_booking_details_pricing.sql`
3. Run the seed data:
   - Copy and paste the contents of `supabase/seed/001_seed.sql`
4. Create a storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a bucket called `booking-photos` (set to public)
   - Add policies for authenticated uploads and public reads
5. Create the dev admin account via Supabase Auth (Authentication > Users):
   - Email: `linda20010515@gmail.com`, Password: `12345678`
   - After creation, update the profile role to `admin`:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'linda20010515@gmail.com';
     ```
6. (Optional) Create additional demo users:
   - `sam@yumicare.com` (then update profile role to `dispatcher`)
   - `customer@example.com` (default role `customer`)
   - Update roles in the profiles table via SQL Editor

> **Note:** Crew accounts are admin-created only. Use the admin dashboard at `/admin/crews` to create and manage crew members. Crew members cannot self-register.

### 4. Stripe Setup

1. Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Set up webhook endpoint:
   - For local dev: use Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - For production: add webhook endpoint `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`

### 5. OpenAI API Setup

The app uses OpenAI's GPT-4o model with vision capabilities for AI-powered image analysis during the booking flow.

1. Create an account at [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys and generate a new secret key
3. Add the key to your `.env.local` as `OPENAI_API_KEY`
4. The default model is `gpt-4o` (set via `OPENAI_MODEL`). This model supports image analysis and provides the best accuracy for vehicle/home condition assessment.

> **Note:** OpenAI API usage incurs costs. Monitor your usage at [platform.openai.com/usage](https://platform.openai.com/usage). For development, you can leave `OPENAI_API_KEY` empty and the app will fall back to manual estimates.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
yumi-care/
├── src/
│   ├── app/
│   │   ├── (public)/          # Marketing pages
│   │   ├── (auth)/            # Login, signup, crew-login
│   │   ├── portal/            # Customer portal
│   │   ├── crew/              # Crew mobile portal
│   │   ├── dispatch/          # Dispatch dashboard
│   │   ├── admin/             # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Header, footer, dashboard shell
│   │   └── booking/           # Booking flow components
│   ├── lib/
│   │   ├── supabase/          # Supabase client/server/middleware
│   │   ├── stripe.ts          # Stripe client
│   │   ├── openai.ts          # OpenAI client for image analysis
│   │   ├── auth.ts            # Auth utilities
│   │   ├── constants.ts       # Service catalog, brand info
│   │   └── utils.ts           # Formatting, helpers
│   └── types/                 # TypeScript type definitions
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql                    # Core database schema
│   │   └── 002_booking_details_pricing.sql   # Booking details & pricing tables
│   └── seed/                  # Demo data
├── .env.example
└── README.md
```

## User Roles

| Role | Access | Login |
|------|--------|-------|
| Customer | `/portal` - Bookings, payments, reviews | `/login` or `/signup` |
| Crew | `/crew` - Jobs, photos, pay history | `/crew-login` |
| Dispatcher | `/dispatch` - All jobs, crew assignment | `/login` |
| Admin | `/admin` - Full system access | `/login` |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Stripe webhook URL: `https://your-domain.vercel.app/api/stripe/webhook`

## V2 Roadmap

- Real-time notifications (Supabase Realtime)
- Email notifications (Resend/SendGrid)
- GPS tracking for crew
- Route optimization for dispatch
- SMS notifications
- Advanced analytics dashboard
- Recurring booking automation
- Stripe Connect for crew payouts
- Mobile app (React Native)
- Inventory tracking
- Automated scheduling
- Google Calendar integration
