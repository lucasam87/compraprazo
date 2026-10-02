import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Home from './page';

const { createClient, getUser, maybeSingle } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('../lib/supabase/server', () => ({ createClient }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
}));

beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: 'current-user' } }, error: null });
  maybeSingle.mockResolvedValue({ data: { id: 'current-user', nome: 'Ana', papel: 'atendente', ativo: true }, error: null });
  createClient.mockResolvedValue({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  });
});

describe('private home', () => {
  it('redirects an unauthenticated visitor to login', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(Promise.resolve().then(() => Home())).rejects.toThrow('REDIRECT:/login');
  });

  it.each([
    null,
    { id: 'current-user', nome: 'Ana', papel: 'atendente', ativo: false },
  ])('renders access denied instead of a private profile when unavailable', async (profile) => {
    maybeSingle.mockResolvedValue({ data: profile, error: null });

    const html = renderToStaticMarkup(await Home());
    expect(html).toContain('Acesso negado');
    expect(html).not.toContain('Ana');
  });

  it('renders a safe response when verification fails', async () => {
    maybeSingle.mockRejectedValue(new Error('Sensitive upstream details'));

    const html = renderToStaticMarkup(await Home());
    expect(html).toContain('Não foi possível verificar seu acesso');
    expect(html).not.toContain('Sensitive upstream details');
    expect(html).not.toContain('Ana');
  });

  it('identifies an active user by name and role', async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('Ana');
    expect(html).toContain('Atendente');
    expect(html).not.toContain('Acesso negado');
  });
});
