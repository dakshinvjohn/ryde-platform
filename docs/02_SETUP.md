# 02 — Development Setup Guide

**Version:** 1.0
**Status:** Active Development

---

# Purpose

This document provides a complete guide for setting up the RYDE development environment.

Following this guide should allow any developer to configure the project from scratch without requiring additional instructions.

---

# System Requirements

## Operating System

Recommended:

* macOS
* Windows 11 (WSL recommended)
* Ubuntu Linux

---

## Required Software

| Software             | Purpose               |
| -------------------- | --------------------- |
| Git                  | Version Control       |
| GitHub               | Repository Hosting    |
| Node.js (Latest LTS) | Runtime               |
| npm                  | Package Manager       |
| Visual Studio Code   | IDE                   |
| Google Chrome        | Development & Testing |

---

# Accounts Required

The following accounts are required before development begins.

| Service      | Status   | Purpose                   |
| ------------ | -------- | ------------------------- |
| GitHub       | Required | Source Control            |
| Vercel       | Required | Deployment                |
| Supabase     | Required | Database & Authentication |
| Stripe       | Required | Payments                  |
| Resend       | Required | Email Service             |
| Google Cloud | Required | Google Maps Platform      |

---

# Repository

Repository URL:

```text
https://github.com/dakshinvjohn/ryde-platform.git
```

Clone:

```bash
git clone git@github.com:dakshinvjohn/ryde-platform.git
```

Enter project:

```bash
cd ryde-platform
```

---

# Node.js

Check installation:

```bash
node -v
```

Check npm:

```bash
npm -v
```

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Development URL:

```text
http://localhost:3000
```

---

# Git Configuration

Verify Git:

```bash
git --version
```

Check remote:

```bash
git remote -v
```

Recommended branch strategy:

* main → Production-ready code
* feature/* → New features
* fix/* → Bug fixes

Example:

```bash
git checkout -b feature/google-maps
```

Commit example:

```bash
git commit -m "feat: integrate Google Maps booking route"
```

---

# Environment Variables

Create a local file:

```text
.env.local
```

Do **not** commit this file.

Create:

```text
.env.example
```

This file contains placeholders only.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

# Where to Find Keys

## Supabase

Project Settings → API

Required:

* Project URL
* Anon Key
* Service Role Key

---

## Stripe

Developers → API Keys

Required:

* Publishable Key
* Secret Key

Later:

* Webhook Secret

---

## Resend

API Keys

Generate one API key.

---

## Google Cloud

APIs & Services → Credentials

Enable:

* Maps JavaScript API
* Places API
* Geocoding API
* Directions API (or Routes API)

Create:

* Google Maps API Key

Restrict API keys before production deployment.

---

# Vercel

Connect the GitHub repository.

Production branch:

```text
main
```

Add all environment variables from `.env.local` to the Vercel project settings before deployment.

---

# Project Structure

```text
docs/
design/
archive/

app/
components/
hooks/
lib/
services/
styles/
types/
emails/
public/
```

---

# Recommended VS Code Extensions

* ESLint
* Prettier
* Tailwind CSS IntelliSense
* GitLens
* Error Lens
* Path IntelliSense
* Material Icon Theme

---

# Development Workflow

1. Pull latest changes.
2. Create a feature branch.
3. Build the feature.
4. Test locally.
5. Commit using descriptive messages.
6. Push the feature branch.
7. Open a Pull Request (if collaborating).
8. Merge into `main` after review.

---

# Security Guidelines

* Never commit `.env.local`
* Never expose secret API keys
* Use test credentials during development
* Restrict Google Maps API keys
* Rotate compromised credentials immediately

---

# Troubleshooting

## npm not found

Verify:

```bash
node -v
npm -v
```

If missing:

Install Node.js.

---

## GitHub Authentication Failed

Preferred authentication:

SSH

Verify:

```bash
ssh -T git@github.com
```

---

## Google Maps Not Loading

Check:

* API enabled
* API key valid
* Billing account configured
* API restrictions

---

## Stripe Not Working

Verify:

* Test mode enabled
* Correct publishable key
* Correct secret key

---

## Supabase Connection Failed

Verify:

* Project URL
* Anon key
* Database status

---

# Development Principles

Every developer working on RYDE should follow these principles:

* Build reusable components.
* Keep business logic separate from presentation.
* Document architectural decisions.
* Write clean, readable code.
* Prefer composition over duplication.
* Security by default.
* Performance is a feature.

---

# Setup Checklist

* [ ] Git installed
* [ ] GitHub connected via SSH
* [ ] Node.js installed
* [ ] npm installed
* [ ] Repository cloned
* [ ] Dependencies installed
* [ ] `.env.local` created
* [ ] Supabase configured
* [ ] Stripe configured
* [ ] Resend configured
* [ ] Google Maps configured
* [ ] Vercel connected
* [ ] Development server running

---

# Future Improvements

This document should be updated whenever:

* New services are introduced.
* New environment variables are added.
* Deployment changes.
* Development tooling changes.
* Project architecture changes.

Keeping this guide current ensures that every new developer—or future version of yourself—can get the project running quickly and consistently.
