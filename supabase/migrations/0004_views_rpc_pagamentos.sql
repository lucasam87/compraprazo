create or replace view public.vw_parcelas_abertas as
select
  pa.id as parcela_id,
  pa.compra_id,
  pa.cliente_id,
  pa.numero,
  pa.valor_centavos,
  pa.vencimento,
  co.juros_mensal_bps,
  co.multa_bps,
  co.carencia_dias,
  coalesce(sum(pg.principal_centavos) filter (where not pg.estornado), 0) as principal_pago_centavos,
  pa.valor_centavos - coalesce(sum(pg.principal_centavos) filter (where not pg.estornado), 0) as saldo_principal_centavos,
  greatest((current_date - pa.vencimento), 0) as dias_atraso
from public.parcelas pa
join public.compras co on co.id = pa.compra_id
left join public.pagamentos pg on pg.parcela_id = pa.id
where pa.status = 'aberta' and co.status = 'ativa'
group by pa.id, co.id;

create or replace view public.vw_saldo_clientes as
select
  cl.id as cliente_id,
  cl.nome,
  cl.limite_centavos,
  coalesce(sum(vp.saldo_principal_centavos), 0) as saldo_principal_aberto,
  coalesce(cl.limite_centavos, cfg.limite_padrao_centavos) - coalesce(sum(vp.saldo_principal_centavos), 0) as limite_disponivel
from public.clientes cl
cross join public.configuracoes cfg
left join public.vw_parcelas_abertas vp on vp.cliente_id = cl.id
where cl.ativo
group by cl.id, cfg.limite_padrao_centavos;

create or replace function public.registrar_pagamento(
  p_parcela uuid,
  p_valor_recebido_centavos bigint,
  p_forma text,
  p_data date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_parcela public.parcelas%rowtype;
  v_compra public.compras%rowtype;
  v_principal_pago bigint;
  v_saldo_principal bigint;
  v_dias_atraso integer;
  v_dias_cobraveis integer;
  v_multa bigint;
  v_juros bigint;
  v_encargos bigint;
  v_encargos_pagos bigint;
  v_principal_recebido bigint;
  v_pagamento uuid;
begin
  if not public.usuario_ativo() then raise exception 'Usuário inativo'; end if;
  if p_valor_recebido_centavos <= 0 or p_forma not in ('dinheiro', 'pix', 'cartao', 'outro') then raise exception 'Pagamento inválido'; end if;

  select * into v_parcela from public.parcelas where id = p_parcela and status = 'aberta' for update;
  if not found then raise exception 'Parcela não encontrada ou já paga'; end if;
  select * into v_compra from public.compras where id = v_parcela.compra_id and status = 'ativa';
  if not found then raise exception 'Compra inválida'; end if;

  select coalesce(sum(principal_centavos) filter (where not estornado), 0) into v_principal_pago from public.pagamentos where parcela_id = p_parcela;
  v_saldo_principal := v_parcela.valor_centavos - v_principal_pago;
  v_dias_atraso := greatest((p_data - v_parcela.vencimento), 0);
  v_dias_cobraveis := greatest(v_dias_atraso - v_compra.carencia_dias, 0);
  if v_dias_cobraveis = 0 then
    v_multa := 0; v_juros := 0;
  else
    v_multa := round(v_saldo_principal * v_compra.multa_bps / 10000.0);
    v_juros := round(v_saldo_principal * v_compra.juros_mensal_bps * v_dias_cobraveis / 300000.0);
  end if;
  v_encargos := v_multa + v_juros;
  if p_valor_recebido_centavos > v_saldo_principal + v_encargos then raise exception 'Pagamento maior que o saldo atualizado'; end if;

  v_encargos_pagos := least(p_valor_recebido_centavos, v_encargos);
  v_principal_recebido := least(p_valor_recebido_centavos - v_encargos_pagos, v_saldo_principal);
  insert into public.pagamentos (parcela_id, cliente_id, data_pagamento, principal_centavos, encargos_centavos, forma, criado_por)
  values (p_parcela, v_parcela.cliente_id, p_data, v_principal_recebido, v_encargos_pagos, p_forma, auth.uid()) returning id into v_pagamento;

  if v_principal_recebido = v_saldo_principal then update public.parcelas set status = 'paga' where id = p_parcela; end if;
  return v_pagamento;
end;
$$;

grant execute on function public.registrar_pagamento(uuid, bigint, text, date) to authenticated;
