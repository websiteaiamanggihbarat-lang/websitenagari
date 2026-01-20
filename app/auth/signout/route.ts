import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();
  const res = NextResponse.json({ ok: true });
  
  const host = request.headers.get('host')?.split(':')[0];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({
          name: c.name,
          value: c.value,
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();

  // Explicitly delete ALL Supabase-related cookies untuk semua browser compatibility
  const allCookies = cookieStore.getAll();
  
  // Daftar semua kemungkinan nama cookie Supabase
  const supabaseCookiePatterns = [
    'sb-',
    'supabase.',
    'supabase-auth',
  ];

  // Hapus semua cookie yang namanya mengandung pattern Supabase
  allCookies.forEach((cookie) => {
    const shouldDelete = supabaseCookiePatterns.some(pattern => 
      cookie.name.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (shouldDelete) {
      // Hapus dengan berbagai kombinasi path dan domain untuk memastikan terhapus
      const paths = ['/'];
      const domains = [undefined, host];
      
      paths.forEach(path => {
        domains.forEach(domain => {
          res.cookies.set(cookie.name, '', {
            expires: new Date(0),
            path: path,
            domain: domain,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
          });
        });
      });
    }
  });

  // Juga hapus cookie dengan nama spesifik yang umum digunakan Supabase
  const knownCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'sb-auth-token',
    'sb-auth-token-code-verifier',
  ];

  knownCookieNames.forEach(name => {
    res.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
    });
  });

  return res;
}

