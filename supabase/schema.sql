-- ============================================
-- PromptVerse Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  username text unique not null,
  avatar_url text,
  bio text,
  membership text not null default 'starter' check (membership in ('starter', 'creator', 'pro', 'team')),
  verification_status text not null default 'none' check (verification_status in ('none', 'pending', 'verified')),
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  following uuid[] not null default '{}',
  followers uuid[] not null default '{}',
  favorites uuid[] not null default '{}',
  has_completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, username, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(replace(new.id::text, '-', ''), 1, 8)),
    'REF' || upper(substr(replace(new.id::text, '-', ''), 1, 6))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- PROJECTS
-- ============================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- ============================================
-- PROMPTS
-- ============================================
create table public.prompts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  content text not null,
  description text,
  tags text[] not null default '{}',
  output_type text not null default 'text' check (output_type in ('text', 'image', 'video', 'audio', 'file')),
  output_files jsonb not null default '[]',
  variables jsonb not null default '[]',
  collaborators jsonb not null default '[]',
  likes uuid[] not null default '{}',
  comments jsonb not null default '[]',
  versions jsonb not null default '[]',
  is_public boolean not null default false,
  is_archived boolean not null default false,
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- MARKETPLACE ITEMS
-- ============================================
create table public.marketplace_items (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  prompt_ids uuid[] not null default '{}',
  title text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 3.00),
  cover_image text,
  tags text[] not null default '{}',
  type text not null default 'single' check (type in ('single', 'collection')),
  prompt_count integer not null default 1,
  sales_count integer not null default 0,
  views integer not null default 0,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- ORDERS
-- ============================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references public.profiles(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  item_id uuid references public.marketplace_items(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  commission_rate numeric(4,3) not null default 0.15,
  net_amount numeric(10,2) not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'refunded')),
  review_rating integer check (review_rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);

-- ============================================
-- POSTS (Social feed)
-- ============================================
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  caption text not null,
  image_url text,
  video_url text,
  tags text[] not null default '{}',
  likes uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- MESSAGES
-- ============================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_ids uuid[] not null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- CUSTOM ORDERS (Commissions)
-- ============================================
create table public.custom_orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references public.profiles(id) on delete set null not null,
  seller_id uuid references public.profiles(id) on delete set null not null,
  title text not null,
  description text not null,
  budget numeric(10,2) not null,
  agreed_price numeric(10,2),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'declined', 'cancelled')),
  seller_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  actor_name text not null default '',
  actor_avatar text not null default '',
  type text not null,
  target_type text not null,
  target_id text not null,
  target_preview text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- REFERRALS
-- ============================================
create table public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'converted')),
  earned_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- CAMPAIGNS
-- ============================================
create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  creative_url text not null,
  creative_type text not null default 'image' check (creative_type in ('image', 'video')),
  prompt_ids uuid[] not null default '{}',
  budget numeric(10,2) not null,
  spent numeric(10,2) not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  purpose text not null default 'social' check (purpose in ('marketplace', 'social')),
  prompt_stats jsonb not null default '[]',
  total_impressions integer not null default 0,
  total_sales integer not null default 0,
  is_active boolean not null default true,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.prompts enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.orders enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.custom_orders enable row level security;
alter table public.notifications enable row level security;
alter table public.referrals enable row level security;
alter table public.campaigns enable row level security;

-- Profiles: public read, own write
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Projects: own access only
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id);

-- Prompts: own + public read
create policy "Users manage own prompts" on public.prompts for all using (auth.uid() = user_id);
create policy "Public prompts are viewable" on public.prompts for select using (is_public = true);

-- Marketplace: public read, seller write
create policy "Marketplace items are viewable" on public.marketplace_items for select using (true);
create policy "Sellers manage own items" on public.marketplace_items for all using (auth.uid() = seller_id);

-- Orders: buyer and seller access
create policy "Users see own orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users create orders" on public.orders for insert with check (auth.uid() = buyer_id);

-- Posts: public read, own write
create policy "Posts are viewable by everyone" on public.posts for select using (true);
create policy "Users manage own posts" on public.posts for all using (auth.uid() = author_id);

-- Post comments: public read, own write
create policy "Comments are viewable by everyone" on public.post_comments for select using (true);
create policy "Users manage own comments" on public.post_comments for all using (auth.uid() = author_id);

-- Conversations: participants only
create policy "Participants see conversations" on public.conversations for select using (auth.uid() = any(participant_ids));
create policy "Users create conversations" on public.conversations for insert with check (auth.uid() = any(participant_ids));

-- Messages: conversation participants only
create policy "Participants see messages" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() = any(c.participant_ids))
);
create policy "Participants send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Participants update messages" on public.messages for update using (
  exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() = any(c.participant_ids))
);

-- Custom orders: buyer and seller
create policy "Users see own custom orders" on public.custom_orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers create custom orders" on public.custom_orders for insert with check (auth.uid() = buyer_id);
create policy "Seller updates status" on public.custom_orders for update using (auth.uid() = seller_id or auth.uid() = buyer_id);

-- Notifications: own only
create policy "Users see own notifications" on public.notifications for all using (auth.uid() = user_id);

-- Referrals: own only
create policy "Users see own referrals" on public.referrals for select using (auth.uid() = referrer_id);

-- Campaigns: public read, seller write
create policy "Campaigns are viewable" on public.campaigns for select using (true);
create policy "Sellers manage own campaigns" on public.campaigns for all using (auth.uid() = seller_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true);
insert into storage.buckets (id, name, public) values ('product-covers', 'product-covers', true);
insert into storage.buckets (id, name, public) values ('prompt-outputs', 'prompt-outputs', false);
insert into storage.buckets (id, name, public) values ('campaign-creatives', 'campaign-creatives', true);

-- Storage policies
create policy "Anyone can view public files" on storage.objects for select using (bucket_id in ('avatars', 'post-media', 'product-covers', 'campaign-creatives'));
create policy "Authenticated users upload their own files" on storage.objects for insert with check (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own files" on storage.objects for update using (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own files" on storage.objects for delete using (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- REALTIME
-- ============================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
