# 05 — Coding Standards

**Version:** 1.0
**Status:** Active Development

---

# Purpose

This document defines the coding standards for the RYDE platform.

Every contributor, whether human or AI, should follow these standards to ensure consistency, maintainability, readability, and long-term scalability.

These standards apply to every file in the project.

---

# Core Philosophy

Write code for the next developer.

That developer might be:

* Yourself six months from now
* Another engineer
* An AI coding assistant

Readable code is more valuable than clever code.

---

# General Principles

Every piece of code should be:

* Readable
* Reusable
* Maintainable
* Predictable
* Type-safe
* Well documented

Avoid unnecessary complexity.

---

# Project Structure

Never create new folders unless they align with the project architecture.

Every file should belong to one clear responsibility.

---

# Naming Conventions

## Files

Use **kebab-case** for utility and service files.

Examples:

```text
google-maps.service.ts
booking-utils.ts
date-helpers.ts
```

---

## React Components

Use **PascalCase**.

Examples:

```text
BookingForm.tsx
JourneySummary.tsx
VehicleCard.tsx
CustomerDashboard.tsx
```

---

## Hooks

Always begin with `use`.

Examples:

```text
useBooking.ts
useCustomer.ts
useMap.ts
```

---

## Variables

Use meaningful camelCase names.

Good:

```ts
customerBooking
pickupLocation
estimatedArrivalTime
```

Avoid:

```ts
data
obj
temp
x
```

---

## Constants

Use UPPER_SNAKE_CASE.

```ts
MAX_PASSENGERS
DEFAULT_CURRENCY
BOOKING_STATUS
```

---

# TypeScript Rules

Strict mode should remain enabled.

Never use:

```ts
any
```

Prefer:

* interfaces
* union types
* enums (only when appropriate)
* type aliases

Every function should have explicit types where helpful.

---

# React Guidelines

Prefer functional components.

Never use class components.

Keep components focused.

Large pages should be built from smaller reusable components.

---

# Component Size

As a guideline:

* Small UI components → under ~100 lines
* Feature components → under ~300 lines

If a component becomes difficult to understand, split it into smaller components.

These are guidelines rather than strict limits.

---

# Props

Keep props explicit.

Prefer:

```ts
interface BookingCardProps {
  customerName: string;
  pickup: string;
}
```

Avoid passing large, unrelated objects unless appropriate.

---

# Business Logic

Business logic should never live inside UI components.

Bad:

```text
Booking Page

↓

Calculate pricing

↓

Render
```

Good:

```text
Booking Page

↓

bookingService

↓

Pricing Engine

↓

Render
```

---

# Services

Every external API should have its own service.

Examples:

```text
google-maps.service.ts
stripe.service.ts
supabase.service.ts
email.service.ts
```

Never mix unrelated services.

---

# Styling

Use Tailwind CSS.

Do not use inline styles.

Do not hardcode colours.

Use the design system.

---

# Comments

Code should be self-explanatory.

Comments should explain:

* Why

Not:

* What

Good:

```ts
// Cache common routes to reduce Google Maps API requests.
```

Avoid comments that simply restate the code.

---

# Error Handling

Every external request should:

* Validate input
* Handle failure gracefully
* Return useful messages
* Avoid exposing implementation details

---

# Logging

Development:

Verbose logging is acceptable.

Production:

Log only what is necessary.

Never log:

* passwords
* payment details
* API keys
* personal information

---

# Security

Never commit:

* .env.local
* API keys
* Service Role Keys
* Stripe Secret Keys

Always validate user input.

Always use HTTPS in production.

---

# Git Workflow

Branch naming:

```text
feature/google-maps
feature/customer-dashboard

fix/booking-validation

docs/design-system
```

Commit messages:

```text
feat: add Google Maps autocomplete

fix: resolve booking validation issue

docs: update architecture documentation

refactor: simplify booking service

style: improve homepage spacing

test: add booking unit tests
```

Keep commits focused on a single logical change.

---

# Imports

Prefer absolute imports using the project alias when configured.

Group imports:

1. External libraries
2. Internal modules
3. Styles

Remove unused imports.

---

# Dependencies

Before adding a package, ask:

* Does it solve a real problem?
* Can we use an existing library?
* Is it actively maintained?
* Will it increase maintenance?

Avoid dependency bloat.

---

# Performance

Optimise for:

* Small bundles
* Lazy loading
* Image optimisation
* Memoisation only when beneficial

Avoid premature optimisation.

---

# Accessibility

Every component should:

* Support keyboard navigation
* Have meaningful labels
* Provide sufficient colour contrast
* Include appropriate ARIA attributes where necessary

Accessibility is a core requirement.

---

# Documentation

Every major feature should include documentation updates.

When code changes significantly:

* Update relevant documentation.
* Update CHANGELOG.md if appropriate.

Documentation and code should evolve together.

---

# AI Development Guidelines

AI-generated code should:

* Follow the architecture.
* Reuse existing components.
* Preserve naming conventions.
* Avoid duplicate implementations.
* Maintain strict typing.
* Keep documentation in sync.

AI assistants should improve consistency, not introduce new patterns.

---

# Definition of Done

A feature is considered complete only when:

* Functionality works as intended.
* Code is readable.
* Types are correct.
* Responsive behaviour is verified.
* Accessibility has been considered.
* Errors are handled gracefully.
* Documentation is updated.
* Changes are committed with a meaningful message.

---

# Summary

Consistency creates quality.

The objective is not simply to write working code.

The objective is to create a codebase that remains understandable, maintainable, and scalable for years to come.
