'use client';

import { useMemo, useState } from 'react';
import { criarPreviaCompra } from '../../../lib/compras';
import { criarCompra } from '../actions';

type Cliente = { id: string; nome: string; bloqueado: boolean };

export default function CompraForm({ clientes }: { clientes: Cliente[] }) {
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');

  const previa = useMemo(() => {
    if (!valor || !primeiroVencimento) return null;
    try {
      return criarPreviaCompra({
        valorTotalCentavos: Number(valor),
        quantidadeParcelas: Number(parcelas),
        primeiroVencimento: new Date(`${primeiroVencimento}T00:00:00.000Z`),
      });
    } catch {
      return null;
    }
  }, [valor, parcelas, primeiroVencimento]);

  const totalPrevio = previa?.valoresCentavos.reduce((total, item) => total + item, 0) ?? 0;

  return (
    <form action={async (formData) => { await criarCompra(formData); }} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Cliente</span>
        <select name="cliente_id" required className="w-full rounded-lg border p-3">
          <option value="">Selecione</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id} disabled={cliente.bloqueado}>
              {cliente.nome}{cliente.bloqueado ? ' (bloqueado)' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Valor total (centavos)</span>
        <input name="valor_centavos" type="number" min="1" required value={valor} onChange={(event) => setValor(event.target.value)} className="w-full rounded-lg border p-3" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Quantidade de parcelas</span>
        <input name="qtd_parcelas" type="number" min="1" max="120" required value={parcelas} onChange={(event) => setParcelas(event.target.value)} className="w-full rounded-lg border p-3" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Primeiro vencimento</span>
        <input name="primeiro_vencimento" type="date" required value={primeiroVencimento} onChange={(event) => setPrimeiroVencimento(event.target.value)} className="w-full rounded-lg border p-3" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Descrição (opcional)</span>
        <input name="descricao" className="w-full rounded-lg border p-3" />
      </label>

      {previa ? (
        <section className="rounded-lg bg-slate-50 p-4">
          <p className="font-medium">Prévia</p>
          <p>Total: R$ {(totalPrevio / 100).toFixed(2)}</p>
          <ul className="mt-2 text-sm">
            {previa.valoresCentavos.map((valorCentavos, index) => (
              <li key={index}>
                Parcela {index + 1}: R$ {(valorCentavos / 100).toFixed(2)} — {previa.vencimentos[index].toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button type="submit" className="rounded-lg bg-slate-900 px-5 py-3 text-white">Criar compra</button>
    </form>
  );
}
