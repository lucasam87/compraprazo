type PublicEnvironment = Record<string, string | undefined>;

export function getSupabasePublicEnvironment(environment: PublicEnvironment = process.env) {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Variável obrigatória ausente: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!anonKey) {
    throw new Error('Variável obrigatória ausente: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, anonKey };
}
