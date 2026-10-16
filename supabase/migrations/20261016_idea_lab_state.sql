-- Idea Lab: one row per user holding the whole dashboard state as JSON.
-- Apply this in the Supabase SQL editor (or with the Supabase CLI / MCP apply_migration).

create table if not exists public.idea_lab_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.idea_lab_state enable row level security;

-- Each signed-in user can see and change only their own row.
drop policy if exists "own row select" on public.idea_lab_state;
create policy "own row select" on public.idea_lab_state
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own row insert" on public.idea_lab_state;
create policy "own row insert" on public.idea_lab_state
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own row update" on public.idea_lab_state;
create policy "own row update" on public.idea_lab_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own row delete" on public.idea_lab_state;
create policy "own row delete" on public.idea_lab_state
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Live updates between devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'idea_lab_state'
  ) then
    alter publication supabase_realtime add table public.idea_lab_state;
  end if;
end $$;
