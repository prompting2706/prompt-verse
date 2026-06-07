-- ============================================
-- Migration 002 — Fix missing columns & constraints
-- Run in Supabase SQL Editor
-- ============================================

-- ---- profiles: missing followers, favorites, has_completed_onboarding ----
alter table public.profiles
  add column if not exists followers uuid[] not null default '{}',
  add column if not exists favorites uuid[] not null default '{}',
  add column if not exists has_completed_onboarding boolean not null default false;

-- ---- custom_orders: status constraint missing in_progress & cancelled ----
-- Also: rename delivery_note -> seller_note to match application code
alter table public.custom_orders
  drop constraint if exists custom_orders_status_check;

alter table public.custom_orders
  add constraint custom_orders_status_check
    check (status in ('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'declined', 'cancelled'));

alter table public.custom_orders
  rename column if exists delivery_note to seller_note;

-- If delivery_note doesn't exist yet, add seller_note
alter table public.custom_orders
  add column if not exists seller_note text;

-- ---- notifications: missing actor_name, actor_avatar ----
alter table public.notifications
  add column if not exists actor_name text not null default '',
  add column if not exists actor_avatar text not null default '';

-- ---- campaigns: missing purpose, prompt_stats, total_impressions, total_sales ----
alter table public.campaigns
  add column if not exists purpose text not null default 'social'
    check (purpose in ('marketplace', 'social')),
  add column if not exists prompt_stats jsonb not null default '[]',
  add column if not exists total_impressions integer not null default 0,
  add column if not exists total_sales integer not null default 0;

-- Backfill total_impressions from existing impressions column
update public.campaigns set total_impressions = impressions where total_impressions = 0;

-- ---- marketplace_items: missing original_price, sponsored dates ----
alter table public.marketplace_items
  add column if not exists original_price numeric(10,2),
  add column if not exists sponsored_start_date timestamptz,
  add column if not exists sponsored_end_date timestamptz;

-- ---- prompts: missing likes, comments (stored as jsonb) ----
alter table public.prompts
  add column if not exists likes uuid[] not null default '{}',
  add column if not exists comments jsonb not null default '[]',
  add column if not exists versions jsonb not null default '[]';
