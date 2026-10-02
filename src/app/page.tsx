import { redirect } from 'next/navigation';

import { AccessDeniedError, requireActiveProfile, type ActiveProfile, type AuthClient } from '../lib/auth';
import { resumirHoje } from '../lib/hoje';
import { createClient } from '../lib/supabase/server';

export const metadata = { title: 'Início | Crediário' };

function dataHoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function moeda(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function buscarParcelasAbertas(client: Awaited<ReturnType<typeof createClient>>) {
  const rows: Array<{ vencimento: string; valor_centavos: number; status: string; cliente_id: string }> = [];
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await client
      .from('parcelas')
      .select('vencimento, valor_centavos, status, cliente_id')
      .eq('status', 'aberta')
      .range(inicio, inicio + 999);
    if (error) throw error;
    rows.push(...(data ?? []).map((row) => ({
      vencimento: String(row.vencimento),
      valor_centavos: Number(row.valor_centavos),
      status: String(row.status),
      cliente_id: String(row.cliente_id),
    })));
    if (!data || data.length < 1000) return rows;
  }
}

export default async function Home() {
  let profile: ActiveProfile | undefined;
  let needsLogin = false;
  let errorMessage: string | undefined;

  try {
    const client = await createClient();
    profile = await requireActiveProfile(client as unknown as AuthClient);
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      needsLogin = error.status === 'unauthenticated';
      errorMessage = 'Acesso negado';
    } else {
      errorMessage = 'Não foi possível verificar seu acesso';
    }
  }

  if (needsLogin) redirect('/login');

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">{errorMessage}</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Entre em contato com o responsável pelo sistema para verificar seu acesso.</p>
      </main>
    );
  }

  let resumo = { vencendoHoje: 0, totalPrevistoCentavos: 0, clientesEmAtraso: 0 };
  try {
    const client = await createClient();
    const rows = await buscarParcelasAbertas(client);
    resumo = resumirHoje(rows, dataHoje());
  } catch {
    // O painel continua utilizável mesmo quando a consulta operacional falha.
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Crediário</p>
      <h1 className="text-3xl font-semibold tracking-tight">Olá, {profile.nome}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Resumo de hoje · Perfil: {profile.papel === 'dono' ? 'Dono' : 'Atendente'}</p>
      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Resumo de hoje">
        <article className="rounded-xl border p-5"><p className="text-sm text-zinc-500">Vencendo hoje</p><p className="mt-2 text-3xl font-semibold">{resumo.vencendoHoje}</p></article>
        <article className="rounded-xl border p-5"><p className="text-sm text-zinc-500">Total previsto</p><p className="mt-2 text-3xl font-semibold">{moeda(resumo.totalPrevistoCentavos)}</p></article>
        <article className="rounded-xl border p-5"><p className="text-sm text-zinc-500">Clientes em atraso</p><p className="mt-2 text-3xl font-semibold">{resumo.clientesEmAtraso}</p></article>
      </section>
    </main>
  );
}
