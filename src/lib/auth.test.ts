import { describe, expect, it } from 'vitest';

import {
  AccessDeniedError,
  getCurrentAccess,
  requireActiveProfile,
  type AuthClient,
} from './auth';

type ProfileRow = { id: string; nome: unknown; papel: unknown; ativo: unknown };

function fakeClient({
  user = { id: 'current-user' } as { id: string } | null,
  authError = null as unknown,
  rows = [] as ProfileRow[],
  queryError = null as unknown,
} = {}): AuthClient {
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: authError }),
    },
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          maybeSingle: async () => {
            if (!user) throw new Error('An anonymous visitor must not query profiles');
            if (table !== 'perfis' || column !== 'id') {
              return { data: null, error: new Error('Unsupported profile query') };
            }
            const row = rows.find((profile) => profile.id === value);
            const data = row
              ? Object.fromEntries(columns.split(',').map((key) => [key.trim(), row[key.trim() as keyof ProfileRow]]))
              : null;
            return { data, error: queryError };
          },
        }),
      }),
    }),
  };
}

describe('getCurrentAccess', () => {
  it('returns unauthenticated when no verified user exists', async () => {
    expect(await getCurrentAccess(fakeClient({ user: null }))).toEqual({ status: 'unauthenticated' });
  });

  it('rejects identity when getUser reports an authentication error', async () => {
    expect(await getCurrentAccess(fakeClient({ authError: new Error('Invalid session') })))
      .toEqual({ status: 'unauthenticated' });
  });

  it('returns profile_missing instead of using another user profile', async () => {
    const client = fakeClient({ rows: [{ id: 'other-user', nome: 'Outro', papel: 'dono', ativo: true }] });

    expect(await getCurrentAccess(client)).toEqual({ status: 'profile_missing' });
  });

  it('returns inactive without exposing the profile', async () => {
    const client = fakeClient({ rows: [{ id: 'current-user', nome: 'Ana', papel: 'dono', ativo: false }] });

    expect(await getCurrentAccess(client)).toEqual({ status: 'inactive' });
  });

  it.each(['dono', 'atendente'])('returns only the active own profile with papel %s', async (papel) => {
    const client = fakeClient({ rows: [
      { id: 'other-user', nome: 'Outro', papel: 'dono', ativo: true },
      { id: 'current-user', nome: 'Ana', papel, ativo: true },
    ] });

    expect(await getCurrentAccess(client)).toEqual({
      status: 'active',
      profile: { id: 'current-user', nome: 'Ana', papel },
    });
  });

  it('does not grant access when the database returns an error alongside profile data', async () => {
    const client = fakeClient({
      rows: [{ id: 'current-user', nome: 'Ana', papel: 'dono', ativo: true }],
      queryError: new Error('Sensitive upstream details'),
    });

    await expect(getCurrentAccess(client)).rejects.toThrow('Não foi possível verificar o perfil.');
  });

  it.each([
    { id: 'current-user', nome: 'Ana', papel: 'admin', ativo: true },
    { id: 'current-user', nome: 'Ana', papel: 'dono', ativo: null },
    { id: 'current-user', nome: null, papel: 'dono', ativo: true },
  ])('does not grant access to a malformed profile: %j', async (row) => {
    await expect(getCurrentAccess(fakeClient({ rows: [row] })))
      .rejects.toThrow('Não foi possível verificar o perfil.');
  });
});

describe('requireActiveProfile', () => {
  it('returns the active profile for a protected server operation', async () => {
    const client = fakeClient({ rows: [{ id: 'current-user', nome: 'Ana', papel: 'atendente', ativo: true }] });

    expect(await requireActiveProfile(client)).toEqual({ id: 'current-user', nome: 'Ana', papel: 'atendente' });
  });

  it.each([
    { status: 'unauthenticated', client: fakeClient({ user: null }) },
    { status: 'profile_missing', client: fakeClient() },
    { status: 'inactive', client: fakeClient({ rows: [{ id: 'current-user', nome: 'Ana', papel: 'dono', ativo: false }] }) },
  ])('throws a typed access error for $status', async ({ status, client }) => {
    const operation = requireActiveProfile(client);

    await expect(operation).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(operation).rejects.toMatchObject({ status });
  });
});
