import { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import {
  JenisEntitasKelompokTaniBumnag,
  getDaftarKelompokTaniBumnagAktif,
  getLabelBidang,
  getLabelJenisEntitas,
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

  // Baca daftar entitas aktif
  const listEntitas = await getDaftarKelompokTaniBumnagAktif(selectedJenis)

  // Ketentuan: Data tanpa cover TIDAK boleh tampil di halaman publik
  const listValid = listEntitas.filter((item) => item.cover !== null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-white to-[#f7f3eb]">
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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Kelompok Tani dan BUMNag
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-lg md:text-xl text-gray-600 font-normal max-w-3xl mx-auto leading-relaxed">
              Pemberdayaan ekonomi, kelompok tani, dan unit usaha Badan Usaha Milik Nagari Aia Manggih Barat.
            </p>
          </div>

          {/* Filter Tab Selection */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-2xl bg-gray-200/60 backdrop-blur-md border border-gray-300/50 shadow-inner">
              <Link
                href="/kelompok-tani-bumnag"
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  !selectedJenis
                    ? "bg-[#2c1b01] text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Semua Entitas
              </Link>
              <Link
                href="/kelompok-tani-bumnag?jenis=kelompok_tani"
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
          {listValid.length === 0 ? (
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
                Saat ini belum ada data Kelompok Tani atau BUMNag yang dipublikasikan dengan foto cover utama.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {listValid.map((item) => {
                const cover = item.cover!
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    {/* Foto Cover Utama */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      <img
                        src={cover.foto_url}
                        alt={cover.teks_alt || item.nama_entitas}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md ${
                            item.jenis_entitas === "kelompok_tani"
                              ? "bg-emerald-800/85"
                              : "bg-blue-800/85"
                          }`}
                        >
                          {getLabelJenisEntitas(item.jenis_entitas)}
                        </span>
                      </div>
                    </div>

                    {/* Body Kartu */}
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#2c1b01] transition">
                        {item.nama_entitas}
                      </h2>

                      <p className="mt-1 text-xs font-semibold text-amber-800">
                        {getLabelBidang(item.jenis_entitas)}: {item.bidang_utama}
                      </p>

                      {(item.wilayah_kegiatan || item.alamat) && (
                        <p className="mt-2 flex items-center text-xs font-medium text-gray-500">
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
                          {item.wilayah_kegiatan || item.alamat}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed flex-1">
                        {item.deskripsi}
                      </p>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <Link
                          href={`/kelompok-tani-bumnag/${item.id}`}
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
