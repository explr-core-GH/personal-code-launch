-- =========================================================================
-- Poster Builder: poster_projects table
-- =========================================================================
create table if not exists public.poster_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Poster',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists poster_projects_user_id_idx
  on public.poster_projects(user_id);

create index if not exists poster_projects_updated_at_idx
  on public.poster_projects(user_id, updated_at desc);

alter table public.poster_projects enable row level security;

create policy "users see own posters"
  on public.poster_projects for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own posters"
  on public.poster_projects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own posters"
  on public.poster_projects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own posters"
  on public.poster_projects for delete
  to authenticated
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists poster_projects_touch_updated_at on public.poster_projects;
create trigger poster_projects_touch_updated_at
  before update on public.poster_projects
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- Poster Builder: poster-images storage bucket
-- Private bucket. Files live under {auth.uid()}/{projectId}/{visualId}.{ext}
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'poster-images',
  'poster-images',
  false,
  52428800, -- 50 MB
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: scope all access by first path segment = auth.uid()
create policy "poster-images: users read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'poster-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "poster-images: users upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'poster-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "poster-images: users update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'poster-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'poster-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "poster-images: users delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'poster-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );