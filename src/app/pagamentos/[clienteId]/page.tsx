import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import ReceberForm from '../receber-form';

export default async function PagamentosPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = await params; const client = await createClient();
  const { data: cliente } = await client.from('clientes').select('id, nome').eq('id', clienteId).maybeSingle();
  const { data: parcelas } = await client.from('vw_parcelas_abertas').select('parcela_id, numero, valor_centavos, vencimento, saldo_principal_centavos').eq('cliente_id', clienteId).order('vencimento');
  if (!cliente) return <main className="mx-auto max-w-2xl px-6 py-10"><h1 className="text-2xl font-semibold">Cliente não encontrado</h1></main>;
  return <main className="mx-auto w-full max-w-2xl px-6 py-10"><Link href={`/clientes/${clienteId}`} className="text-sm underline">Voltar ao cliente</Link><h1 className="mt-4 text-3xl font-semibold">Receber pagamento</h1><p className="mt-2 text-zinc-600">{cliente.nome}</p>{parcelas?.length ? <div className="mt-8 space-y-6">{parcelas.map((parcela) => <section key={parcela.parcela_id} className="rounded-lg border p-4"><h2 className="font-semibold">Parcela {parcela.numero}</h2><p className="text-sm text-zinc-600">Vencimento: {parcela.vencimento} · Saldo: {parcela.saldo_principal_centavos} centavos</p><div className="mt-4"><ReceberForm parcela={parcela} /></div></section>)}</div> : <p className="mt-8">Não há parcelas abertas.</p>}</main>;
}
