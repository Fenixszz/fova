-- ============================================================
-- FOVA · CRM — Backend de colaboração em tempo real (Supabase/Postgres)
-- ============================================================
-- Cole este arquivo inteiro no SQL Editor do Supabase e rode uma vez.
-- Ele cria as tabelas, o Realtime, as regras de segurança (RLS) e os
-- gatilhos. É idempotente: pode rodar de novo sem quebrar nada.
--
-- Modelo de dados (decisões registradas no README):
--   · profiles     → os dois sócios (nome, cor, iniciais). 1 linha por login.
--   · crm_cards    → camada mutável do CRM, 1 linha por empresa (campo a campo,
--                    então edições em empresas diferentes nunca colidem).
--   · app_state    → chave/valor para o estado dos Quadros (snapshot) e imports.
--   · activity     → histórico global "quem fez o quê e quando".
--
-- A base de leads (crm-data.enc.js) continua sendo a semente compartilhada e
-- só-leitura; o que muda ao vivo vive nas tabelas acima.
-- ============================================================

-- ---------- extensões ----------
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PERFIS (um por sócio) — espelha auth.users
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null,
  email       text,
  cor         text not null default '#CBA96E',   -- cor de presença/avatar
  iniciais    text,
  role        text not null default 'admin',      -- os dois são admin total
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Todo mundo logado enxerga os dois perfis (presença, atribuições, histórico).
drop policy if exists "perfis visíveis para autenticados" on public.profiles;
create policy "perfis visíveis para autenticados"
  on public.profiles for select
  to authenticated using (true);

-- Cada um edita o próprio perfil.
drop policy if exists "edita o próprio perfil" on public.profiles;
create policy "edita o próprio perfil"
  on public.profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Inserção do próprio perfil (no primeiro login do sócio).
drop policy if exists "cria o próprio perfil" on public.profiles;
create policy "cria o próprio perfil"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);

-- ============================================================
-- 2. CRM_CARDS — camada mutável do CRM (1 linha por empresa)
-- ============================================================
-- Guarda, por empresa, exatamente os "overlays" que hoje ficam no localStorage:
--   ov       = overrides[empresa]  (etapa/campos editados)
--   touch    = touch[empresa]      (quando foi contatado, em ms)
--   deleted  = deleted[empresa]
--   archived = archived[empresa]   (objeto com lead+decisor arquivados)
--   renamed  = renamed[empresa]
-- Resolução de conflito: por linha (empresa), último a escrever vence por
-- updated_at. Como é 1 linha por empresa, dois sócios mexendo em empresas
-- diferentes jamais se atropelam.
create table if not exists public.crm_cards (
  company_key text primary key,                 -- chave normalizada da empresa
  ov          jsonb,
  touch       bigint,
  deleted     boolean not null default false,
  archived    jsonb,
  renamed     boolean not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id)
);

alter table public.crm_cards enable row level security;

drop policy if exists "crm total para autenticados" on public.crm_cards;
create policy "crm total para autenticados"
  on public.crm_cards for all
  to authenticated using (true) with check (true);

-- ============================================================
-- 3. APP_STATE — chave/valor (Quadros + imports + prefs compartilhadas)
-- ============================================================
-- key='boards' → snapshot JSON do módulo Quadros (fonte durável; a propagação
--                ao vivo entre telas é por Broadcast de operações, não por
--                recarregar este snapshot).
-- key='import' → planilha importada que vira leads extras.
create table if not exists public.app_state (
  key         text primary key,
  data        jsonb not null,
  version     bigint not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id)
);

alter table public.app_state enable row level security;

drop policy if exists "estado total para autenticados" on public.app_state;
create policy "estado total para autenticados"
  on public.app_state for all
  to authenticated using (true) with check (true);

-- ============================================================
-- 4. ACTIVITY — histórico global (quem fez o quê e quando)
-- ============================================================
create table if not exists public.activity (
  id          uuid primary key default gen_random_uuid(),
  actor       uuid references public.profiles (id),
  actor_nome  text,
  actor_cor   text,
  acao        text not null,          -- ex.: "moveu o cartão", "arquivou o lead"
  alvo        text,                   -- ex.: nome da empresa / título do cartão
  escopo      text,                   -- 'crm' | 'board' | 'auth'
  meta        jsonb,
  ts          timestamptz not null default now()
);

create index if not exists activity_ts_idx on public.activity (ts desc);

alter table public.activity enable row level security;

drop policy if exists "histórico visível para autenticados" on public.activity;
create policy "histórico visível para autenticados"
  on public.activity for select
  to authenticated using (true);

drop policy if exists "registra histórico" on public.activity;
create policy "registra histórico"
  on public.activity for insert
  to authenticated with check (auth.uid() = actor);

-- ============================================================
-- 5. TRAVA DE CADASTRO — no máximo 2 contas por auto-cadastro
-- ============================================================
-- Depois que os dois sócios existirem, o auto-cadastro público para de criar
-- perfis (o app também esconde a tela de cadastro). Para travar de vez,
-- desligue "Enable Signups" em Authentication → Providers → Email no painel.
create or replace function public.guard_profile_limit()
returns trigger language plpgsql security definer as $$
declare n int;
begin
  select count(*) into n from public.profiles;
  if n >= 2 then
    raise exception 'Cadastro encerrado: os dois sócios já estão cadastrados.';
  end if;
  return new;
end $$;

drop trigger if exists trg_profile_limit on public.profiles;
create trigger trg_profile_limit
  before insert on public.profiles
  for each row execute function public.guard_profile_limit();

-- Quantos sócios já existem? Chamável SEM login, só pra a tela de abertura
-- decidir entre "configuração inicial" (0 contas) e "entrar" (>0). Não expõe
-- nenhum dado pessoal, apenas a contagem.
create or replace function public.profiles_count()
returns int language sql security definer stable as $$
  select count(*)::int from public.profiles;
$$;

grant execute on function public.profiles_count() to anon, authenticated;

-- ============================================================
-- 6. REALTIME — publica as mudanças das tabelas colaborativas
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.crm_cards;
alter publication supabase_realtime add table public.app_state;
alter publication supabase_realtime add table public.activity;
alter publication supabase_realtime add table public.profiles;

-- Para o Realtime entregar a linha ANTIGA em updates/deletes (útil p/ merge):
alter table public.crm_cards replica identity full;
alter table public.app_state replica identity full;

-- ============================================================
-- Pronto. Próximos passos ficam no supabase/README.md.
-- ============================================================
