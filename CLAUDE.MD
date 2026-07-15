# CLAUDE.md

# RYDE Platform — AI Development Instructions

Welcome to the RYDE project.

This document defines how AI coding assistants (Claude, ChatGPT, GitHub Copilot, etc.) should contribute to this repository.

The objective is not simply to generate code, but to help build a production-quality premium chauffeur platform that is scalable, maintainable, secure, and consistent.

---

# Before Writing Any Code

Always read these documents first, in this exact order:

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

# Project Vision

RYDE is not a simple taxi website.

RYDE is a premium digital chauffeur platform designed for long-term growth.

The platform will eventually include:

* Premium marketing website
* Booking platform
* Google Maps integration
* Customer dashboard
* Driver dashboard
* Admin dashboard
* Secure payments
* Email automation
* Fleet management
* Corporate accounts
* AI-powered assistant
* Future mobile applications

Every implementation should support this long-term vision.

---

# Core Development Principles

Every change should improve at least one of the following:

* Simplicity
* Maintainability
* Scalability
* Performance
* Accessibility
* Security
* User experience

Avoid solutions that solve today's problem but create tomorrow's technical debt.

---

# Design Principles

Every interface must follow the Design System.

Maintain:

* Premium appearance
* Clean layouts
* Generous whitespace
* Mobile-first design
* Consistent typography
* Consistent spacing
* Consistent components

Do not invent new design patterns unless they genuinely improve the product.

---

# Engineering Rules

Always:

* Use TypeScript.
* Build reusable components.
* Separate business logic from UI.
* Reuse existing components before creating new ones.
* Keep components focused on a single responsibility.
* Follow the documented folder structure.
* Keep functions small and readable.

Never:

* Hardcode secrets.
* Duplicate logic.
* Introduce unnecessary dependencies.
* Rewrite working code without a clear reason.

---

# Project Architecture

Follow the architecture defined in:

docs/04_PROJECT_ARCHITECTURE.md

Do not introduce new architectural patterns without strong justification.

---

# Technology Stack

Official stack:

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* Supabase
* Stripe
* Resend
* Google Maps Platform
* Vercel

Do not replace technologies unless explicitly requested.

---

# Environment Variables

Never hardcode credentials.

Always use environment variables.

Expected variables include:

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY
* NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET
* RESEND_API_KEY
* NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
* NEXT_PUBLIC_APP_URL

Never expose secrets in generated code.

Never commit `.env.local`.

---

# Implementation Order

Implement features in this order unless instructed otherwise.

## Phase 1

* Convert static HTML to Next.js
* Configure TypeScript
* Configure Tailwind
* Configure shadcn/ui
* Preserve existing design

---

## Phase 2

* Shared layout
* Navigation
* Footer
* Reusable UI components

---

## Phase 3

* Booking system
* Booking validation
* Journey summary

---

## Phase 4

* Google Maps
* Address autocomplete
* Route display
* Distance calculation

---

## Phase 5

* Supabase
* Authentication
* Database schema

---

## Phase 6

* Stripe payments

---

## Phase 7

* Customer dashboard

---

## Phase 8

* Driver dashboard

---

## Phase 9

* Admin dashboard

---

## Phase 10

* Email automation

---

## Phase 11

* AI assistant

---

# Code Quality

Generated code should:

* Compile successfully
* Be fully typed
* Be responsive
* Be accessible
* Avoid duplication
* Be easy to understand
* Match existing project patterns

Prioritize readability over cleverness.

---

# Git Workflow

One logical feature per commit.

Use descriptive commit messages.

Examples:

* feat: add booking form validation
* feat: integrate Google Maps
* fix: resolve payment redirect issue
* docs: update booking documentation
* refactor: simplify booking service

Avoid mixing unrelated changes in a single commit.

---

# Documentation

Whenever a feature is completed:

1. Update the relevant documentation in the `docs/` folder.
2. Update `CHANGELOG.md` if appropriate.
3. Keep documentation synchronized with the implementation.

Documentation is considered part of the feature.

---

# Testing

Before considering work complete:

* Verify the application builds successfully.
* Verify TypeScript has no errors.
* Verify responsive behaviour.
* Verify accessibility basics.
* Verify no secrets are exposed.
* Verify no existing functionality is broken.

---

# Security

Always:

* Validate user input.
* Use HTTPS in production.
* Keep secrets in environment variables.
* Enable Supabase Row Level Security.
* Restrict Google Maps API keys.
* Use Stripe test mode until production.

Never expose:

* API keys
* Database credentials
* Service Role Keys
* Payment secrets

---

# AI Behaviour

When working on this repository:

* Think before making architectural changes.
* Prefer incremental improvements over large rewrites.
* Explain major technical decisions.
* Preserve existing patterns.
* Ask for clarification if requirements conflict.
* Avoid unnecessary complexity.

Do not modify large parts of the application without a clear reason.

---

# Definition of Done

A task is complete only if:

* Functionality works.
* Code follows project standards.
* TypeScript passes.
* Responsive behaviour is verified.
* Accessibility has been considered.
* Documentation is updated.
* Code is committed using a meaningful message.

---

# Final Instruction

Build RYDE as though it will become the benchmark premium chauffeur platform in Europe.

Every decision should contribute to a product that is elegant, reliable, scalable, secure, and enjoyable to use.

When in doubt, choose the solution that is simpler, more maintainable, and more consistent with the existing architecture.
