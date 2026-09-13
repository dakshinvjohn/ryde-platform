-- RYDE — quotation price breakdown storage
-- Run this after supabase-quotation-migration.sql.

alter table public.quotations
add column if not exists price_breakdown jsonb not null default '[]'::jsonb;
