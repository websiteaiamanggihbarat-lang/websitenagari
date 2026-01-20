import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();
  
  const host = request.headers.get('host')?.split(':')[0];
  const origin = request.headers.get('origin') || `https://${host}`;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({
          name: c.name,
          value: c.value,
        }));
      },
      setAll(cookiesToSet) {
        // No-op karena kita akan handle sendiri
      },
    },
  });

  // Sign out dari Supabase
  await supabase.auth.signOut();

  // Buat redirect response ke login dengan query parameter untuk bypass cache
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('logout', 'success');
  loginUrl.searchParams.set('t', Date.now().toString());
  
  const res = NextResponse.redirect(loginUrl);

  // Explicitly delete ALL Supabase-related cookies untuk semua browser compatibility
  const allCookies = cookieStore.getAll();
  
  // Dapatkan semua cookie yang ada untuk dihapus
  const cookieNamesToDelete = new Set<string>();
  
  // Daftar semua kemungkinan nama cookie Supabase
  const supabaseCookiePatterns = [
    'sb-',
    'supabase.',
    'supabase-auth',
  ];

  // Kumpulkan semua nama cookie yang perlu dihapus
  allCookies.forEach((cookie) => {
    const shouldDelete = supabaseCookiePatterns.some(pattern => 
      cookie.name.toLowerCase().includes(pattern.toLowerCase())
    );
    if (shouldDelete) {
      cookieNamesToDelete.add(cookie.name);
    }
  });

  // Tambahkan cookie names yang diketahui Supabase auth-helpers-nextjs
  const knownCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'sb-auth-token',
    'sb-auth-token-code-verifier',
    'sb-auth-token-code-challenge',
  ];
  knownCookieNames.forEach(name => cookieNamesToDelete.add(name));

  // Hapus semua cookie yang terkumpul dengan berbagai kombinasi
  cookieNamesToDelete.forEach(cookieName => {
    // Hapus dengan berbagai kombinasi untuk memastikan terhapus di semua browser
    const paths = ['/', '/admin', '/login'];
    const domains: (string | undefined)[] = [undefined];
    
    // Jika ada host dan bukan localhost, tambahkan domain
    if (host && host !== 'localhost' && !host.includes('127.0.0.1')) {
      domains.push(host);
      domains.push(`.${host}`);
    }
    
    paths.forEach(path => {
      domains.forEach(domain => {
        const cookieOptions: {
          expires: Date;
          path: string;
          domain?: string;
          httpOnly: boolean;
          sameSite: 'lax' | 'strict' | 'none';
          secure: boolean;
          maxAge: number;
        } = {
          expires: new Date(0),
          path: path,
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 0,
        };
        if (domain) {
          cookieOptions.domain = domain;
        }
        res.cookies.set(cookieName, '', cookieOptions);
      });
    });
  });

  // Tambahkan header untuk memastikan tidak ada cache
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  return res;
}

