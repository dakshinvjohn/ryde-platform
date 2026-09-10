# 06 — Design System

**Version:** 1.0
**Status:** Active Development

---

# Purpose

This document defines the visual language of the RYDE platform.

Every interface should follow these standards to create a consistent, premium, and recognisable experience.

The design system applies to:

* Marketing website
* Booking platform
* Customer dashboard
* Driver dashboard
* Admin dashboard
* Emails
* Future mobile applications

Every new UI component should conform to this design system.

---

# Design Philosophy

RYDE should feel:

* Premium
* Elegant
* Modern
* Minimal
* Professional
* Trustworthy
* Calm

Luxury is created through restraint, consistency, and attention to detail—not visual clutter.

---

# Design Inspiration

The design language is inspired by products known for clarity, quality, and premium user experience.

Primary inspirations:

* Apple
* Stripe
* Linear
* Porsche
* Uber Black
* Airbnb
* Notion (simplicity)
* Vercel (developer experience)

The goal is inspiration—not imitation.

---

# Brand Personality

RYDE should communicate:

* Reliability
* Precision
* Professionalism
* Luxury
* Simplicity
* Confidence

Avoid flashy or overly decorative design.

---

# Colour Palette

## Primary

```text
Primary Black

#111111
```

Used for:

* Headings
* Navigation
* Buttons
* Icons

---

## Luxury Gold

```text
#C8A45D
```

Used sparingly for:

* Primary actions
* Premium highlights
* Icons
* Active states

Gold should remain an accent colour.

---

## Background

```text
#FAFAFA
```

Default page background.

---

## Surface

```text
#FFFFFF
```

Cards, modals, forms, panels.

---

## Secondary Text

```text
#6B7280
```

Supporting information.

---

## Success

```text
#16A34A
```

---

## Warning

```text
#D97706
```

---

## Error

```text
#DC2626
```

---

## Border

```text
#E5E7EB
```

---

# Colour Rules

* One primary accent (Gold).
* Large areas should remain neutral.
* Avoid multiple accent colours.
* Maintain accessible colour contrast.

---

# Typography

## Headings

Font:

**Fraunces**

Purpose:

Luxury serif used only for headings.

---

## Body

Font:

**Inter**

Used for:

* Body text
* Forms
* Navigation
* Buttons
* Tables
* Dashboards

---

# Typography Scale

| Element    | Size |   Weight |
| ---------- | ---: | -------: |
| Hero       | 64px |     Bold |
| H1         | 48px |     Bold |
| H2         | 36px | SemiBold |
| H3         | 30px | SemiBold |
| H4         | 24px |   Medium |
| Body Large | 18px |  Regular |
| Body       | 16px |  Regular |
| Small      | 14px |  Regular |
| Caption    | 12px |   Medium |

Maintain a consistent hierarchy throughout the platform.

---

# Spacing System

Use an 8-point spacing system.

Standard spacing values:

```text
4
8
12
16
24
32
40
48
64
80
96
```

Avoid arbitrary spacing values.

---

# Border Radius

| Component | Radius |
| --------- | ------ |
| Buttons   | 16px   |
| Inputs    | 18px   |
| Cards     | 20px   |
| Images    | 24px   |
| Modals    | 24px   |

Rounded corners should feel modern without appearing playful.

---

# Shadows

Use soft shadows only.

Avoid harsh shadows.

Cards should appear elevated but subtle.

---

# Icons

Primary icon library:

Lucide React

Guidelines:

* Simple
* Consistent stroke width
* Minimal
* Easy to recognise

---

# Buttons

## Primary

Black background

White text

Gold hover accent

Large radius

---

## Secondary

White background

Black border

Black text

---

## Ghost

Transparent

Minimal emphasis

---

## Destructive

Reserved for dangerous actions only.

---

# Forms

Forms should:

* Be simple
* Clearly labelled
* Have generous spacing
* Display inline validation
* Use helpful error messages

Never rely on placeholders as labels.

---

# Inputs

Every input should include:

* Label
* Placeholder
* Validation state
* Error state
* Disabled state

Inputs should be comfortable to use on mobile.

---

# Cards

Cards should:

* Use white backgrounds
* Soft shadows
* Large border radius
* Consistent internal spacing

Avoid overly complex card layouts.

---

# Tables

Tables should:

* Be easy to scan
* Have clear row spacing
* Support responsive layouts
* Avoid excessive borders

---

# Navigation

Navigation should remain:

* Simple
* Predictable
* Minimal

Customers should never feel lost.

---

# Dashboard Design

Dashboards should prioritise:

* Readability
* Quick actions
* Clear hierarchy
* Meaningful metrics

Avoid visual clutter.

---

# Booking Experience

The booking journey should feel effortless.

Ideal flow:

```text
Pickup

↓

Destination

↓

Vehicle

↓

Journey Summary

↓

Payment

↓

Confirmation
```

Every step should communicate progress clearly.

---

# Google Maps

Maps should:

* Blend naturally with the interface
* Use rounded corners
* Support responsive layouts
* Display clean route information

Maps should complement the booking experience rather than dominate it.

---

# Motion

Animations should support the interface.

They should never distract.

Recommended duration:

250–350ms

Recommended easing:

Ease In Out

---

# Loading States

Never leave users waiting without feedback.

Use:

* Skeleton loaders
* Progress indicators
* Subtle animations

Avoid unnecessary spinners.

---

# Empty States

Every empty screen should:

* Explain why it is empty
* Suggest the next action
* Feel welcoming

---

# Error States

Error messages should:

* Be human
* Be actionable
* Avoid technical language

Example:

Instead of:

"Error 500"

Use:

"We couldn't complete your booking right now. Please try again."

---

# Responsive Design

Primary breakpoints:

| Device        | Width      |
| ------------- | ---------- |
| Mobile        | <640px     |
| Tablet        | 640–1024px |
| Desktop       | >1024px    |
| Large Desktop | >1440px    |

Design mobile-first.

---

# Accessibility

Every interface should support:

* Keyboard navigation
* Screen readers
* Colour contrast
* Visible focus states

Accessibility is a quality requirement.

---

# Microinteractions

Use subtle interactions for:

* Hover states
* Button presses
* Form completion
* Successful actions
* Booking progress

Small details create a premium experience.

---

# Illustrations

Photography and illustrations should communicate:

* Luxury
* Trust
* Professionalism
* Comfort

Avoid generic stock imagery where possible.

---

# Dark Mode

Dark mode is planned.

Design decisions should avoid making a future dark theme difficult to implement.

---

# Definition of Premium

Premium is not decoration.

Premium is:

* Consistency
* Simplicity
* Quality
* Precision
* Performance
* Reliability

Every screen should feel intentionally designed.

---

# Living Design System

This document will evolve alongside the product.

Whenever a new UI pattern is introduced:

* Document it.
* Reuse it.
* Avoid creating duplicate design patterns.

The design system should grow without losing consistency.

---

# Final Principle

Every new screen should look as though it belongs to the same product family.

If a user can immediately recognise that a page belongs to RYDE without seeing the logo, the design system is working successfully.
