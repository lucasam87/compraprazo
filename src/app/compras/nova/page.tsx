import { createClient } from '../../../lib/supabase/server';
import CompraForm from './compra-form';

export default async function NovaCompraPage() {
  const client = await createClient();
  const { data: clientes } = await client.from('clientes').select('id, nome, telefone, bloqueado').eq('ativo', true).order('nome').limit(100);
  return <main className="mx-auto w-full max-w-2xl px-6 py-10"><h1 className="text-3xl font-semibold">Nova compra</h1><CompraForm clientes={clientes ?? []} /></main>;
}
