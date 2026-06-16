-- Availability Poll schema

create extension if not exists "pgcrypto";

create table polls (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  description text,
  start_date date not null,
  num_days   int not null default 7,
  start_hour int not null default 8,
  end_hour   int not null default 22,
  closes_at  timestamptz,
  created_at timestamptz not null default now()
);

create table respondents (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references polls(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  email      text not null,
  timezone   text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, email)
);

create table availability (
  id            uuid primary key default gen_random_uuid(),
  respondent_id uuid not null references respondents(id) on delete cascade,
  slot_utc      timestamptz not null,
  unique (respondent_id, slot_utc)
);

-- Indexes
create index idx_polls_slug on polls(slug);
create index idx_respondents_poll on respondents(poll_id);
create index idx_availability_respondent on availability(respondent_id);

-- RLS
alter table polls enable row level security;
alter table respondents enable row level security;
alter table availability enable row level security;

create policy "Anyone can create polls"
  on polls for insert with check (true);

create policy "Anyone can read polls by slug"
  on polls for select using (true);

create policy "Anyone can insert respondents"
  on respondents for insert with check (true);

create policy "Anyone can read respondents for a poll"
  on respondents for select using (true);

create policy "Anyone can delete their respondent rows"
  on respondents for delete using (true);

create policy "Anyone can insert availability"
  on availability for insert with check (true);

create policy "Anyone can read availability"
  on availability for select using (true);

create policy "Anyone can delete availability"
  on availability for delete using (true);

-- Enable realtime on availability
alter publication supabase_realtime add table availability;
