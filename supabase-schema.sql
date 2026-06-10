-- Run this entire script in your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query > paste this > Run

-- PIGS TABLE
create table pigs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  tag_id text,
  name text,
  breed text,
  dob date,
  weight_kg numeric,
  status text default 'Healthy',
  pen text,
  notes text
);

-- FEED LOGS TABLE
create table feed_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date date,
  pig_id uuid references pigs(id) on delete set null,
  feed_type text,
  amount numeric,
  unit text,
  notes text
);

-- BREEDING LOGS TABLE
create table breeding_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  sow_id uuid references pigs(id) on delete set null,
  boar_id uuid references pigs(id) on delete set null,
  service_date date,
  expected_farrow date,
  status text default 'Gestating',
  piglets_born integer,
  notes text
);

-- SALES LOGS TABLE
create table sales_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  date date,
  pig_id uuid references pigs(id) on delete set null,
  buyer text,
  weight_kg numeric,
  price_per_kg numeric,
  total numeric,
  notes text
);

-- ALLOW ACCESS (Row Level Security - open for authenticated users)
alter table pigs enable row level security;
alter table feed_logs enable row level security;
alter table breeding_logs enable row level security;
alter table sales_logs enable row level security;

create policy "Allow all for authenticated users" on pigs for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on feed_logs for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on breeding_logs for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated users" on sales_logs for all using (auth.role() = 'authenticated');
