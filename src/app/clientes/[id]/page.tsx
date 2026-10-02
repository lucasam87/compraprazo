import { notFound } from 'next/navigation';
import ClienteForm from '../cliente-form';
import { createClient } from '../../../lib/supabase/server';
import { inativarCliente } from '../actions';

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const client = await createClient();
  const { data: cliente } = await client.from('clientes').select('id, nome, telefone, observacoes, limite_centavos, ativo').eq('id', id).maybeSingle();
  if (!cliente) notFound();
  return <main className="mx-auto w-full max-w-2xl px-6 py-10"><h1 className="text-3xl font-semibold">Editar cliente</h1>{cliente.ativo ? <><ClienteForm initial={cliente} /><form action={inativarCliente} className="mt-8"><input type="hidden" name="id" value={id} /><button className="rounded-lg border border-red-300 px-4 py-3 text-red-700">Inativar cliente</button></form></> : <p className="mt-6">Este cliente está inativo.</p>}</main>;
}
