-- Relatos da comunidade: quanto os turistas realmente pagaram.
-- Rode uma vez no Supabase: SQL Editor → New query → cole este arquivo → Run.
--
-- Só o servidor (funções /api/report e /api/community, com a chave service_role) lê e grava.
-- O navegador nunca acessa esta tabela direto: RLS ligado e nenhuma política para anon/authenticated.

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  -- Produto do catálogo ("coco") ou item fora dele ("custom:club social integral")
  product_key text        not null check (char_length(product_key) between 1 and 100),
  -- Cidade: slug ("rio") ou "geo:<país>:<estado>:<cidade>"
  city_id     text        not null check (char_length(city_id) between 1 and 160),
  -- Moeda local em que o valor foi pago (ISO 4217)
  currency    text        not null check (currency ~ '^[A-Z]{3}$'),
  paid        numeric(14, 2) not null check (paid > 0),
  -- Mês e ano da viagem (sempre o dia 1 do mês da compra)
  trip_month  date        not null default date_trunc('month', now())::date,
  -- De onde o turista é (opcional): país ISO 3166-1 alfa-2 ou "EU"
  origin      text        check (origin ~ '^[A-Z]{2}$'),
  -- Conta de quem relatou (opcional, nunca mostrada): permite apagar os relatos da pessoa
  user_id     uuid        references auth.users (id) on delete set null,
  -- Hash do IP com sal secreto, só contra spam (limite por hora e um relato por item por dia)
  ip_hash     text
);

create index if not exists reports_lookup_idx on public.reports (product_key, city_id, currency, created_at desc);
create index if not exists reports_ip_idx on public.reports (ip_hash, created_at desc);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;
-- Sem políticas de propósito: anon e authenticated não leem nem gravam. A service_role ignora o RLS.

-- Projeto criado com "Automatically expose new tables" desligado: só o servidor recebe acesso.
revoke all on public.reports from anon, authenticated;
grant select, insert, update, delete on public.reports to service_role;

-- Opcional, para privacidade: apaga o hash do IP de relatos com mais de 30 dias.
-- Rode de vez em quando, ou agende em Database → Cron:
--   update public.reports set ip_hash = null where ip_hash is not null and created_at < now() - interval '30 days';
