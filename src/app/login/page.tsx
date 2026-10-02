import { getSafeRedirectPath, signIn, type LoginState } from './actions';
import LoginForm from './login-form';

export const metadata = { title: 'Entrar | Crediário' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const safeNext = getSafeRedirectPath(typeof next === 'string' ? next : null);

  async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
    'use server';
    return signIn(formData);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm" aria-labelledby="login-title">
        <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Crediário</p>
        <h1 id="login-title" className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Acesso restrito à equipe autorizada. Entre com seu e-mail e senha.
        </p>
        <LoginForm next={safeNext} action={loginAction} />
      </section>
    </main>
  );
}
