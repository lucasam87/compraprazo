create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where id = auth.uid() and ativo);
$$;

create or replace function public.usuario_dono()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where id = auth.uid() and ativo and papel = 'dono');
$$;

alter table public.perfis enable row level security;
alter table public.configuracoes enable row level security;
alter table public.clientes enable row level security;
alter table public.compras enable row level security;
alter table public.parcelas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.cobrancas enable row level security;
alter table public.modelos_mensagem enable row level security;
alter table public.auditoria enable row level security;

create policy perfis_ativos_select on public.perfis for select using (id = auth.uid() or public.usuario_ativo());
create policy perfis_dono_update on public.perfis for update using (public.usuario_dono()) with check (public.usuario_dono());

create policy configuracoes_ativos_select on public.configuracoes for select using (public.usuario_ativo());
create policy configuracoes_dono_update on public.configuracoes for update using (public.usuario_dono()) with check (public.usuario_dono());

create policy clientes_ativos_all on public.clientes for all using (public.usuario_ativo()) with check (public.usuario_ativo());
create policy compras_ativos_all on public.compras for all using (public.usuario_ativo()) with check (public.usuario_ativo());
create policy parcelas_ativos_all on public.parcelas for all using (public.usuario_ativo()) with check (public.usuario_ativo());
create policy pagamentos_ativos_all on public.pagamentos for all using (public.usuario_ativo()) with check (public.usuario_ativo());
create policy cobrancas_ativos_all on public.cobrancas for all using (public.usuario_ativo()) with check (public.usuario_ativo());
create policy modelos_ativos_select on public.modelos_mensagem for select using (public.usuario_ativo());
create policy modelos_dono_update on public.modelos_mensagem for update using (public.usuario_dono()) with check (public.usuario_dono());
create policy auditoria_ativos_select on public.auditoria for select using (public.usuario_ativo());

revoke all on function public.usuario_ativo() from public;
revoke all on function public.usuario_dono() from public;
grant execute on function public.usuario_ativo() to authenticated;
grant execute on function public.usuario_dono() to authenticated;
