import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSafeRedirectPath, signIn } from './actions';

const { passwordLogin, createClient } = vi.hoisted(() => ({
  passwordLogin: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('../../lib/supabase/server', () => ({ createClient }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
}));

function validForm(next = '/') {
  const form = new FormData();
  form.set('email', 'pessoa@example.invalid');
  form.set('password', randomUUID());
  form.set('next', next);
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  createClient.mockResolvedValue({ auth: { signInWithPassword: passwordLogin } });
  passwordLogin.mockResolvedValue({ data: { user: { id: 'current-user' }, session: {} }, error: null });
});

describe('getSafeRedirectPath', () => {
  it.each(['/clientes', '/clientes?busca=Ana', '/#inicio'])('preserves internal destination %s', (path) => {
    expect(getSafeRedirectPath(path)).toBe(path);
  });

  it.each([null, '', 'clientes', 'https://externo.example', '//externo.example', '/\\externo.example', '/\n/externo.example'])
    ('falls back to home for unsafe destination %j', (path) => {
      expect(getSafeRedirectPath(path)).toBe('/');
    });
});

describe('signIn', () => {
  it('returns a neutral error for invalid credentials without leaking upstream details', async () => {
    passwordLogin.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Sensitive upstream details' } });

    expect(await signIn(validForm())).toEqual({ error: 'Não foi possível entrar. Verifique e-mail e senha e tente novamente.' });
  });

  it('keeps network failures out of the returned state', async () => {
    passwordLogin.mockRejectedValue(new Error('Sensitive upstream details'));

    expect(await signIn(validForm())).toEqual({ error: 'Não foi possível entrar. Verifique e-mail e senha e tente novamente.' });
  });

  it.each(['email', 'password'])('rejects empty %s before contacting authentication', async (field) => {
    const form = validForm();
    form.set(field, '   ');

    expect(await signIn(form)).toEqual({ error: 'Informe e-mail e senha.' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('redirects a successful login to its internal destination', async () => {
    const form = validForm('/clientes?busca=Ana');

    await expect(signIn(form)).rejects.toThrow('REDIRECT:/clientes?busca=Ana');
    expect(passwordLogin).toHaveBeenCalledWith({ email: form.get('email'), password: form.get('password') });
  });

  it('redirects a successful login with external next to home', async () => {
    await expect(signIn(validForm('https://externo.example'))).rejects.toThrow('REDIRECT:/');
  });
});
