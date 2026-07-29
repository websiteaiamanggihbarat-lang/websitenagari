import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

async function periksaAdmin() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Environment Supabase belum tersedia."
    )
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                )
              }
            )
          } catch {
            /*
             * Cookie tidak dapat diubah langsung
             * dari Server Component.
             * Pembaruan sesi ditangani oleh
             * proxy atau middleware autentikasi.
             */
          }
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  return user
}

export default async function AdminPage() {
  const user = await periksaAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2c1b01] to-[#1a1200] shadow-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Admin Panel
                </h1>

                <p className="mt-0.5 text-sm text-gray-600">
                  Nagari Aia Manggih Barat
                </p>

                {user.email && (
                  <p className="mt-1 break-all text-xs text-gray-400">
                    Login sebagai: {user.email}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-[#b6a587] hover:bg-[#f7f2e8] sm:w-auto"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
                />
              </svg>

              Lihat Beranda
            </Link>
          </div>

          <div className="mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#b6a587]" />
        </div>

        {/* Penjelasan */}
        <div className="mb-6 rounded-xl border border-[#e3d8c5] bg-white/70 p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Pilih menu pengelolaan
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Gunakan menu di bawah untuk menambah,
            mengubah, menghapus, dan
            mempublikasikan data website.
          </p>
        </div>

        {/* Menu Admin */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Kelola Berita */}
          <Link
            href="/admin/tambah-berita"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 3v2m6-2v2m-6 4h10"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
              Kelola Berita
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Tambah, edit, hapus, dan
              publikasikan berita Nagari.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-blue-600">
              Buka pengelolaan berita

              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Kelola Informasi Penduduk */}
          <Link
            href="/admin/informasi-penduduk"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#6b4b1d] hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#6b4b1d] to-[#2c1b01] shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4m-4-10a4 4 0 110-8 4 4 0 010 8zm-7 2a3 3 0 110-6 3 3 0 010 6z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-[#5a3b0d]">
              Kelola Informasi Penduduk
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Tambah, edit, hapus, dan
              aktifkan data penduduk yang
              ditampilkan pada Beranda.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-[#5a3b0d]">
              Buka informasi penduduk

              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Kelola Sarana Pendidikan */}
          <Link
            href="/admin/sarana-pendidikan"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-600 hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-emerald-700">
              Kelola Sarana Pendidikan
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kelola pendataan tahunan,
              daftar sekolah, foto, jumlah
              siswa, guru, dan lokasi sarana.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-emerald-700">
              Buka sarana pendidikan

              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Kelola Kesehatan */}
          <Link
            href="/admin/kesehatan"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600 shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-red-700">
              Kelola Kesehatan
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kelola pendataan tahunan, 3 indikator sanitasi lingkungan, sarana, dan tenaga kesehatan.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-red-600">
              Buka pengelolaan kesehatan
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Kelola Kesenian Tradisional */}
          <Link
            href="/admin/kesenian-tradisional"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-600 hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#4a3210] to-[#2c1b01] shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-[#4a3210]">
              Kelola Kesenian Tradisional
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kelola daftar kesenian, sanggar, kelompok seni, deskripsi, lokasi, dan galeri foto.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-[#6b4b1d]">
              Buka kesenian tradisional
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Kelola Kelompok Tani dan BUMNag */}
          <Link
            href="/admin/kelompok-tani-bumnag"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-600 hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-[#2c1b01] shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V7m0 4h4m-4 0H7"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-emerald-700">
              Kelompok Tani dan BUMNag
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kelola data utama, pimpinan, bidang, foto galeri, serta produk/unit usaha Kelompok Tani dan BUMNag.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-emerald-700">
              Buka Kelompok Tani & BUMNag
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Kelola Peta Nagari */}
          <Link
            href="/admin/peta-nagari"
            className="group flex min-h-[220px] flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#4a3210] hover:shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#4a3210] to-[#2c1b01] shadow-md transition-transform group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-[#4a3210]">
              Kelola Peta Nagari
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Tambah dan kelola peta administrasi, kebencanaan, serta peta tematik Nagari.
            </p>

            <div className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-[#6b4b1d]">
              Buka pengelolaan peta
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}