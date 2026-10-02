'use client';

import { useState } from 'react';
import { registrarPagamento } from './actions';

type Parcela = {
  parcela_id: string;
  valor_centavos: number;
  vencimento: string;
  saldo_principal_centavos: number;
};

export default function ReceberForm({ parcela }: { parcela: Parcela }) {
  const [recibo, setRecibo] = useState('');
  const [erro, setErro] = useState('');
  const [statusCopia, setStatusCopia] = useState('');

  async function copiarRecibo() {
    if (!recibo) return;
    try {
      await navigator.clipboard.writeText(recibo);
      setStatusCopia('Copiado');
    } catch {
      setStatusCopia('Selecione o texto do recibo para copiar.');
    }
  }

  return (
    <form
      action={async (formData) => {
        setRecibo('');
        setErro('');
        setStatusCopia('');
        const result = await registrarPagamento(formData);
        if (result.ok) setRecibo(result.recibo);
        else setErro(result.erro);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="parcela_id" value={parcela.parcela_id} />
      <label className="block">
        Valor recebido (centavos)
        <input required name="valor_centavos" inputMode="numeric" className="mt-1 min-h-12 w-full rounded-lg border px-3" />
      </label>
      <label className="block">
        Forma
        <select name="forma" defaultValue="pix" className="mt-1 min-h-12 w-full rounded-lg border px-3">
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão</option>
          <option value="outro">Outro</option>
        </select>
      </label>
      <button className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white">Registrar pagamento</button>
      {erro ? <p className="text-sm text-red-700" role="alert">{erro}</p> : null}
      {recibo ? (
        <section className="rounded-lg border p-4" aria-label="Recibo do pagamento">
          <pre className="whitespace-pre-wrap" aria-live="polite">{recibo}</pre>
          <button type="button" onClick={copiarRecibo} className="mt-3 rounded-lg border px-3 py-2">Copiar recibo</button>
          {statusCopia ? <p className="mt-2 text-sm" aria-live="polite">{statusCopia}</p> : null}
        </section>
      ) : null}
    </form>
  );
}
