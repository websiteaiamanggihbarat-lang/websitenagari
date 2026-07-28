import { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import {
  fetchKesenianAktifDenganCover,
  getLabelKategoriKesenian,
} from "@/lib/kesenian"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Kesenian Tradisional — Nagari Aia Manggih Barat",
  description:
    "Daftar kelompok seni, sanggar, dan kesenian tradisional kebudayaan daerah Nagari Aia Manggih Barat.",
}

export default async function KesenianTradisionalIndexPage() {
  await connection()

  // Read only active kesenian with active cover
  const listKesenian = await fetchKesenianAktifDenganCover()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-white to-[#f7f3eb]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
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

          {/* Grid Kartu Kesenian */}
          {listKesenian.length === 0 ? (
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
              <h2 className="text-lg font-bold text-gray-900">Belum Ada Kesenian Dipublikasikan</h2>
              <p className="mt-1 text-sm text-gray-500">
                Saat ini belum ada data kesenian tradisional yang dipublikasikan.
              </p>
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
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center rounded-lg bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-amber-300">
                        {getLabelKategoriKesenian(item.kategori)}
                      </span>
                    </div>
                  </div>

                  {/* Body Kartu */}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#2c1b01] transition">
                      {item.nama_kesenian}
                    </h2>

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
