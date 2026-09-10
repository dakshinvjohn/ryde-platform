# CLAUDE.md

# RYDE Platform — AI Development Instructions

Welcome to the RYDE project.

This document defines how AI coding assistants (Claude, ChatGPT, GitHub Copilot, etc.) should contribute to this repository.

This document is the source of truth for how RYDE should be built.

---

# Current Business Stage

RYDE is currently launching Version 1 (MVP).

Current business:

- One premium chauffeur
- One executive vehicle
- Operating in the Netherlands
- Primary service is airport transfers
- Bookings are manually reviewed and confirmed
- Payments are processed digitally
- Customer communication is largely automated

The objective is **not** to build Uber.

The objective is to launch a profitable premium chauffeur business as quickly as possible while creating a foundation that can scale.

Whenever there is a choice between complexity and simplicity, choose simplicity.

Do not build future enterprise functionality unless explicitly requested.

---

# Business Goal

Every decision should contribute toward one or more of the following:

- Increase bookings
- Improve customer experience
- Increase conversion rate
- Improve SEO
- Reduce operational work
- Improve reliability
- Build customer trust
- Create reusable foundations for future growth

Technical perfection should never delay delivering customer value.

---

# Before Writing Code

Always read these documents first, in this order:

1. README.md
2. docs/00_PRODUCT_PRINCIPLES.md
3. docs/01_PROJECT_OVERVIEW.md
4. docs/03_TECH_STACK.md
5. docs/04_PROJECT_ARCHITECTURE.md
6. docs/05_CODING_STANDARDS.md
7. docs/06_DESIGN_SYSTEM.md
8. docs/07_BRAND_GUIDELINES.md

These documents are the source of truth.

If implementation conflicts with documentation, prefer the documentation unless explicitly instructed otherwise.

---

# Product Vision

RYDE delivers a premium chauffeur experience.

Customers should feel they are booking a luxury private chauffeur, not a taxi.

Every interaction should communicate:

- Luxury
- Trust
- Simplicity
- Professionalism
- Reliability
- Speed

The platform should feel elegant, premium and effortless.

---

# Current MVP Scope

The current product includes:

- Premium marketing website
- Service pages
- Airport transfer booking
- Booking request form
- Instant pricing
- Booking confirmation emails
- Stripe payments
- Google Maps integration
- Admin booking management
- SEO optimization

Future functionality such as fleet management, driver dashboards, AI assistants, multiple vehicles and corporate portals should only be implemented when requested.

---

# Customer Journey

Every feature should improve this journey.

Landing Page

↓

Service Selection

↓

Booking Form

↓

Instant Quote

↓

Booking Request

↓

Confirmation

↓

Payment

↓

Ride

↓

Invoice

If a feature does not improve this journey, question whether it belongs.

---

# Development Priorities

Priority 1

- Landing pages
- SEO
- Mobile experience
- Performance

Priority 2

- Booking flow
- Booking validation
- Pricing
- Google Maps
- Address autocomplete

Priority 3

- Stripe integration
- Email automation
- Booking database

Priority 4

- Admin dashboard
- Booking management
- Calendar
- Availability management

Priority 5

- Customer accounts

Priority 6

- Driver dashboard

Priority 7

- Fleet management

Priority 8

- AI features

---

# Core Development Principles

Every change should improve at least one of:

- Simplicity
- Maintainability
- Scalability
- Performance
- Accessibility
- Security
- User Experience

Avoid unnecessary complexity.

Avoid technical debt.

Build software that another engineer can understand immediately.

---

# Engineering Standards

Always:

- Use TypeScript
- Use App Router
- Follow project architecture
- Write reusable components
- Keep functions small
- Separate business logic from UI
- Prefer composition over duplication
- Keep files focused
- Use server components whenever appropriate
- Keep client components minimal

Never:

- Hardcode secrets
- Duplicate logic
- Introduce unnecessary dependencies
- Rewrite working code without reason
- Create overly abstract solutions

---

# Technology Stack

Official technologies:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Stripe
- Resend
- Google Maps Platform
- Vercel

Do not replace technologies unless explicitly instructed.

---

# Booking Philosophy

The booking process should require the fewest possible steps.

Collect only essential information:

- Pickup address
- Destination
- Date
- Time
- Passenger count
- Luggage
- Flight number (when applicable)
- Customer name
- Email
- Phone number

Avoid unnecessary fields.

A customer should complete a booking in under two minutes.

---

# Customer Experience Standards

Every page should increase trust.

Use:

- Clear pricing
- Professional language
- High quality imagery
- Consistent spacing
- Clear calls-to-action
- Fast loading
- Mobile-first layouts

Avoid anything that makes the service feel like a budget taxi company.

---

# Design Principles

Follow the Design System.

Maintain:

- Premium appearance
- Large whitespace
- Elegant typography
- Consistent spacing
- Modern components
- Excellent responsiveness
- WCAG accessibility

Never invent new design patterns unless they improve the overall product.

---

# SEO Requirements

Every public page should:

- Include metadata
- Include Open Graph tags
- Use semantic HTML
- Support structured data
- Follow Next.js SEO best practices
- Optimize Core Web Vitals
- Target high-intent chauffeur and airport transfer keywords

Local SEO is extremely important.

---

# Performance Standards

Aim for:

- Lighthouse Performance ≥95
- Accessibility ≥95
- Best Practices ≥95
- SEO ≥95

Always:

- Optimize images
- Lazy load where appropriate
- Minimize JavaScript
- Reduce bundle size
- Avoid unnecessary client-side rendering

---

# Security

Always:

- Validate all user input
- Use HTTPS
- Store secrets in environment variables
- Enable Supabase Row Level Security
- Restrict Google Maps API keys
- Use Stripe test mode until production

Never expose:

- API keys
- Database credentials
- Service role keys
- Payment secrets

---

# Environment Variables

Never hardcode credentials.

Use environment variables.

Expected variables include:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- NEXT_PUBLIC_APP_URL

Never commit .env.local.

---

# Code Quality

Generated code should:

- Compile successfully
- Pass TypeScript
- Be responsive
- Be accessible
- Be readable
- Be maintainable
- Match existing architecture
- Avoid duplication

Readable code is preferred over clever code.

---

# Git Workflow

One logical feature per commit.

Use Conventional Commits.

Examples:

- feat: add airport booking flow
- feat: integrate Stripe checkout
- feat: add Google Maps autocomplete
- fix: resolve booking validation
- docs: update booking documentation
- refactor: simplify booking service

---

# Documentation

When completing a feature:

- Update relevant documentation
- Update README if needed
- Update CHANGELOG when appropriate

Documentation is part of the feature.

---

# Testing Checklist

Before marking work complete:

- Project builds successfully
- TypeScript passes
- No lint errors
- Responsive on mobile
- Responsive on desktop
- Accessibility verified
- No secrets exposed
- Existing functionality still works

---

# AI Behaviour

When working on this repository:

Think like both a senior software engineer and a startup founder.

Always:

- Prefer shipping over perfection
- Build incrementally
- Minimize operational complexity
- Keep code maintainable
- Preserve existing architecture
- Explain significant technical decisions
- Challenge unnecessary complexity
- Suggest better approaches when appropriate

Avoid speculative engineering.

If a feature is unlikely to improve bookings, customer experience or operational efficiency, question whether it should be built.

---

# Definition of Done

A task is complete only if:

- Functionality works
- Code follows project standards
- TypeScript passes
- Responsive behavior verified
- Accessibility considered
- Documentation updated
- Meaningful commit prepared

---

# Final Instruction

Build RYDE as the benchmark premium chauffeur platform in the Netherlands.

Every decision should improve the customer experience while keeping the platform simple, elegant, reliable, secure and ready for future growth.

Build what the business needs today.

Design so it can grow tomorrow.