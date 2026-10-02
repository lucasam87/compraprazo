import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicEnvironment } from './environment';

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnvironment();

  return createBrowserClient(
    url,
    anonKey,
  );
}
