'use client';

import { useActionState } from 'react';

import type { LoginState } from './actions';

type LoginFormProps = {
  next: string;
  action: (previousState: LoginState, formData: FormData) => Promise<LoginState>;
};

export default function LoginForm({ next, action }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-8 space-y-5" aria-busy={pending}>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-800 dark:border-zinc-700 dark:focus:outline-zinc-200"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-800 dark:border-zinc-700 dark:focus:outline-zinc-200"
        />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-800 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus:outline-zinc-200"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
