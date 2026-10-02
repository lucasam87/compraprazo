export type ActiveProfile = {
  id: string;
  nome: string;
  papel: 'dono' | 'atendente';
};

export type AccessResult =
  | { status: 'unauthenticated' }
  | { status: 'profile_missing' }
  | { status: 'inactive' }
  | { status: 'active'; profile: ActiveProfile };

type DeniedStatus = Exclude<AccessResult['status'], 'active'>;

// Accept the request-scoped server client without coupling guards to cookies or redirects.
export type AuthClient = {
  auth: {
    getUser(): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from(table: 'perfis'): {
    select(columns: 'id, nome, papel, ativo'): {
      eq(column: 'id', value: string): {
        maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

export class AccessDeniedError extends Error {
  constructor(public readonly status: DeniedStatus) {
    const messages: Record<DeniedStatus, string> = {
      unauthenticated: 'Autenticação necessária.',
      profile_missing: 'Perfil não encontrado.',
      inactive: 'Perfil inativo.',
    };
    super(messages[status]);
    this.name = 'AccessDeniedError';
  }
}

export async function getCurrentAccess(client: AuthClient): Promise<AccessResult> {
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) return { status: 'unauthenticated' };

  const { data: profile, error } = await client
    .from('perfis')
    .select('id, nome, papel, ativo')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error('Não foi possível verificar o perfil.');
  if (profile === null) return { status: 'profile_missing' };

  if (
    typeof profile !== 'object' ||
    !('id' in profile) || profile.id !== user.id ||
    !('nome' in profile) || typeof profile.nome !== 'string' ||
    !('papel' in profile) || (profile.papel !== 'dono' && profile.papel !== 'atendente') ||
    !('ativo' in profile) || typeof profile.ativo !== 'boolean'
  ) {
    throw new Error('Não foi possível verificar o perfil.');
  }

  if (!profile.ativo) return { status: 'inactive' };

  return {
    status: 'active',
    profile: { id: user.id, nome: profile.nome, papel: profile.papel },
  };
}

export async function requireActiveProfile(client: AuthClient): Promise<ActiveProfile> {
  const access = await getCurrentAccess(client);

  if (access.status !== 'active') throw new AccessDeniedError(access.status);

  return access.profile;
}
