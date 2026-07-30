import { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import {
  PILIHAN_KATEGORI_KESENIAN,
  fetchDaftarKesenianAktifByKategori,
  getLabelKategoriKesenian,
} from "@/lib/kesenian"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Kesenian Tradisional — Nagari Aia Manggih Barat",
  description:
    "Daftar kelompok seni, sanggar, dan kesenian tradisional kebudayaan daerah Nagari Aia Manggih Barat.",
}

interface PageProps {
  searchParams: Promise<{
    kategori?: string | string[]
  }>
}

export default async function KesenianTradisionalIndexPage(props: PageProps) {
  await connection()

  const searchParams = await props.searchParams
  const kategoriParamRaw = Array.isArray(searchParams?.kategori)
    ? searchParams.kategori[0]
    : searchParams?.kategori

  const kategoriClean = kategoriParamRaw?.trim().toLowerCase() || ""

  // Cari objek kategori yang terpilih jika ada
  const selectedKategoriObj = PILIHAN_KATEGORI_KESENIAN.find(
    (k) => k.value === kategoriClean
  )
  const isFiltered = Boolean(kategoriClean && selectedKategoriObj)

  // Ambil daftar kesenian aktif berdasarkan filter kategori
  const listKesenian = await fetchDaftarKesenianAktifByKategori(kategoriClean)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-white to-[#f7f3eb]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c1b01] to-[#4a3210] text-white shadow-lg mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z"
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Kesenian Tradisional Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-lg md:text-xl text-gray-600 font-normal max-w-3xl mx-auto leading-relaxed">
              Warisan budaya, sanggar seni, dan kelompok kesenian tradisional di Nagari Aia Manggih Barat.
            </p>
          </div>

          {/* Filter Baris Kategori Kesenian */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 overflow-x-auto max-w-full pb-2">
              {/* Tombol Semua */}
              <Link
                href="/kesenian-tradisional"
                aria-current={!kategoriClean ? "page" : undefined}
                className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  !kategoriClean
                    ? "bg-[#2c1b01] text-white shadow-md border border-[#2c1b01]"
                    : "bg-white/90 text-gray-700 hover:bg-[#f7f2e8] hover:text-[#2c1b01] border border-gray-200/80 shadow-sm"
                }`}
              >
                Semua
              </Link>

              {/* List Kategori */}
              {PILIHAN_KATEGORI_KESENIAN.map((item) => {
                const isActive = kategoriClean === item.value
                return (
                  <Link
                    key={item.value}
                    href={`/kesenian-tradisional?kategori=${item.value}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#2c1b01] text-white shadow-md border border-[#2c1b01]"
                        : "bg-white/90 text-gray-700 hover:bg-[#f7f2e8] hover:text-[#2c1b01] border border-gray-200/80 shadow-sm"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Judul Konteks Hasil Filter & Count */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isFiltered
                ? `Kesenian Kategori ${selectedKategoriObj?.label}`
                : "Semua Kesenian Tradisional"}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              {listKesenian.length} kesenian ditemukan
            </span>
          </div>

          {/* Grid Kartu Kesenian / Empty State */}
          {listKesenian.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm my-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">
                {kategoriClean
                  ? "Belum Ada Kesenian Aktif Untuk Kategori Ini"
                  : "Belum Ada Kesenian Dipublikasikan"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {kategoriClean
                  ? "Tidak ada data kesenian tradisional aktif yang cocok dengan kategori pilihan."
                  : "Saat ini belum ada data kesenian tradisional yang dipublikasikan."}
              </p>
              {kategoriClean && (
                <div className="mt-6">
                  <Link
                    href="/kesenian-tradisional"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#4a3210] transition"
                  >
                    Lihat Semua Kesenian →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {listKesenian.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md hover:shadow-xl transition-all duration-300"
                >
                  {/* Foto Cover */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                    {item.cover ? (
                      <img
                        src={item.cover.foto_url}
                        alt={item.cover.teks_alt || item.nama_kesenian}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        Tidak ada foto
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-lg bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-amber-300">
                        {getLabelKategoriKesenian(item.kategori)}
                      </span>
                    </div>
                  </div>

                  {/* Body Kartu */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#2c1b01] transition">
                      {item.nama_kesenian}
                    </h3>

                    {item.alamat && (
                      <p className="mt-1 flex items-center text-xs font-medium text-amber-800">
                        <svg
                          className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-amber-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {item.alamat}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed flex-1">
                      {item.deskripsi_singkat}
                    </p>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <Link
                        href={`/kesenian-tradisional/${item.id}`}
                        className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-br from-[#2c1b01] to-[#4a3210] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-[#4a3210] hover:to-[#2c1b01] transition duration-200"
                      >
                        Lihat Rincian
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
