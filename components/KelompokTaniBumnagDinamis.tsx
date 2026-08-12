import { connection } from "next/server"
import Link from "next/link"
import { getKelompokTaniBumnagBeranda } from "@/lib/kelompokTaniBumnag"

export const dynamic = "force-dynamic"

export default async function KelompokTaniBumnagDinamis() {
  await connection()

  // Ambil maksimal 5 data terbaru gabungan Kelompok Tani dan BUMNag
  const listEntitas = await getKelompokTaniBumnagBeranda(5)

  return (
    <div className="relative group/outer public-card-hover p-6 sm:p-8 scroll-slide-left rounded-2xl bg-white border border-[#EFEBE4] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md cursor-pointer overflow-hidden">
      {/* Full-Card Overlay Link: Covers entire outer card (padding, header, empty space) */}
      <Link
        href="/kelompok-tani-bumnag"
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label="Lihat seluruh Kelompok Tani dan BUMNag"
      />

      {/* Header Visual Layer */}
      <div className="relative z-10 pointer-events-none mb-5 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-11 h-11 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30 group-hover/outer:scale-105 transition-transform">
            <svg
              className="w-5.5 h-5.5"
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

          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate group-hover/outer:text-[#2C1B01] transition-colors">
              Kelompok Tani dan BUMNag
            </h3>
            <p className="text-xs font-semibold text-[#5A3B0D]">
              Kelompok Tani &amp; Unit Bisnis BUMNag
            </p>
          </div>
        </div>
      </div>

      {/* List Compact Preview 5 Data dengan Direct Detail Link / Empty State */}
      {listEntitas.length === 0 ? (
        <div className="relative z-10 pointer-events-none rounded-xl border border-gray-200 bg-white/80 p-6 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Belum ada Kelompok Tani atau BUMNag yang dipublikasikan.</p>
          <p className="mt-1 text-xs text-gray-400">Silakan kembali lagi nanti untuk melihat pembaruan data pemberdayaan ekonomi nagari.</p>
        </div>
      ) : (
        <div className="relative z-20 divide-y divide-gray-100/80 rounded-xl border border-gray-100 bg-white/60 overflow-hidden">
          {listEntitas.map((item, index) => (
            <Link
              key={item.id}
              href={`/kelompok-tani-bumnag/${item.id}`}
              className="group/row flex items-center justify-between px-3.5 py-3 transition-all duration-200 hover:bg-[#FAF7F2] hover:pl-4 focus-visible:outline-2 focus-visible:outline-[#2C1B01] focus-visible:rounded-lg"
            >
              <div className="flex items-center min-w-0 flex-1 pr-3">
                <span className="text-sm font-bold text-[#5A3B0D] mr-2.5 shrink-0 tabular-nums">
                  {index + 1}.
                </span>
                <span className="text-sm font-semibold text-gray-800 min-w-0 break-words line-clamp-1 group-hover/row:text-[#2C1B01] transition-colors">
                  {item.nama_entitas}
                </span>
              </div>

              <div className="flex items-center shrink-0 ml-2">
                {item.tahun_berdiri ? (
                  <span className="text-xs font-bold text-[#5A3B0D]/80 tabular-nums mr-3">
                    {item.tahun_berdiri}
                  </span>
                ) : null}
                <svg
                  className="w-4 h-4 text-gray-400 group-hover/row:text-[#2C1B01] group-hover/row:translate-x-1 transition-all duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}




