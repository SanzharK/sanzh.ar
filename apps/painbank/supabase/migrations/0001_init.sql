-- Pain Bank initial schema. Run once in the Supabase SQL editor.
-- Access model: RLS on with NO anon policies — only the service-role key
-- (held server-side by the app's API routes) can read or write.

create table participants (
  id uuid primary key,                    -- client-generated at signup
  name text not null,
  created_at timestamptz not null default now()
);

create unique index participants_name_key on participants (lower(name));

create table entries (
  id uuid primary key,                    -- client-generated: idempotency key for retried banks
  participant_id uuid not null references participants(id),
  day date not null,                      -- Sydney-local challenge date
  exercise text not null,
  count int not null check (count between -500 and 500 and count <> 0),
  created_at timestamptz not null default now()
);

create index entries_day_idx on entries (day);
create index entries_participant_idx on entries (participant_id, day);

alter table participants enable row level security;
alter table entries enable row level security;
