import { redirect } from 'next/navigation';

import { createClient } from '../../lib/supabase/server';

export type LoginState = { error?: string };

export function getSafeRedirectPath(value: FormDataEntryValue | null): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return '/';
  }

  return value;
}

export async function signIn(formData: FormData): Promise<LoginState> {
  'use server';

  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
    return { error: 'Informe e-mail e senha.' };
  }

  try {
    const client = await createClient();
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      return { error: 'Não foi possível entrar. Verifique e-mail e senha e tente novamente.' };
    }
  } catch {
    return { error: 'Não foi possível entrar. Verifique e-mail e senha e tente novamente.' };
  }

  redirect(getSafeRedirectPath(formData.get('next')));
}
