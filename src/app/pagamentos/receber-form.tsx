'use client';

import { useState } from 'react';
import { registrarPagamento } from './actions';

export default function ReceberForm({ parcela }: { parcela: { parcela_id: string; valor_centavos: number; vencimento: string; saldo_principal_centavos: number } }) {
  const [recibo, setRecibo] = useState('');
  return <form action={async (formData) => { const result = await registrarPagamento(formData); if (result.ok) setRecibo(`Pagamento registrado. ID: ${result.pagamentoId}\nSaldo restante será atualizado após a confirmação.`); }} className="space-y-4"><input type="hidden" name="parcela_id" value={parcela.parcela_id} /><label className="block">Valor recebido (centavos)<input required name="valor_centavos" inputMode="numeric" className="mt-1 min-h-12 w-full rounded-lg border px-3" /></label><label className="block">Forma<select name="forma" defaultValue="pix" className="mt-1 min-h-12 w-full rounded-lg border px-3"><option value="dinheiro">Dinheiro</option><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="outro">Outro</option></select></label><button className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white">Registrar pagamento</button>{recibo && <pre className="whitespace-pre-wrap rounded-lg border p-4" aria-live="polite">{recibo}</pre>}</form>;
}
