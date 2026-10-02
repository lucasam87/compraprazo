'use server';

import { requireActiveProfile } from '../../lib/auth';
import { type FormaPagamento } from '../../lib/pagamentos';
import { createClient } from '../../lib/supabase/server';

export type PagamentoActionState = { ok: true; pagamentoId: string } | { ok: false; erro: string };

export async function registrarPagamento(formData: FormData): Promise<PagamentoActionState> {
  try {
    const client = await createClient();
    await requireActiveProfile(client as never);
    const parcela = String(formData.get('parcela_id') ?? '');
    const valor = Number(formData.get('valor_centavos'));
    const forma = String(formData.get('forma') ?? '') as FormaPagamento;
    const { data, error } = await client.rpc('registrar_pagamento', { p_parcela: parcela, p_valor_recebido_centavos: valor, p_forma: forma });
    if (error || typeof data !== 'string') return { ok: false, erro: 'Não foi possível registrar o pagamento.' };
    return { ok: true, pagamentoId: data };
  } catch { return { ok: false, erro: 'Não foi possível registrar o pagamento.' }; }
}
