'use server';

import { requireActiveProfile } from '../../lib/auth';
import { createPreviaCompra } from '../../lib/compras';
import { createClient } from '../../lib/supabase/server';

export type CompraActionState = { ok: true; compraId: string } | { ok: false; erro: string };

export async function criarCompra(formData: FormData): Promise<CompraActionState> {
  try {
    const client = await createClient();
    const profile = await requireActiveProfile(client as never);
    const clienteId = String(formData.get('cliente_id') ?? '');
    const valor = Number(formData.get('valor_centavos'));
    const quantidade = Number(formData.get('qtd_parcelas'));
    const primeiro = new Date(`${String(formData.get('primeiro_vencimento') ?? '')}T00:00:00.000Z`);
    const descricao = String(formData.get('descricao') ?? '').trim() || null;
    const autorizar = formData.get('autorizar_excecao') === 'true';
    if (!clienteId) return { ok: false, erro: 'Selecione um cliente.' };
    createPreviaCompra({ valorTotalCentavos: valor, quantidadeParcelas: quantidade, primeiroVencimento: primeiro });
    if (autorizar && profile.papel !== 'dono') return { ok: false, erro: 'Apenas o dono pode autorizar esta compra.' };
    const { data, error } = await client.rpc('criar_compra', { p_cliente: clienteId, p_valor_centavos: valor, p_descricao: descricao, p_qtd_parcelas: quantidade, p_primeiro_vencimento: String(formData.get('primeiro_vencimento')), p_autorizar_excecao: autorizar });
    if (error || typeof data !== 'string') return { ok: false, erro: 'Não foi possível registrar a compra.' };
    return { ok: true, compraId: data };
  } catch { return { ok: false, erro: 'Não foi possível registrar a compra.' }; }
}
