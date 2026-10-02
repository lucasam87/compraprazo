import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getSupabasePublicEnvironment } from './environment';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { url, anonKey } = getSupabasePublicEnvironment();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const previousCookies = response.cookies.getAll();
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Validate the identity against Auth; cookies alone do not prove identity.
  const { data: { user }, error } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user) && !error;
  const isLogin = request.nextUrl.pathname === '/login';

  if ((!isAuthenticated && !isLogin) || (isAuthenticated && isLogin)) {
    const destination = request.nextUrl.clone();
    destination.pathname = isAuthenticated ? '/' : '/login';
    destination.search = '';
    if (!isAuthenticated) {
      destination.searchParams.set('next', request.nextUrl.pathname);
    }

    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
