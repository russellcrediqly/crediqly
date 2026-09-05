-- Crediqly Supabase Production Schema & RLS Policies with Admin RBAC
-- Project: dfdvmegzwgogonefjihs
-- Execute in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run

-- ==============================================================================
-- 1. PROFILES TABLE
-- Stores authenticated user profile data linked directly to auth.users(id)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  first_name text,
  last_name text,
  email text,
  role text default 'user' not null check (role in ('admin', 'staff', 'user')),
  status text default 'active' not null check (status in ('active', 'disabled', 'suspended')),
  last_seen_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ensure columns exist for existing tables
alter table public.profiles add column if not exists role text default 'user' not null;
alter table public.profiles add column if not exists status text default 'active' not null;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- SECURITY DEFINER FUNCTION TO CHECK ADMIN ROLE
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Profiles RLS Policies
-- Users can manage their own profile; Admins can view and manage all profiles
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin() or (
      auth.uid() = user_id and
      role = (select role from public.profiles where user_id = auth.uid())
    )
  );

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);


-- ==============================================================================
-- 2. BUSINESSES TABLE
-- Stores company details, foundational checklist answers, and onboarding info
-- ==============================================================================
create table if not exists public.businesses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  
  -- Step 1: Business Information
  business_name text not null,
  entity_type text,
  state text,
  industry text,
  business_age text,
  
  -- Step 2: Business Foundation (yes / no / not_sure / not_applicable)
  has_ein text default 'not_sure',
  has_business_bank_account text default 'not_sure',
  has_website text default 'not_sure',
  has_business_phone text default 'not_sure',
  has_business_email text default 'not_sure',
  has_business_address text default 'not_sure',
  has_business_license text default 'not_sure',
  has_duns text default 'not_sure',
  
  -- Step 3: Business Credit
  has_business_credit_profile text default 'not_sure',
  knows_business_credit_score text default 'not_sure',
  business_credit_score numeric,
  business_credit_account_count text default 'not_sure',
  has_reporting_accounts text default 'not_sure',
  has_business_credit_card text default 'not_sure',
  has_funding_history text default 'not_sure',
  
  -- Step 4: Funding Goals
  annual_revenue_range text,
  personal_credit_range text,
  funding_amount text,
  funding_purpose text[],
  
  -- Status & Timestamps
  profile_completed boolean default false not null,
  profile_completed_at timestamptz,
  
  -- Readiness Scores (for fast denormalized reads)
  business_readiness_score numeric,
  credit_readiness_score numeric,
  readiness_updated_at timestamptz,
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.businesses enable row level security;

-- Businesses RLS Policies (Users can access their own; Admins can access all)
drop policy if exists "Users can view their own businesses" on public.businesses;
create policy "Users can view their own businesses"
  on public.businesses for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own businesses" on public.businesses;
create policy "Users can insert their own businesses"
  on public.businesses for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own businesses" on public.businesses;
create policy "Users can update their own businesses"
  on public.businesses for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own businesses" on public.businesses;
create policy "Users can delete their own businesses"
  on public.businesses for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_businesses_user_id on public.businesses(user_id);


-- ==============================================================================
-- 3. READINESS_SCORES TABLE
-- Dedicated audit & tracking table for historical and current readiness metrics
-- ==============================================================================
create table if not exists public.readiness_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null unique,
  business_readiness_score integer not null,
  credit_readiness_score integer not null,
  business_readiness_level text not null,
  credit_readiness_level text not null,
  calculated_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.readiness_scores enable row level security;

-- Readiness Scores RLS Policies (Users view their own; Admins view all)
drop policy if exists "Users can view their own readiness scores" on public.readiness_scores;
create policy "Users can view their own readiness scores"
  on public.readiness_scores for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own readiness scores" on public.readiness_scores;
create policy "Users can insert their own readiness scores"
  on public.readiness_scores for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own readiness scores" on public.readiness_scores;
create policy "Users can update their own readiness scores"
  on public.readiness_scores for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own readiness scores" on public.readiness_scores;
create policy "Users can delete their own readiness scores"
  on public.readiness_scores for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_readiness_scores_user_id on public.readiness_scores(user_id);
create index if not exists idx_readiness_scores_business_id on public.readiness_scores(business_id);


-- ==============================================================================
-- 4. SUBSCRIPTIONS TABLE
-- Future-ready architecture for SaaS plans (free / member / premium / consultation)
-- ==============================================================================
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan_id text default 'free' not null,
  status text default 'active' not null,
  provider text default 'none' not null,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.subscriptions enable row level security;

-- Subscriptions RLS Policies (Users view their own; Admins view/manage all)
drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own subscription" on public.subscriptions;
create policy "Users can insert their own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own subscription" on public.subscriptions;
create policy "Users can update their own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);


-- ==============================================================================
-- 5. AUTOMATIC NEW USER SETUP TRIGGER
-- Automatically initializes a profiles record and default free subscription
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_name text;
  f_name text;
  l_name text;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '');
  
  if raw_name <> '' then
    f_name := split_part(raw_name, ' ', 1);
    l_name := nullif(substr(raw_name, length(f_name) + 2), '');
  else
    f_name := coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
    l_name := coalesce(new.raw_user_meta_data->>'last_name', '');
  end if;

  -- 1. Create Profile with default 'user' role and 'active' status
  insert into public.profiles (user_id, first_name, last_name, email, role, status)
  values (new.id, f_name, l_name, new.email, 'user', 'active')
  on conflict (user_id) do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      updated_at = now();

  -- 2. Create Default Free Subscription
  insert into public.subscriptions (user_id, plan_id, status, provider)
  values (new.id, 'free', 'active', 'internal')
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 6. USER ROADMAP TASKS TABLE (Step 5)
-- Stores user completion status for personalized business credit roadmap tasks
-- ==============================================================================
create table if not exists public.user_roadmap_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_key text not null,
  completed boolean default true not null,
  completed_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, task_key)
);

-- Enable RLS
alter table public.user_roadmap_tasks enable row level security;

-- Policies: Users manage their own tasks; Admins can inspect all tasks
drop policy if exists "Users can view their own roadmap tasks" on public.user_roadmap_tasks;
create policy "Users can view their own roadmap tasks"
  on public.user_roadmap_tasks for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own roadmap tasks" on public.user_roadmap_tasks;
create policy "Users can insert their own roadmap tasks"
  on public.user_roadmap_tasks for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own roadmap tasks" on public.user_roadmap_tasks;
create policy "Users can update their own roadmap tasks"
  on public.user_roadmap_tasks for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own roadmap tasks" on public.user_roadmap_tasks;
create policy "Users can delete their own roadmap tasks"
  on public.user_roadmap_tasks for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_user_roadmap_tasks_user_id on public.user_roadmap_tasks(user_id);
create index if not exists idx_user_roadmap_tasks_task_key on public.user_roadmap_tasks(task_key);

-- ==============================================================================
-- 7. ACTIVITY LOG TABLE (Step 6)
-- Stores chronological meaningful user actions: task completions, reopenings,
-- profile updates, readiness changes, and milestones.
-- ==============================================================================
create table if not exists public.activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'task_completed',
    'task_reopened',
    'profile_updated',
    'readiness_updated',
    'milestone_completed'
  )),
  title text not null,
  description text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.activity_log enable row level security;

-- Policies: Users manage only their own activity log; Admins can view all
drop policy if exists "Users can view their own activity log" on public.activity_log;
create policy "Users can view their own activity log"
  on public.activity_log for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own activity log" on public.activity_log;
create policy "Users can insert their own activity log"
  on public.activity_log for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own activity log" on public.activity_log;
create policy "Users can update their own activity log"
  on public.activity_log for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own activity log" on public.activity_log;
create policy "Users can delete their own activity log"
  on public.activity_log for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_activity_log_user_created on public.activity_log(user_id, created_at desc);
create index if not exists idx_activity_log_type on public.activity_log(activity_type);

-- ==============================================================================
-- 8. PROGRESS HISTORY TABLE (Step 6)
-- Stores periodic historical snapshots of user progress metrics for progression tracking.
-- ==============================================================================
create table if not exists public.progress_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade,
  business_readiness_score integer not null,
  credit_readiness_score integer not null,
  roadmap_progress integer not null,
  recorded_at timestamptz default now() not null
);

-- Enable RLS
alter table public.progress_history enable row level security;

-- Policies: Users view and record their own progress history; Admins can view all
drop policy if exists "Users can view their own progress history" on public.progress_history;
create policy "Users can view their own progress history"
  on public.progress_history for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own progress history" on public.progress_history;
create policy "Users can insert their own progress history"
  on public.progress_history for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own progress history" on public.progress_history;
create policy "Users can delete their own progress history"
  on public.progress_history for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_progress_history_user_recorded on public.progress_history(user_id, recorded_at desc);

-- ==============================================================================
-- 9. PRODUCTS TABLE (Step 7)
-- Stores business credit products, vendor trade lines, cards, banking, and services
-- ==============================================================================
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'business_credit_builders',
    'net_30',
    'net_60',
    'business_credit_cards',
    'business_banking',
    'business_services'
  )),
  description text not null,
  short_description text not null,
  logo_url text,
  website_url text not null,
  affiliate_url text,
  affiliate_enabled boolean default false not null,
  reporting_bureaus text[],
  product_type text,
  minimum_purchase text,
  subscription_required boolean default false,
  typical_business_age text,
  ein_required boolean default true,
  business_bank_account_required boolean default false,
  business_website_required boolean default false,
  personal_guarantee_required text default 'check_provider',
  personal_credit_requirement text,
  recommended_stage text default 'building',
  priority integer default 2 not null check (priority in (1, 2, 3)),
  status text default 'active' not null check (status in ('active', 'inactive', 'pending')),
  featured boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.products enable row level security;

-- Policies: Anyone/authenticated can view active products; Admins manage all
drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  using (status = 'active' or public.is_admin());

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  using (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_slug on public.products(slug);

-- ==============================================================================
-- 10. AFFILIATE CLICKS TABLE (Step 7)
-- Lightweight privacy-safe tracking for external outbound provider visits
-- ==============================================================================
create table if not exists public.affiliate_clicks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.affiliate_clicks enable row level security;

-- Policies: Users can record their own clicks and view only their own clicks; Admins view all
drop policy if exists "Users can view their own clicks" on public.affiliate_clicks;
create policy "Users can view their own clicks"
  on public.affiliate_clicks for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own clicks" on public.affiliate_clicks;
create policy "Users can insert their own clicks"
  on public.affiliate_clicks for insert
  with check (auth.uid() = user_id or public.is_admin());

create index if not exists idx_affiliate_clicks_user_created on public.affiliate_clicks(user_id, created_at desc);

-- ==============================================================================
-- 11. CONTENT MANAGEMENT TABLE (Step 7.5)
-- Customer educational guides and resources
-- ==============================================================================
create table if not exists public.content_pages (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  short_description text not null,
  content text not null,
  category text not null check (category in (
    'business_credit',
    'business_funding',
    'credit_education',
    'business_readiness',
    'getting_started',
    'general'
  )),
  status text default 'published' not null check (status in ('draft', 'published', 'archived')),
  featured boolean default false not null,
  reading_time text default '5 min read',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.content_pages enable row level security;

-- Content Policies: Anyone can view published; Admins can manage all
drop policy if exists "Anyone can view published content" on public.content_pages;
create policy "Anyone can view published content"
  on public.content_pages for select
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins can insert content" on public.content_pages;
create policy "Admins can insert content"
  on public.content_pages for insert
  with check (public.is_admin());

drop policy if exists "Admins can update content" on public.content_pages;
create policy "Admins can update content"
  on public.content_pages for update
  using (public.is_admin());

drop policy if exists "Admins can delete content" on public.content_pages;
create policy "Admins can delete content"
  on public.content_pages for delete
  using (public.is_admin());

create index if not exists idx_content_pages_category on public.content_pages(category);
create index if not exists idx_content_pages_status on public.content_pages(status);
create index if not exists idx_content_pages_slug on public.content_pages(slug);

-- ==============================================================================
-- 12. FUNDING READINESS TABLE (Step 8)
-- Stores deterministic funding readiness assessments, category scores, and audit snapshots
-- ==============================================================================
create table if not exists public.funding_readiness (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  readiness_level text not null,
  foundation_score integer not null,
  business_credit_score integer not null,
  financial_readiness_score integer not null,
  profile_score integer not null,
  calculated_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.funding_readiness enable row level security;

-- Funding Readiness RLS Policies
drop policy if exists "Users can view their own funding readiness" on public.funding_readiness;
create policy "Users can view their own funding readiness"
  on public.funding_readiness for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own funding readiness" on public.funding_readiness;
create policy "Users can insert their own funding readiness"
  on public.funding_readiness for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own funding readiness" on public.funding_readiness;
create policy "Users can update their own funding readiness"
  on public.funding_readiness for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own funding readiness" on public.funding_readiness;
create policy "Users can delete their own funding readiness"
  on public.funding_readiness for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_funding_readiness_user_id on public.funding_readiness(user_id);
create index if not exists idx_funding_readiness_business_id on public.funding_readiness(business_id);
create index if not exists idx_funding_readiness_calc_at on public.funding_readiness(user_id, calculated_at desc);

-- Add funding_readiness_score to businesses and progress_history
alter table public.businesses
  add column if not exists funding_readiness_score numeric;

alter table public.progress_history
  add column if not exists funding_readiness_score integer;

-- ==============================================================================
-- 13. COMMERCIAL BANKS TABLE (Step 8 Admin Consolidation)
-- Complete control over commercial business bank accounts and partner referral links
-- ==============================================================================
create table if not exists public.banks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text not null,
  short_description text,
  logo_url text,
  website_url text not null,
  affiliate_url text,
  affiliate_enabled boolean default false not null,
  featured boolean default false not null,
  status text default 'active' not null check (status in ('active', 'inactive')),
  priority integer default 2 not null check (priority in (1, 2, 3)),
  display_order integer default 0,
  recommended_stage text default 'foundation',
  min_deposit text default 'No minimum deposit',
  monthly_fee text default '$0',
  features text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.banks enable row level security;

-- Banks RLS Policies (Anyone can view active banks; Admins can manage all)
drop policy if exists "Anyone can view active banks" on public.banks;
create policy "Anyone can view active banks"
  on public.banks for select
  using (status = 'active' or public.is_admin());

drop policy if exists "Admins can insert banks" on public.banks;
create policy "Admins can insert banks"
  on public.banks for insert
  with check (public.is_admin());

drop policy if exists "Admins can update banks" on public.banks;
create policy "Admins can update banks"
  on public.banks for update
  using (public.is_admin());

drop policy if exists "Admins can delete banks" on public.banks;
create policy "Admins can delete banks"
  on public.banks for delete
  using (public.is_admin());

create index if not exists idx_banks_status on public.banks(status);
create index if not exists idx_banks_priority on public.banks(priority);
create index if not exists idx_banks_slug on public.banks(slug);

-- ==============================================================================
-- 15. FUNDING PRODUCTS TABLE (Step 10 Funding Recommendations)
-- Admin-controlled commercial funding options, requirements, and affiliate links
-- ==============================================================================
create table if not exists public.funding_products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  provider text not null,
  category text not null,
  description text not null,
  website_url text not null,
  affiliate_url text,
  affiliate_enabled boolean default false not null,
  status text default 'active' not null check (status in ('active', 'inactive')),
  featured boolean default false not null,
  priority integer default 2 not null check (priority in (1, 2, 3)),
  min_business_age_months integer default 0 not null,
  min_annual_revenue text default '$0' not null,
  min_personal_credit text default 'None' not null,
  business_credit_required text default 'not_specified' not null check (business_credit_required in ('yes', 'no', 'not_specified')),
  min_funding_amount numeric default 0,
  max_funding_amount numeric default 0,
  funding_purposes text[] default '{}' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.funding_products enable row level security;

-- Funding Products RLS Policies (Anyone can view active options; Admins can manage all)
drop policy if exists "Anyone can view active funding products" on public.funding_products;
create policy "Anyone can view active funding products"
  on public.funding_products for select
  using (status = 'active' or public.is_admin());

drop policy if exists "Admins can insert funding products" on public.funding_products;
create policy "Admins can insert funding products"
  on public.funding_products for insert
  with check (public.is_admin());

drop policy if exists "Admins can update funding products" on public.funding_products;
create policy "Admins can update funding products"
  on public.funding_products for update
  using (public.is_admin());

drop policy if exists "Admins can delete funding products" on public.funding_products;
create policy "Admins can delete funding products"
  on public.funding_products for delete
  using (public.is_admin());

create index if not exists idx_funding_products_status on public.funding_products(status);
create index if not exists idx_funding_products_priority on public.funding_products(priority);
create index if not exists idx_funding_products_category on public.funding_products(category);

-- ==============================================================================
-- 16. FUNDING APPLICATIONS TABLE (Step 11 Funding Application Tracker)
-- User-driven commercial funding opportunity tracking & status lifecycle
-- ==============================================================================
create table if not exists public.funding_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  funding_product_id text not null,
  provider_name text not null,
  product_name text not null,
  category text,
  requested_amount numeric default 0,
  status text default 'Interested' not null check (status in (
    'Interested',
    'Planning to Apply',
    'Applied',
    'Documents Requested',
    'Submitted',
    'Approved',
    'Declined',
    'Funded'
  )),
  application_date date,
  notes text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.funding_applications enable row level security;

-- Funding Applications RLS Policies (User isolation + Admin visibility)
drop policy if exists "Users can view their own funding applications" on public.funding_applications;
create policy "Users can view their own funding applications"
  on public.funding_applications for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own funding applications" on public.funding_applications;
create policy "Users can insert their own funding applications"
  on public.funding_applications for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their own funding applications" on public.funding_applications;
create policy "Users can update their own funding applications"
  on public.funding_applications for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own funding applications" on public.funding_applications;
create policy "Users can delete their own funding applications"
  on public.funding_applications for delete
  using (auth.uid() = user_id or public.is_admin());

create index if not exists idx_funding_applications_user_id on public.funding_applications(user_id);
create index if not exists idx_funding_applications_product_id on public.funding_applications(funding_product_id);
create index if not exists idx_funding_applications_status on public.funding_applications(status);

-- ==============================================================================
-- 17. CONSULTATIONS TABLE (Step 12)
-- Customer consultation requests, status lifecycle, and admin confirmations
-- ==============================================================================
create table if not exists public.consultations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  consultation_type text not null check (consultation_type in (
    'Business Credit',
    'Funding Readiness',
    'Funding Strategy',
    'General Consultation'
  )),
  preferred_date date not null,
  preferred_time text not null,
  confirmed_date date,
  confirmed_time text,
  status text default 'Requested' not null check (status in (
    'Requested',
    'Confirmed',
    'Rescheduled',
    'Completed',
    'Cancelled'
  )),
  customer_message text default '',
  admin_message text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.consultations enable row level security;

-- Consultations RLS Policies (User isolation + Admin management)
drop policy if exists "Users can view their own consultations" on public.consultations;
create policy "Users can view their own consultations"
  on public.consultations for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert their own consultations" on public.consultations;
create policy "Users can insert their own consultations"
  on public.consultations for insert
  with check ((auth.uid() = user_id and status = 'Requested') or public.is_admin());

drop policy if exists "Users can update their own consultations" on public.consultations;
create policy "Users can update their own consultations"
  on public.consultations for update
  using (
    (auth.uid() = user_id and status in ('Requested', 'Rescheduled')) or public.is_admin()
  );

drop policy if exists "Users can delete their own draft consultations" on public.consultations;
create policy "Users can delete their own draft consultations"
  on public.consultations for delete
  using (
    (auth.uid() = user_id and status = 'Requested') or public.is_admin()
  );

create index if not exists idx_consultations_user_id on public.consultations(user_id);
create index if not exists idx_consultations_status on public.consultations(status);
create index if not exists idx_consultations_type on public.consultations(consultation_type);
create index if not exists idx_consultations_created_at on public.consultations(created_at desc);

-- ==============================================================================
-- 18. PLATFORM SETTINGS & SECTION CONTROLS (Owner Control Panel)
-- Administrator controls for dashboard section visibility & platform configs
-- ==============================================================================
create table if not exists public.platform_settings (
  id text primary key default 'default',
  sections jsonb not null default '{
    "business_profile": true,
    "business_readiness": true,
    "credit_readiness": true,
    "funding_readiness": true,
    "roadmap": true,
    "products": true,
    "funding": true,
    "funding_tracker": true,
    "consultation": true
  }'::jsonb,
  platform_name text default 'Crediqly',
  support_email text default 'support@crediqly.com',
  maintenance_mode boolean default false,
  allow_new_signups boolean default true,
  updated_at timestamptz default now() not null,
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.platform_settings enable row level security;

-- Ensure columns exist for messaging and roadmap controls
alter table public.platform_settings add column if not exists dashboard_announcement text default '';
alter table public.platform_settings add column if not exists announcement_enabled boolean default false;
alter table public.platform_settings add column if not exists welcome_message text default '';
alter table public.platform_settings add column if not exists consultation_message text default '';
alter table public.platform_settings add column if not exists funding_guidance text default '';
alter table public.platform_settings add column if not exists roadmap_settings jsonb default '{}'::jsonb;

-- Platform Settings RLS Policies
-- Readable by all authenticated users (customers need to know active sections)
drop policy if exists "Authenticated users can view platform settings" on public.platform_settings;
create policy "Authenticated users can view platform settings"
  on public.platform_settings for select
  using (true);

-- Only admins can insert or update platform settings
drop policy if exists "Admins can insert platform settings" on public.platform_settings;
create policy "Admins can insert platform settings"
  on public.platform_settings for insert
  with check (public.is_admin());

drop policy if exists "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
  on public.platform_settings for update
  using (public.is_admin());

-- Seed default settings row if not exists
insert into public.platform_settings (id)
values ('default')
on conflict (id) do nothing;

-- Consultations Payment Columns (Step 16 Monetization)
alter table public.consultations add column if not exists payment_status text default 'unpaid';
alter table public.consultations add column if not exists payment_amount numeric default 99.00;
alter table public.consultations add column if not exists stripe_checkout_session_id text;
alter table public.consultations add column if not exists stripe_payment_intent_id text;
alter table public.consultations add column if not exists paid_at timestamptz;
create index if not exists idx_consultations_payment_status on public.consultations(payment_status);

-- ==============================================================================
-- 20. SUBSCRIPTIONS TABLE (Step 16 Monetization - Pro Plan $39/mo)
-- Authoritative sync target for Stripe monthly subscriptions
-- ==============================================================================
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free' not null,
  status text default 'free' not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  -- Premium Advisory setup fee tracking ($499 one-time fee)
  advisory_setup_payment_status text default 'unpaid',
  advisory_setup_paid_at timestamptz,
  advisory_setup_checkout_session_id text,
  advisory_setup_payment_intent_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Subscriptions RLS Policies
drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can insert subscriptions" on public.subscriptions;
create policy "Admins can insert subscriptions"
  on public.subscriptions for insert
  with check (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Admins can update subscriptions" on public.subscriptions;
create policy "Admins can update subscriptions"
  on public.subscriptions for update
  using (public.is_admin() or auth.uid() = user_id);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_advisory_setup on public.subscriptions(advisory_setup_payment_status);

-- ==============================================================================
-- 21. PAYMENTS AUDIT TABLE (Step 16 Monetization - Stripe Checkout Sessions)
-- ==============================================================================
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  consultation_id uuid references public.consultations(id) on delete set null,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount integer not null, -- amount in cents (e.g. 9900 = $99.00)
  currency text default 'usd' not null,
  payment_type text not null, -- 'subscription' | 'consultation'
  status text not null, -- 'pending' | 'paid' | 'failed' | 'refunded'
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- Payments RLS Policies
drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can insert payments" on public.payments;
create policy "Admins can insert payments"
  on public.payments for insert
  with check (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Admins can update payments" on public.payments;
create policy "Admins can update payments"
  on public.payments for update
  using (public.is_admin());

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_session_id on public.payments(stripe_checkout_session_id);
create index if not exists idx_payments_consultation_id on public.payments(consultation_id);

-- ==============================================================================
-- 22. STRIPE WEBHOOK LOGS TABLE (Health, Idempotency & Auditability)
-- ==============================================================================
create table if not exists public.stripe_webhook_logs (
  id uuid default gen_random_uuid() primary key,
  event_id text not null unique,
  event_type text not null,
  status text default 'success' not null,
  summary text,
  created_at timestamptz default now() not null
);

alter table public.stripe_webhook_logs enable row level security;

drop policy if exists "Admins can view stripe webhook logs" on public.stripe_webhook_logs;
create policy "Admins can view stripe webhook logs"
  on public.stripe_webhook_logs for select
  using (public.is_admin());

drop policy if exists "Service role can insert stripe webhook logs" on public.stripe_webhook_logs;
create policy "Service role can insert stripe webhook logs"
  on public.stripe_webhook_logs for insert
  with check (true);

create index if not exists idx_stripe_webhook_logs_event_id on public.stripe_webhook_logs(event_id);
create index if not exists idx_stripe_webhook_logs_created_at on public.stripe_webhook_logs(created_at desc);

-- ==============================================================================
-- 23. STRIPE CONFIGURATION TABLE (Admin Stripe Setup Persistence)
-- Authoritative persistent store for Crediqly Stripe credentials and Price IDs
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

-- ==============================================================================
-- 24. CONVENIENT ADMIN COMMAND FOR FOUNDER
-- Run this in SQL Editor to grant yourself admin privileges:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@domain.com';
-- ==============================================================================



