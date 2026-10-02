import { NextRequest } from 'next/server';
// This installed Next.js package still exports the matcher utility under its old name.
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from 'next/experimental/testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CookieOptions } from '@supabase/ssr';

import { config, proxy } from '../../proxy';
import { updateSession } from './proxy';

const auth = vi.hoisted(() => ({
  user: null as { id: string } | null,
  error: null as { message: string } | null,
  incomingCookies: [] as { name: string; value: string }[],
  refreshedCookies: [] as { name: string; value: string; options: CookieOptions }[][],
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    { cookies }: {
      cookies: {
        getAll(): { name: string; value: string }[];
        setAll(values: { name: string; value: string; options: CookieOptions }[]): void;
      };
    },
  ) => ({
    auth: {
      getUser: async () => {
        auth.incomingCookies = cookies.getAll();
        auth.refreshedCookies.forEach((values) => cookies.setAll(values));
        return { data: { user: auth.user }, error: auth.error };
      },
      getSession: () => {
        throw new Error('Session cookies cannot verify identity');
      },
    },
  }),
}));

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test-key');
  auth.user = null;
  auth.error = null;
  auth.incomingCookies = [];
  auth.refreshedCookies = [];
});

afterEach(() => vi.unstubAllEnvs());

describe('proxy matcher', () => {
  it.each(['/', '/login', '/clientes', '/api/clientes', '/login-admin'])('protects application path %s', (url) => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(true);
  });

  it.each([
    '/_next/static/chunks/app.js',
    '/_next/image?url=%2Flogo.png&w=64&q=75',
    '/favicon.ico',
    '/logo.svg',
    '/photo.jpg',
    '/styles.css',
    '/fonts/site.woff2',
  ])('skips static asset %s', (url) => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(false);
  });
});

describe('SSR session and route protection', () => {
  it('allows an unauthenticated visitor to reach login without a loop', async () => {
    const response = await proxy(new NextRequest('https://crediario.example/login?next=%2Fclientes'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('redirects an unauthenticated visitor to login with only the requested pathname', async () => {
    const response = await proxy(new NextRequest('https://crediario.example/clientes?busca=Maria'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://crediario.example/login?next=%2Fclientes');
  });

  it('protects the home page', async () => {
    const response = await proxy(new NextRequest('https://crediario.example/'));

    expect(response.headers.get('location')).toBe('https://crediario.example/login?next=%2F');
  });

  it('does not treat a login prefix as a public route', async () => {
    const response = await proxy(new NextRequest('https://crediario.example/login-admin'));

    expect(response.headers.get('location')).toBe('https://crediario.example/login?next=%2Flogin-admin');
  });

  it('allows a server-verified user through a protected route', async () => {
    auth.user = { id: 'verified-user' };
    const response = await proxy(new NextRequest('https://crediario.example/clientes'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('redirects an authenticated login visitor to home without carrying query parameters', async () => {
    auth.user = { id: 'verified-user' };
    const response = await proxy(new NextRequest('https://crediario.example/login?next=https://external.example'));

    expect(response.headers.get('location')).toBe('https://crediario.example/');
  });

  it('rejects a user when server validation returns an error', async () => {
    auth.user = { id: 'unverified-user' };
    auth.error = { message: 'Invalid session' };
    const response = await proxy(new NextRequest('https://crediario.example/clientes'));

    expect(response.headers.get('location')).toBe('https://crediario.example/login?next=%2Fclientes');
  });

  it('forwards renewed cookies to server rendering and the browser with their options', async () => {
    auth.user = { id: 'verified-user' };
    auth.refreshedCookies = [[{ name: 'sb-session', value: 'renewed-test-value', options: { path: '/', httpOnly: true, sameSite: 'lax', secure: true } }]];
    const request = new NextRequest('https://crediario.example/clientes', { headers: { cookie: 'sb-session=old-test-value' } });
    const response = await updateSession(request);

    expect(auth.incomingCookies).toEqual([{ name: 'sb-session', value: 'old-test-value' }]);
    expect(request.cookies.get('sb-session')?.value).toBe('renewed-test-value');
    expect(response.headers.get('x-middleware-request-cookie')).toContain('sb-session=renewed-test-value');
    expect(response.cookies.get('sb-session')).toMatchObject({ value: 'renewed-test-value', path: '/', httpOnly: true, sameSite: 'lax', secure: true });
  });

  it('preserves all refresh batches when sending a login redirect', async () => {
    auth.refreshedCookies = [
      [{ name: 'sb-session.0', value: '', options: { path: '/', maxAge: 0 } }],
      [{ name: 'sb-session.1', value: '', options: { path: '/', maxAge: 0 } }],
    ];
    const response = await updateSession(new NextRequest('https://crediario.example/clientes'));

    expect(response.headers.get('location')).toBe('https://crediario.example/login?next=%2Fclientes');
    expect(response.cookies.get('sb-session.0')).toMatchObject({ value: '', maxAge: 0 });
    expect(response.cookies.get('sb-session.1')).toMatchObject({ value: '', maxAge: 0 });
  });

  it('preserves renewed cookies when sending an authenticated visitor home', async () => {
    auth.user = { id: 'verified-user' };
    auth.refreshedCookies = [[{ name: 'sb-session', value: 'renewed-test-value', options: { path: '/' } }]];
    const response = await proxy(new NextRequest('https://crediario.example/login'));

    expect(response.headers.get('location')).toBe('https://crediario.example/');
    expect(response.cookies.get('sb-session')?.value).toBe('renewed-test-value');
  });
});
