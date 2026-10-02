import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ busca?: string }> }) {
  const busca = (await searchParams).busca?.trim() ?? '';
  const client = await createClient();
  let query = client.from('clientes').select('id, nome, telefone, bloqueado, ativo').eq('ativo', true).order('nome').limit(50);
  if (busca) query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`);
  const { data: clientes, error } = await query;
  return <main className="mx-auto w-full max-w-3xl px-6 py-10"><div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">Clientes</h1><Link className="rounded-lg bg-zinc-900 px-4 py-3 text-white" href="/clientes/novo">Novo cliente</Link></div><form className="mt-6 flex gap-2"><input name="busca" defaultValue={busca} placeholder="Buscar por nome ou telefone" className="min-h-12 flex-1 rounded-lg border px-3" /><button className="rounded-lg border px-4" type="submit">Buscar</button></form>{error ? <p className="mt-8 text-red-700">Não foi possível carregar os clientes.</p> : clientes?.length ? <ul className="mt-8 divide-y rounded-lg border">{clientes.map((cliente) => <li key={cliente.id} className="p-4"><Link href={`/clientes/${cliente.id}`} className="block"><span className="font-medium">{cliente.nome}</span><span className="block text-sm text-zinc-600">{cliente.telefone || 'Sem telefone'}{cliente.bloqueado ? ' · Bloqueado' : ''}</span></Link></li>)}</ul> : <p className="mt-8 text-zinc-600">Nenhum cliente encontrado.</p>}</main>;
}
