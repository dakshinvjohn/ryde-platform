-- RYDE — bookings table
-- Run this once in the Supabase SQL editor.

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
    booking_type text not null default 'ride',
    vehicle text not null default 'car',
    notes text default '',

    -- Google Maps route details captured from the existing route request.
    distance_km numeric(10, 2),
    distance_text text,
    duration_minutes integer,
    duration_text text,

    fare_eur numeric(10, 2) not null default 0,
    payment_method text not null default 'later',
    payment_status text not null default 'unpaid',
    stripe_session_id text unique
);

alter table public.bookings enable row level security;

-- Existing installations can run supabase-route-details-migration.sql
-- to add the four route-detail columns without recreating the table.
