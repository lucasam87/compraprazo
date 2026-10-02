import { redirect } from 'next/navigation';

import { AccessDeniedError, requireActiveProfile, type ActiveProfile, type AuthClient } from '../lib/auth';
import { createClient } from '../lib/supabase/server';

export const metadata = { title: 'Início | Crediário' };

export default async function Home() {
  let profile: ActiveProfile | undefined;
  let needsLogin = false;
  let errorMessage: string | undefined;

  try {
    const client = await createClient();
    // Untyped Supabase query generics exceed TypeScript's structural-comparison depth.
    // The guard accepts only this narrow API and validates the returned profile at runtime.
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
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Entre em contato com o responsável pelo sistema para verificar seu acesso.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Crediário</p>
      <h1 className="text-3xl font-semibold tracking-tight">Olá, {profile.nome}</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Seu acesso está ativo. Perfil: {profile.papel === 'dono' ? 'Dono' : 'Atendente'}.
      </p>
    </main>
  );
}
