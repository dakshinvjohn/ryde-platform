-- RYDE — quotation workflow
-- Run this once in the Supabase SQL editor after the existing bookings table exists.
--
-- Flow:
-- request -> quotation -> customer confirmation -> optional advance payment -> confirmed booking

create table if not exists public.quotations (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    booking_id uuid not null references public.bookings(id) on delete cascade,

    quotation_number text not null unique,
    language text not null default 'en', -- 'en' | 'nl'

    total_eur numeric(10, 2) not null default 0,
    advance_eur numeric(10, 2) not null default 0,
    remaining_eur numeric(10, 2) not null default 0,

    payment_method text not null default 'advance',
    -- 'advance' | 'online_full' | 'cash' | 'bank_transfer'

    status text not null default 'draft',
    -- 'draft' | 'sent' | 'confirmed' | 'paid' | 'declined' | 'expired'

    valid_until timestamptz,

    confirmation_token_hash text unique,
    token_expires_at timestamptz,

    sent_at timestamptz,
    confirmed_at timestamptz,
    paid_at timestamptz,

    stripe_session_id text unique,

    notes text default ''
);

create index if not exists quotations_booking_id_idx
    on public.quotations (booking_id);

create index if not exists quotations_status_idx
    on public.quotations (status);

create index if not exists quotations_token_hash_idx
    on public.quotations (confirmation_token_hash);

alter table public.quotations enable row level security;

-- No public/anon policies. Quotations contain customer and payment data
-- and are accessed only through server-side API routes.

-- Keep updated_at current when a quotation row changes.
create or replace function public.set_quotation_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists quotations_set_updated_at on public.quotations;

create trigger quotations_set_updated_at
before update on public.quotations
for each row
execute function public.set_quotation_updated_at();
