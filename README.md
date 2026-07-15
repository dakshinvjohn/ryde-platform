# RYDE Platform

> Production-ready premium chauffeur platform.

## Tech Stack (LOCKED)
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Framer Motion
- Supabase
- Supabase Auth
- Stripe
- Resend
- Google Maps Platform
- Vercel

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<<ADD PROJECT URL>>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<<ADD ANON KEY>>
SUPABASE_SERVICE_ROLE_KEY=<<ADD SERVICE ROLE KEY>>

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<<ADD PUBLISHABLE KEY>>
STRIPE_SECRET_KEY=<<ADD SECRET KEY>>
STRIPE_WEBHOOK_SECRET=<<ADD LATER>>

RESEND_API_KEY=<<ADD API KEY>>

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<<ADD API KEY>>
```

Never commit `.env.local`.

## Where to find keys

### Supabase
Project Settings → API
- Project URL [https://fwyyxrvtzoalgiawejrv.supabase.co]
- anon key
- service_role key

### Stripe
Developers → API Keys
- Publishable key
- Secret key

Later:
Developers → Webhooks
- Webhook secret

### Resend
API Keys → Create API key

### Google Cloud
APIs & Services → Credentials

Enable:
- Maps JavaScript API
- Places API
- Geocoding API
- Directions/Routes API

## Roadmap

1. Foundation
2. Landing Page
3. Booking Experience
4. Google Maps
5. Supabase
6. Authentication
7. Payments
8. Emails
9. Customer Dashboard
10. Driver Dashboard
11. Admin Dashboard
12. AI Assistant

## Design System

Colors
- #111111
- #C8A45D
- #FAFAFA
- #FFFFFF
- #6B7280

Fonts
- Fraunces (headings)
- Inter (body)

Border Radius
- Cards 20px
- Inputs 18px
- Buttons 16px

Animations
- 250–350ms

## Production Checklist

- Restrict Google API key
- Configure Stripe webhooks
- Configure Vercel environment variables
- Configure Supabase auth redirects
- Verify Resend domain
- Connect custom domain
