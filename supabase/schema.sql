-- ============================================================================
-- SocialPulse — Supabase schema
--
-- Run this once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- The app works without this (it falls back to generated sample data), but
-- creating these tables lets you store your own posts and insights.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users (id) on delete cascade,
  title         text        not null default 'Untitled post',
  content       text        not null default '',
  platform      text        not null default 'general',
  likes         integer     not null default 0 check (likes >= 0),
  comments      integer     not null default 0 check (comments >= 0),
  shares        integer     not null default 0 check (shares >= 0),
  -- Unique accounts that saw the post. Engagement rate is computed against
  -- this, so it matters more than any of the counts above.
  reach         integer     not null default 0 check (reach >= 0),
  impressions   integer     not null default 0 check (impressions >= 0),
  thumbnail     text,
  permalink     text,
  created_at    timestamptz not null default now()
);

create index if not exists posts_user_created_idx
  on public.posts (user_id, created_at desc);

create index if not exists posts_platform_idx
  on public.posts (platform);

-- ---------------------------------------------------------------------------
-- insights
-- ---------------------------------------------------------------------------
create table if not exists public.insights (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete cascade,
  text        text        not null,
  category    text        not null default 'General',
  confidence  numeric(3,2) not null default 0.80
                check (confidence >= 0 and confidence <= 1),
  created_at  timestamptz not null default now()
);

create index if not exists insights_user_created_idx
  on public.insights (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- RLS is ON by default here on purpose. Without it, the anon key shipped to
-- every browser would be able to read and write every row in the table.
-- ---------------------------------------------------------------------------
alter table public.posts    enable row level security;
alter table public.insights enable row level security;

drop policy if exists "own posts" on public.posts;
create policy "own posts" on public.posts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own insights" on public.insights;
create policy "own insights" on public.insights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- OPTIONAL: demo/public mode
--
-- Uncomment ONLY if you want a shared, publicly readable dataset (for example
-- a portfolio demo). This lets anyone with your anon key read every row.
-- ---------------------------------------------------------------------------
-- drop policy if exists "public read" on public.posts;
-- create policy "public read" on public.posts for select using (true);
--
-- drop policy if exists "public read insights" on public.insights;
-- create policy "public read insights" on public.insights for select using (true);

-- ---------------------------------------------------------------------------
-- OPTIONAL: seed rows
--
-- Replace <YOUR-USER-UUID> with the id from Authentication -> Users, or drop
-- the user_id column from the insert if you enabled public read above.
-- ---------------------------------------------------------------------------
-- insert into public.posts (user_id, title, content, platform, likes, comments, shares, reach, created_at)
-- values
--   ('<YOUR-USER-UUID>', 'Behind the scenes', 'Studio rebuild, week six.', 'instagram', 842, 96, 47, 18400, now() - interval '2 days'),
--   ('<YOUR-USER-UUID>', 'Three hooks that worked', 'We tested 40 openings.',  'instagram', 1290, 210, 88, 26100, now() - interval '5 days'),
--   ('<YOUR-USER-UUID>', 'Community spotlight',     'Priya shipped in 9 days.', 'facebook',  610,  74, 31, 12800, now() - interval '8 days');
