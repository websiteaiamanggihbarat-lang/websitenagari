import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // Cek jika ada query parameter logout=success, skip pengecekan session
  const isLogoutRequest = req.nextUrl.searchParams.get('logout') === 'success';
  
  let isLoggedIn = false;
  if (!isLogoutRequest) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Pastikan session valid dengan access_token yang tidak kosong
      isLoggedIn = Boolean(session && session.access_token && session.access_token.length > 0);
    } catch (error) {
      // Jika ada error saat cek session, anggap tidak login
      isLoggedIn = false;
    }
  }

  // Proteksi semua route /admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      // Hapus query parameter logout jika ada
      redirectUrl.searchParams.delete('logout');
      redirectUrl.searchParams.delete('t');
      return NextResponse.redirect(redirectUrl);
    }
    // Biarkan /admin tetap di /admin (tidak redirect)
  }

  // Jika sudah login dan ke /login (dan bukan logout request), arahkan ke halaman admin utama
  if (pathname === "/login" && isLoggedIn && !isLogoutRequest) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.delete('logout');
    url.searchParams.delete('t');
    return NextResponse.redirect(url);
  }
  
  // Jika logout request, pastikan tidak redirect ke admin dan biarkan akses ke /login
  if (pathname === "/login" && isLogoutRequest) {
    // Clear semua cookie Supabase yang mungkin masih ada
    const allCookies = req.cookies.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
        res.cookies.delete(cookie.name);
      }
    });
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};


