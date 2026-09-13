-- RYDE — persist Google Maps route details on each booking.
-- Run once in Supabase SQL Editor.

alter table public.bookings
    add column if not exists distance_km numeric(10, 2),
    add column if not exists distance_text text,
    add column if not exists duration_minutes integer,
    add column if not exists duration_text text;

create index if not exists bookings_booking_date_idx
    on public.bookings (booking_date);
