-- ==============================================================================
-- STRIPE CONFIGURATION PERSISTENCE TABLE (Admin Stripe Setup)
-- Authoritative persistent store for Crediqly Stripe credentials and Price IDs
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

create table if not exists public.stripe_configuration (
  id text primary key default 'default',
  publishable_key text,
  encrypted_secret_key text,
  encrypted_webhook_secret text,
  pro_price_id text,
  advisory_setup_price_id text,
  advisory_monthly_price_id text,
  mode text default 'test' check (mode in ('test', 'live')),
  configured boolean default false,
  last_verified_at timestamptz,
  last_verification_status text,
  last_error text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.stripe_configuration enable row level security;

-- Policies: Only verified administrators can read and update Stripe configuration
drop policy if exists "Admins can view stripe configuration" on public.stripe_configuration;
create policy "Admins can view stripe configuration"
  on public.stripe_configuration for select
  using (public.is_admin());

drop policy if exists "Admins can insert stripe configuration" on public.stripe_configuration;
create policy "Admins can insert stripe configuration"
  on public.stripe_configuration for insert
  with check (public.is_admin());

drop policy if exists "Admins can update stripe configuration" on public.stripe_configuration;
create policy "Admins can update stripe configuration"
  on public.stripe_configuration for update
  using (public.is_admin());

-- Seed single default configuration record
insert into public.stripe_configuration (id, mode, configured)
values ('default', 'test', false)
on conflict (id) do nothing;
