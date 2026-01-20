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

  let isLoggedIn = false;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    isLoggedIn = Boolean(session && session.access_token);
  } catch (error) {
    // Jika ada error saat cek session, anggap tidak login
    isLoggedIn = false;
  }

  // Proteksi semua route /admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // Biarkan /admin tetap di /admin (tidak redirect)
  }

  // Jika sudah login dan ke /login, arahkan ke halaman admin utama
  if (pathname === "/login" && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};


