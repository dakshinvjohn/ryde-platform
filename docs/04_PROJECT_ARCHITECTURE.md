# 04 — Project Architecture

**Version:** 1.0
**Status:** Active Development

---

# Purpose

This document defines the architecture of the RYDE platform.

It explains:

* Overall system architecture
* Folder structure
* Layer responsibilities
* Component architecture
* Data flow
* State management
* API organisation
* Naming conventions
* Development principles

Every feature added to RYDE should follow the architecture defined here.

---

# Architecture Philosophy

RYDE follows a layered architecture.

Each layer has a single responsibility.

The objective is to create software that is:

* Easy to understand
* Easy to extend
* Easy to test
* Easy to maintain
* Easy to scale

Business logic should never be tightly coupled to presentation.

---

# High-Level Architecture

```text
                    Customer
                        │
                        ▼
             Next.js Frontend (UI)
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Google Maps      Stripe        Resend
                        │
                        ▼
                  Supabase Backend
                        │
                        ▼
                 PostgreSQL Database
```

---

# Application Layers

The platform consists of six logical layers.

## 1. Presentation Layer

Responsible for:

* User Interface
* User Experience
* Layout
* Pages
* Components

Contains no business logic.

---

## 2. Business Logic Layer

Responsible for:

* Booking calculations
* Validation
* Pricing logic
* Customer rules
* Driver rules

Business rules should never be embedded directly into UI components.

---

## 3. Service Layer

Responsible for communication with external services.

Examples:

* Google Maps
* Stripe
* Supabase
* Resend

Each integration should live in its own service module.

---

## 4. Data Layer

Responsible for:

* Database queries
* Authentication
* Storage
* Data retrieval

Only this layer should communicate directly with Supabase.

---

## 5. Infrastructure Layer

Responsible for:

* Deployment
* Environment variables
* Hosting
* CI/CD
* Build configuration

---

## 6. Documentation Layer

Documentation is treated as part of the architecture.

Every major feature should have corresponding documentation.

---

# Folder Structure

```text
ryde-platform/

├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── styles/
├── types/
├── emails/
├── public/
├── docs/
├── design/
├── archive/
```

Each folder has one clear purpose.

---

# Folder Responsibilities

## app/

Contains:

* Pages
* Layouts
* Route groups
* API routes

Business logic should remain minimal.

---

## components/

Reusable UI components only.

Examples:

* Button
* Card
* BookingForm
* JourneySummary
* VehicleCard

Components should never duplicate behaviour.

---

## hooks/

Custom React hooks.

Examples:

* useBooking()
* useMap()
* useCustomer()
* useWindowSize()

Hooks should encapsulate reusable logic.

---

## services/

External integrations.

Examples:

```text
googleMaps.service.ts
stripe.service.ts
supabase.service.ts
email.service.ts
```

Only service files communicate directly with external APIs.

---

## lib/

Shared utility functions.

Examples:

* formatting
* helpers
* constants
* calculations

Avoid duplicating utility functions.

---

## styles/

Global styling.

Contains:

* global.css
* variables
* themes

---

## types/

Shared TypeScript types.

Examples:

```text
Booking.ts
Customer.ts
Driver.ts
Vehicle.ts
```

Every shared model should have a dedicated type definition.

---

## emails/

Email templates.

Booking confirmation

Payment confirmation

Password reset

Notifications

---

# Component Architecture

Components should follow the following hierarchy.

```text
Page

↓

Sections

↓

Components

↓

UI Components
```

Example:

```text
Booking Page

↓

Booking Form

↓

Journey Summary

↓

Vehicle Card

↓

Button
```

Smaller components should remain reusable.

---

# Component Principles

Every component should satisfy:

* Single responsibility
* Reusable
* Responsive
* Accessible
* Well documented

Avoid deeply nested component trees.

---

# Data Flow

```text
User

↓

Form

↓

Validation

↓

Business Logic

↓

Service

↓

Supabase

↓

Response

↓

UI Update
```

Data should always move in one direction.

---

# API Layer

Every external integration should be isolated.

Example:

```text
Booking Page

↓

bookingService

↓

Supabase
```

Never call external APIs directly from UI components.

---

# State Management

Current approach:

React state

Context where appropriate

Future:

React Query may be introduced if server state becomes more complex.

Avoid unnecessary global state.

---

# Naming Conventions

Folders

lowercase

Files

kebab-case

React Components

PascalCase

Hooks

camelCase

Example:

```text
BookingCard.tsx

useBooking.ts

googleMaps.service.ts
```

---

# Error Handling

Every external request should:

* Validate input
* Handle failure gracefully
* Display meaningful feedback
* Log unexpected errors

Users should never see raw error messages.

---

# Logging

Development

Detailed logging

Production

Minimal logging

Never log:

* passwords
* API keys
* payment information
* personal data

---

# Performance Principles

Optimise for:

* Fast page loads
* Small bundles
* Lazy loading
* Image optimisation
* Code splitting

Performance is considered a product feature.

---

# Security Principles

Never expose:

* Service Role Keys
* Stripe Secret Keys
* Database passwords

Always:

* Validate input
* Restrict API keys
* Use HTTPS
* Enable Row Level Security

---

# Testing Strategy

Future testing levels:

* Unit Tests
* Component Tests
* Integration Tests
* End-to-End Tests

Testing should grow alongside the application.

---

# Scalability

Every feature should be designed so that it can support:

* More customers
* More drivers
* More bookings
* More integrations

without requiring architectural redesign.

---

# Documentation Rules

Whenever a significant architectural change occurs:

* Update this document.
* Update the relevant feature documentation.
* Record the change in `CHANGELOG.md`.

Documentation should evolve alongside the code.

---

# Summary

The architecture of RYDE is intentionally simple, modular, and scalable.

By separating presentation, business logic, services, and infrastructure, the platform remains easy to maintain and extend.

Every future feature should integrate into the existing architecture rather than introduce a new pattern.

Consistency is more valuable than cleverness.
