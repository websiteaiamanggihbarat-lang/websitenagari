import { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import {
  JenisEntitasKelompokTaniBumnag,
  getDaftarKelompokTaniBumnagAktif,
} from "@/lib/kelompokTaniBumnag"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Kelompok Tani dan BUMNag — Nagari Aia Manggih Barat",
  description:
    "Daftar Kelompok Tani dan Badan Usaha Milik Nagari (BUMNag) di Nagari Aia Manggih Barat.",
}

type PageProps = {
  searchParams: Promise<{
    jenis?: string
  }>
}

export default async function KelompokTaniBumnagIndexPage({
  searchParams,
}: PageProps) {
  await connection()

  const resolvedSearchParams = await searchParams
  const jenisParam = resolvedSearchParams?.jenis || ""

  let selectedJenis: JenisEntitasKelompokTaniBumnag | undefined = undefined
  if (jenisParam === "kelompok_tani" || jenisParam === "bumnag") {
    selectedJenis = jenisParam as JenisEntitasKelompokTaniBumnag
  }
  const isFiltered = Boolean(selectedJenis)

  // Baca daftar entitas aktif
  // Ambil seluruh entitas aktif publik
  const listEntitas = await getDaftarKelompokTaniBumnagAktif(selectedJenis)

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c1b01] to-[#4a3210] text-white shadow-lg mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V7m0 4h4m-4 0H7"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Kelompok Tani dan BUMNag
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Pemberdayaan ekonomi, kelompok tani, dan unit usaha Badan Usaha Milik Nagari Aia Manggih Barat.
            </p>
          </div>

          {/* Filter Tab Selection */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-2xl bg-gray-200/60 backdrop-blur-md border border-gray-300/50 shadow-inner">
              <Link
                href="/kelompok-tani-bumnag"
                replace={isFiltered}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  !selectedJenis
                    ? "bg-[#2c1b01] text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Semua
              </Link>
              <Link
                href="/kelompok-tani-bumnag?jenis=kelompok_tani"
                replace={isFiltered}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  selectedJenis === "kelompok_tani"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Kelompok Tani
              </Link>
              <Link
                href="/kelompok-tani-bumnag?jenis=bumnag"
                replace={isFiltered}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  selectedJenis === "bumnag"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                BUMNag
              </Link>
            </div>
          </div>

          {/* Grid Kartu Entitas */}
          {listEntitas.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
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
              <h2 className="text-lg font-bold text-gray-900">Belum Ada Data Dipublikasikan</h2>
              <p className="mt-1 text-sm text-gray-500">
                Saat ini belum ada data Kelompok Tani atau BUMNag yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {listEntitas.map((item) => {
                return (
                  <Link
                    key={item.id}
                    href={`/kelompok-tani-bumnag/${item.id}`}
                    replace={isFiltered}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    {/* Foto Cover Utama atau Fallback Placeholder */}
                    {item.cover ? (
                      <div className="aspect-[16/10] relative overflow-hidden bg-[#f0e8db]/40">
                        <img
                          src={item.cover.foto_url}
                          alt={item.cover.teks_alt || item.nama_entitas}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-6 text-center">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2 border border-white/20">
                            <svg className="w-6 h-6 text-[#e6ddcf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V7m0 4h4m-4 0H7" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-[#e6ddcf]">Nagari Aia Manggih Barat</span>
                          <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">{item.nama_entitas}</span>
                        </div>
                      </div>
                    )}

                    {/* Body Kartu */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2c1b01] transition-colors mb-1.5">
                        {item.nama_entitas}
                      </h3>

                      {(item.wilayah_kegiatan || item.alamat) && (
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
                          <span className="truncate">{item.wilayah_kegiatan || item.alamat}</span>
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

