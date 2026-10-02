create extension if not exists pgcrypto;

create table public.perfis (
  id uuid primary key references auth.users(id) on delete restrict,
  nome text not null,
  papel text not null check (papel in ('dono', 'atendente')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.configuracoes (
  id smallint primary key default 1 check (id = 1),
  juros_mensal_bps integer not null default 100,
  multa_bps integer not null default 200,
  carencia_dias integer not null default 0,
  limite_padrao_centavos bigint not null default 30000,
  bloqueio_auto boolean not null default true,
  bloqueio_dias_atraso integer not null default 30,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.perfis(id)
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  observacoes text,
  limite_centavos bigint,
  bloqueado boolean not null default false,
  motivo_bloqueio text,
  bloqueado_em timestamptz,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.perfis(id)
);

create index clientes_telefone_idx on public.clientes (telefone);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  data_compra date not null default current_date,
  valor_total_centavos bigint not null check (valor_total_centavos > 0),
  descricao text,
  qtd_parcelas integer not null check (qtd_parcelas between 1 and 24),
  juros_mensal_bps integer not null,
  multa_bps integer not null,
  carencia_dias integer not null,
  status text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  autorizada_excecao boolean not null default false,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.perfis(id)
);

create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id),
  cliente_id uuid not null references public.clientes(id),
  numero integer not null,
  valor_centavos bigint not null check (valor_centavos > 0),
  vencimento date not null,
  status text not null default 'aberta' check (status in ('aberta', 'paga', 'cancelada')),
  unique (compra_id, numero)
);

create index parcelas_vencimento_aberta_idx on public.parcelas (vencimento) where status = 'aberta';

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references public.parcelas(id),
  cliente_id uuid not null references public.clientes(id),
  data_pagamento date not null default current_date,
  principal_centavos bigint not null check (principal_centavos >= 0),
  encargos_centavos bigint not null default 0 check (encargos_centavos >= 0),
  forma text not null check (forma in ('dinheiro', 'pix', 'cartao', 'outro')),
  estornado boolean not null default false,
  estornado_em timestamptz,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.perfis(id),
  check (principal_centavos + encargos_centavos > 0)
);

create index pagamentos_parcela_idx on public.pagamentos (parcela_id);

create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references public.parcelas(id),
  cliente_id uuid not null references public.clientes(id),
  modelo text not null,
  canal text not null default 'whatsapp',
  texto text not null,
  enviada_em timestamptz not null default now(),
  criado_por uuid references public.perfis(id)
);

create table public.modelos_mensagem (
  codigo text primary key check (codigo in ('lembrete', 'cobranca', 'aviso_bloqueio')),
  dias_min integer not null,
  dias_max integer,
  texto text not null
);

create table public.auditoria (
  id bigint generated always as identity primary key,
  quando timestamptz not null default now(),
  usuario_id uuid references public.perfis(id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  detalhes jsonb
);

insert into public.configuracoes default values;
