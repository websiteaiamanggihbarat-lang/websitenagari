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

  // Ambil daftar kesenian aktif berdasarkan filter kategori
  const listKesenian = await fetchDaftarKesenianAktifByKategori(kategoriClean)

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Kategori Kesenian */}
          <div className="mb-10 scroll-slide-left">
            <div className="pb-8 border-b border-[#d1c2a0]/60 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-lg bg-[#f0e8db] border border-[#d1c2a0] px-3.5 py-1.5 text-xs font-bold text-[#2c1b01] tracking-wider uppercase mb-3 shadow-2xs">
                  Kategori Kesenian Tradisional
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  {selectedKategoriObj ? selectedKategoriObj.label : (kategoriClean ? getLabelKategoriKesenian(kategoriClean) : "Kesenian Tradisional")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mt-2 leading-relaxed">
                  Daftar sanggar seni dan kebudayaan tradisional kategori <span className="font-semibold text-gray-900">{selectedKategoriObj ? selectedKategoriObj.label : "Nagari"}</span> di Nagari Aia Manggih Barat.
                </p>
              </div>

              {/* Rekap Ringkas Jumlah Kesenian */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-white border border-[#d1c2a0]/70 px-4 py-2 text-center shadow-2xs">
                  <p className="text-xs text-[#2c1b01] font-semibold">Jumlah Kesenian</p>
                  <p className="text-lg font-bold text-[#2c1b01]">
                    {listKesenian.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Kartu Kesenian / Empty State */}
          {listKesenian.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-[#d1c2a0]/70 bg-white p-8 text-center shadow-xs my-12">
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
                <Link
                  key={item.id}
                  href={`/kesenian-tradisional/${item.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  {/* Foto Cover */}
                  {item.cover ? (
                    <div className="aspect-[16/10] relative overflow-hidden bg-[#f0e8db]/40">
                      <img
                        src={item.cover.foto_url}
                        alt={item.cover.teks_alt || item.nama_kesenian}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-6 text-center">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2 border border-white/20">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-[#e6ddcf]">Nagari Aia Manggih Barat</span>
                        <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">{item.nama_kesenian}</span>
                      </div>
                    </div>
                  )}

                  {/* Body Kartu */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2c1b01] transition-colors mb-1.5">
                      {item.nama_kesenian}
                    </h3>

                    {item.alamat && (
                      <p className="text-xs font-medium text-[#5a3b0d] flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-[#5a3b0d] shrink-0"
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
                        <span className="truncate">{item.alamat}</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
