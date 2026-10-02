'use client';

import { useMemo, useState } from 'react';
import { criarPreviaCompra } from '../../../lib/compras';
import { criarCompra } from '../actions';

type Cliente = { id: string; nome: string; bloqueado: boolean };

export default function CompraForm({ clientes }: { clientes: Cliente[] }) {
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [clienteId, setClienteId] = useState('');
  const previa = useMemo(() => {
    if (!valor || !primeiroVencimento) return null;
    try { return criarPreviaCompra({ valorTotalCentavos: Number(valor), quantidadeParcelas: Number(parcelas), primeiroVencimento: new Date(`${primeiroVencimento}T00:00:00.000Z`) }); } catch { return null; }
  }, [valor, parcelas, primeiroVencimento]);
  return <form action={criarCompra} className="mt-8 space-y-5"><label className="block">Cliente<select required name="cliente_id" value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border px-3"><option value="">Selecione</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}{cliente.bloqueado ? ' — bloqueado' : ''}</option>)}</select></label><label className="block">Valor (centavos)<input required name="valor_centavos" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="numeric" className="mt-1 min-h-12 w-full rounded-lg border px-3" /></label><label className="block">Descrição (opcional)<input name="descricao" className="mt-1 min-h-12 w-full rounded-lg border px-3" /></label><label className="block">Parcelas<select name="qtd_parcelas" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border px-3">{Array.from({ length: 24 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label><label className="block">Primeiro vencimento<input required type="date" name="primeiro_vencimento" value={primeiroVencimento} onChange={(e) => setPrimeiroVencimento(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border px-3" /></label>{previa && <section aria-label="Prévia das parcelas" className="rounded-lg border p-4"><h2 className="font-semibold">Prévia</h2><ul className="mt-2 space-y-1 text-sm">{previa.valoresCentavos.map((parcela, index) => <li key={index}>Parcela {index + 1}: {parcela} centavos — {previa.vencimentos[index].toISOString().slice(0, 10)}</li>)}</ul></section>}<button className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white">Registrar compra</button></form>;
}
