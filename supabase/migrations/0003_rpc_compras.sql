create or replace function public.criar_compra(
  p_cliente uuid,
  p_valor_centavos bigint,
  p_descricao text,
  p_qtd_parcelas integer,
  p_primeiro_vencimento date,
  p_autorizar_excecao boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cliente public.clientes%rowtype;
  v_config public.configuracoes%rowtype;
  v_compra uuid;
  v_limite bigint;
  v_saldo bigint;
  v_base bigint;
  v_resto bigint;
  v_valor_parcela bigint;
  v_numero integer;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário inativo';
  end if;
  if p_valor_centavos <= 0 or p_qtd_parcelas not between 1 and 24 then
    raise exception 'Dados da compra inválidos';
  end if;

  select * into v_cliente from public.clientes where id = p_cliente and ativo for update;
  if not found then raise exception 'Cliente não encontrado'; end if;
  if v_cliente.bloqueado then raise exception 'Cliente bloqueado'; end if;

  select * into v_config from public.configuracoes where id = 1;
  v_limite := coalesce(v_cliente.limite_centavos, v_config.limite_padrao_centavos);
  select coalesce(sum(pa.valor_centavos - coalesce(pg.principal_pago, 0)), 0)
    into v_saldo
    from public.parcelas pa
    left join lateral (
      select sum(principal_centavos) filter (where not estornado) as principal_pago
      from public.pagamentos where parcela_id = pa.id
    ) pg on true
    where pa.cliente_id = p_cliente and pa.status = 'aberta';

  if p_valor_centavos > v_limite - v_saldo and not (p_autorizar_excecao and public.usuario_dono()) then
    raise exception 'Compra acima do limite disponível';
  end if;

  insert into public.compras (cliente_id, valor_total_centavos, descricao, qtd_parcelas, juros_mensal_bps, multa_bps, carencia_dias, autorizada_excecao, criado_por)
  values (p_cliente, p_valor_centavos, p_descricao, p_qtd_parcelas, v_config.juros_mensal_bps, v_config.multa_bps, v_config.carencia_dias, p_autorizar_excecao, auth.uid())
  returning id into v_compra;

  v_base := p_valor_centavos / p_qtd_parcelas;
  v_resto := p_valor_centavos % p_qtd_parcelas;
  for v_numero in 1..p_qtd_parcelas loop
    v_valor_parcela := v_base + case when v_numero = 1 then v_resto else 0 end;
    insert into public.parcelas (compra_id, cliente_id, numero, valor_centavos, vencimento)
    values (v_compra, p_cliente, v_numero, v_valor_parcela, (p_primeiro_vencimento + ((v_numero - 1) * interval '1 month'))::date);
  end loop;

  return v_compra;
end;
$$;

grant execute on function public.criar_compra(uuid, bigint, text, integer, date, boolean) to authenticated;
