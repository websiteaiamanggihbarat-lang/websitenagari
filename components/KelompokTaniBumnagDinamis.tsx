import { connection } from "next/server"
import Link from "next/link"
import {
  getKelompokTaniBumnagBeranda,
  getLabelBidang,
  getLabelJenisEntitas,
} from "@/lib/kelompokTaniBumnag"

export const dynamic = "force-dynamic"

export default async function KelompokTaniBumnagDinamis() {
  await connection()

  // Ambil daftar entitas aktif beserta cover aktif (maksimal 6 entitas)
  const listEntitas = await getKelompokTaniBumnagBeranda(6)

  // Filter hanya entitas yang memiliki foto cover aktif
  const listValid = listEntitas.filter((item) => item.cover !== null)

  return (
    <div className="group rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] scroll-slide-left">
      {/* Header Container */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a3210] to-[#2c1b01] shadow-lg shadow-[rgba(44,27,1,0.25)] transition-transform group-hover:scale-110">
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

          <div>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              Kelompok Tani dan BUMNag
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelompok tani masyarakat dan unit bisnis Badan Usaha Milik Nagari Aia Manggih Barat.
            </p>
          </div>
        </div>

        <Link
          href="/kelompok-tani-bumnag"
          className="inline-flex items-center text-xs font-semibold text-[#6b4b1d] hover:text-[#2c1b01] transition"
        >
          Lihat Semua Entitas →
        </Link>
      </div>

      {/* Grid Kartu / Empty State */}
      {listValid.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-8 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Belum ada Kelompok Tani atau BUMNag yang dipublikasikan.</p>
          <p className="mt-1 text-xs text-gray-400">Silakan kembali lagi nanti untuk melihat pembaruan data pemberdayaan ekonomi nagari.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listValid.map((item) => {
            const cover = item.cover!
            return (
              <div
                key={item.id}
                className="group/card flex flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition duration-200"
              >
                {/* Foto Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                  <img
                    src={cover.foto_url}
                    alt={cover.teks_alt || item.nama_entitas}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md text-white shadow-sm backdrop-blur-md ${
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
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="text-base font-bold text-gray-900 line-clamp-1 group-hover/card:text-[#2c1b01] transition">
                    {item.nama_entitas}
                  </h4>

                  <p className="mt-0.5 text-xs font-medium text-amber-800 line-clamp-1">
                    {getLabelBidang(item.jenis_entitas)}: {item.bidang_utama}
                  </p>

                  {(item.wilayah_kegiatan || item.alamat) && (
                    <p className="mt-1.5 flex items-center text-[11px] text-gray-500 line-clamp-1">
                      📍 {item.wilayah_kegiatan || item.alamat}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed flex-1">
                    {item.deskripsi}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href={`/kelompok-tani-bumnag/${item.id}`}
                      className="inline-flex items-center justify-center w-full rounded-lg bg-[#2c1b01] px-3 py-2 text-xs font-semibold text-white shadow hover:bg-[#1a1200] transition"
                    >
                      Lihat Rincian
                      <svg className="ml-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
}
