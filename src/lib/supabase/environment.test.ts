import { describe, expect, it } from 'vitest';

import { getSupabasePublicEnvironment } from './environment';

describe('getSupabasePublicEnvironment', () => {
  it('returns the public URL and anon key needed by Supabase clients', () => {
    expect(
      getSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({
      url: 'https://project.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('identifies the missing public variable before a client is created', () => {
    expect(() =>
      getSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toThrow('NEXT_PUBLIC_SUPABASE_URL');
  });
});
