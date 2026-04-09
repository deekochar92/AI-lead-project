-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  slug text unique not null,
  theme_color text not null default '#5B5BD6',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  label text not null,
  field_type text not null check (field_type in ('text', 'email', 'textarea')),
  is_required boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'qualified', 'unqualified')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  reason text,
  created_at timestamptz not null default now()
);

-- Row level security
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.forms enable row level security;
alter table public.questions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_scores enable row level security;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users create own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Members can read workspace" on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = auth.uid()
    )
  );

create policy "Members manage forms" on public.forms
  for all using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "Members manage questions" on public.questions
  for all using (
    exists (
      select 1
      from public.forms f
      join public.workspace_members wm on wm.workspace_id = f.workspace_id
      where f.id = form_id and wm.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.forms f
      join public.workspace_members wm on wm.workspace_id = f.workspace_id
      where f.id = form_id and wm.user_id = auth.uid()
    )
  );

create policy "Public can submit leads" on public.leads
  for insert with check (true);

create policy "Members can read leads" on public.leads
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "Public can insert lead scores" on public.lead_scores
  for insert with check (true);

create policy "Members can read lead scores" on public.lead_scores
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "Members read workspace members" on public.workspace_members
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
    )
  );

-- Optional helper function to bootstrap workspace after auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
