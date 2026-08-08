-- Fizika Kursi Admin: Supabase database
-- Supabase Dashboard > SQL Editor > New query > paste and Run.

create extension if not exists "pgcrypto";

create table if not exists public.course_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text,
  group_id uuid references public.course_groups(id) on delete set null,
  monthly_fee numeric(12,2) not null default 0,
  started_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  base_amount numeric(12,2) not null default 0,
  additional_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id, year, month)
);

create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  task_number integer not null check (task_number between 1 and 3),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(student_id, year, month, task_number)
);

create table if not exists public.settings (
  id boolean primary key default true,
  penalty_amount numeric(12,2) not null default 50000,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = true)
);

insert into public.settings(id, penalty_amount)
values (true, 50000)
on conflict (id) do nothing;

insert into public.academic_years(year)
values (extract(year from now())::int)
on conflict (year) do nothing;

-- RLS: the app is admin-only. Create admin account in Supabase Auth,
-- then sign in. Authenticated users can use these tables.
alter table public.course_groups enable row level security;
alter table public.academic_years enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.homework enable row level security;
alter table public.settings enable row level security;

drop policy if exists "auth all groups" on public.course_groups;
drop policy if exists "auth all years" on public.academic_years;
drop policy if exists "auth all students" on public.students;
drop policy if exists "auth all payments" on public.payments;
drop policy if exists "auth all homework" on public.homework;
drop policy if exists "auth all settings" on public.settings;

create policy "auth all groups" on public.course_groups for all to authenticated using (true) with check (true);
create policy "auth all years" on public.academic_years for all to authenticated using (true) with check (true);
create policy "auth all students" on public.students for all to authenticated using (true) with check (true);
create policy "auth all payments" on public.payments for all to authenticated using (true) with check (true);
create policy "auth all homework" on public.homework for all to authenticated using (true) with check (true);
create policy "auth all settings" on public.settings for all to authenticated using (true) with check (true);

-- Useful view for the "Vazifasi bajarilmaganlar" page.
create or replace view public.homework_penalties as
select
  h.student_id,
  h.year,
  h.month,
  count(*) filter (where h.completed = false)::int as failed_tasks,
  s.first_name,
  s.last_name,
  s.monthly_fee,
  g.name as group_name
from public.homework h
join public.students s on s.id = h.student_id
left join public.course_groups g on g.id = s.group_id
group by h.student_id, h.year, h.month, s.first_name, s.last_name, s.monthly_fee, g.name
having count(*) filter (where h.completed = false) >= 3;