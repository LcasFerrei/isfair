-- Limite de uso das rotas que gastam a cota do Gemini (/api/identify e /api/estimate).
-- Rode uma vez no Supabase: SQL Editor → New query → cole este arquivo → Run.
-- Guarda só a rota, a hora e um hash do IP (nunca o IP). Linhas com mais de 2 dias podem ser apagadas.

create table if not exists public.api_calls (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  route      text not null check (route in ('identify', 'estimate')),
  ip_hash    text not null
);

create index if not exists api_calls_ip_idx on public.api_calls (ip_hash, route, created_at desc);
create index if not exists api_calls_time_idx on public.api_calls (created_at desc);

alter table public.api_calls enable row level security;
revoke all on public.api_calls from anon, authenticated;
grant select, insert, delete on public.api_calls to service_role;

-- Limpeza (rode de vez em quando, ou agende em Database → Cron):
--   delete from public.api_calls where created_at < now() - interval '2 days';
--   update public.reports set ip_hash = null where ip_hash is not null and created_at < now() - interval '30 days';
