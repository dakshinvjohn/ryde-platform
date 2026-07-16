-- RYDE — bookings table
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),

    full_name text not null,
    email text not null,
    phone text not null,

    pickup text not null,
    destination text not null,
    booking_date date not null,
    booking_time time not null,

    passengers int not null default 1,
    luggage int not null default 0,
    vehicle text not null default 'standard',
    notes text default '',

    fare_eur numeric(10, 2) not null default 0,
    payment_method text not null default 'later', -- 'now' | 'later'
    payment_status text not null default 'unpaid', -- 'unpaid' | 'paid'
    stripe_session_id text unique -- only set for 'now' bookings; enforces webhook idempotency
);

-- Row Level Security: the anon key (used in the browser) gets no
-- direct access to this table at all. Only the server-side API
-- routes (using the service role key, which bypasses RLS) can read
-- or write bookings. This is deliberate — booking data includes
-- customer name/email/phone and shouldn't be queryable from the
-- browser with the public anon key.
alter table public.bookings enable row level security;

-- No policies are created, so with RLS enabled the anon/public role
-- has zero access by default. If you later build a driver dashboard
-- that reads bookings directly from the browser, add an auth-gated
-- policy here (e.g. restricted to a logged-in admin user) rather
-- than opening the table to anon.
