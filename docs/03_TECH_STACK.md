# 03 — Technology Stack

**Version:** 1.0
**Status:** Active Development

---

# Purpose

This document defines the official technology stack used throughout the RYDE platform.

It explains:

* Why each technology was selected
* The responsibility of each technology
* Approved supporting libraries
* Architectural guidelines
* Future technology considerations

This document acts as the technical source of truth for all development.

---

# Technology Philosophy

Technology should never be selected simply because it is new or popular.

Every technology used by RYDE must satisfy the following criteria:

* Stable
* Well documented
* Actively maintained
* Production proven
* Scalable
* Easy to maintain
* Supported by a strong developer community

Whenever multiple technologies solve the same problem, the simplest and most maintainable solution should be preferred.

---

# Architecture Overview

```text
Customer
        │
        ▼
Next.js Frontend
        │
        ├──────── Google Maps
        ├──────── Stripe
        ├──────── Resend
        └──────── Supabase
                      │
                      ▼
                PostgreSQL Database
```

---

# Core Technology Stack

| Layer                | Technology           | Purpose                    |
| -------------------- | -------------------- | -------------------------- |
| Frontend Framework   | Next.js (App Router) | User interface and routing |
| Programming Language | TypeScript           | Type-safe development      |
| Styling              | Tailwind CSS         | Utility-first styling      |
| UI Components        | shadcn/ui            | Reusable UI components     |
| Icons                | Lucide React         | Consistent icon library    |
| Animations           | Framer Motion        | Smooth interactions        |
| Forms                | React Hook Form      | Form state management      |
| Validation           | Zod                  | Schema validation          |
| Database             | Supabase PostgreSQL  | Primary database           |
| Authentication       | Supabase Auth        | User authentication        |
| Payments             | Stripe               | Secure payment processing  |
| Email                | Resend               | Transactional emails       |
| Maps                 | Google Maps Platform | Maps, routes and places    |
| Deployment           | Vercel               | Hosting and CI/CD          |

---

# Frontend

## Next.js

### Why Next.js?

Chosen because it provides:

* App Router
* Excellent performance
* SEO support
* Server Components
* Client Components
* API Routes
* Static generation
* Server rendering
* Production-ready deployment on Vercel

Next.js is the foundation of the entire application.

---

## TypeScript

Every file should be written in TypeScript.

Benefits:

* Fewer runtime errors
* Better autocomplete
* Easier refactoring
* Better documentation through types
* Improved maintainability

Strict typing should remain enabled.

---

## Tailwind CSS

Chosen because:

* Extremely fast development
* Consistent spacing
* Responsive utilities
* Small production bundle
* Easy theme customization

No inline CSS should be used.

---

## shadcn/ui

Chosen because:

* Accessible
* Beautiful defaults
* Highly customizable
* Built on Radix UI
* No unnecessary abstraction

Components should be customized to match the RYDE design system.

---

## Framer Motion

Animations should enhance the experience.

Use Framer Motion for:

* Page transitions
* Component transitions
* Loading animations
* Booking flow
* Dashboard interactions

Animations should remain subtle and purposeful.

---

# Backend

## Supabase

Supabase provides:

* PostgreSQL database
* Authentication
* Row Level Security
* Storage
* Realtime capabilities

Benefits:

* Open source
* Excellent developer experience
* SQL database
* Easy scaling

---

# Authentication

Supabase Auth will manage:

* Customer accounts
* Driver accounts
* Administrator accounts

Authentication methods:

* Email and password
* Password reset
* Session management

Future:

* Google Sign-In
* Apple Sign-In

---

# Database

Database engine:

PostgreSQL

Advantages:

* Mature
* Reliable
* ACID compliant
* Excellent indexing
* Strong relational modelling

---

# Maps

Google Maps Platform provides:

* Interactive maps
* Address autocomplete
* Route planning
* Distance calculation
* Estimated travel time
* Geocoding

Only required APIs should be enabled.

API keys must always be restricted.

---

# Payments

Stripe manages:

* Online payments
* Payment Intents
* Refunds
* Receipts
* Future subscriptions

Development should remain in Test Mode until production launch.

---

# Email

Resend manages:

* Booking confirmations
* Payment confirmations
* Password resets
* Notifications

No SMTP configuration should be required.

---

# Deployment

Vercel is the official hosting platform.

Reasons:

* Native Next.js support
* Automatic deployments
* Preview deployments
* Edge network
* Environment variable management

The production branch is:

```text
main
```

---

# Project Structure

The project follows a feature-oriented structure.

```text
app/
components/
hooks/
lib/
services/
styles/
types/
emails/
public/
docs/
design/
archive/
```

Each folder has a single responsibility.

---

# Approved Libraries

The following libraries are approved for use.

## UI

* shadcn/ui
* Radix UI

## Forms

* React Hook Form
* Zod

## Icons

* Lucide React

## Animations

* Framer Motion

## Utilities

* clsx
* class-variance-authority
* date-fns

Avoid introducing additional libraries unless they provide significant value.

---

# Future Technologies

The following may be introduced later if required:

| Technology                   | Purpose                 |
| ---------------------------- | ----------------------- |
| PostHog                      | Product analytics       |
| Sentry                       | Error monitoring        |
| React Query / TanStack Query | Advanced server state   |
| Playwright                   | End-to-end testing      |
| Vitest                       | Unit testing            |
| Storybook                    | Component documentation |

These are intentionally deferred until they provide clear value.

---

# Technology Selection Principles

Before introducing a new dependency, ask:

* Does it solve a real problem?
* Can the same result be achieved with existing tools?
* Is it actively maintained?
* Is it well documented?
* Does it increase long-term maintenance?

If the answer is uncertain, do not introduce the dependency.

---

# Version Management

General principles:

* Keep dependencies reasonably up to date.
* Avoid unnecessary major upgrades.
* Test thoroughly before upgrading critical packages.
* Record significant upgrades in `CHANGELOG.md`.

---

# Security Considerations

* Never expose secret keys in client-side code.
* Store secrets in environment variables.
* Use HTTPS in production.
* Restrict API keys.
* Enable Row Level Security in Supabase.
* Validate all user input.

---

# Summary

The RYDE technology stack has been selected to prioritise:

* Maintainability
* Scalability
* Security
* Performance
* Developer experience
* Long-term sustainability

Every future technical decision should reinforce these goals rather than compromise them.
