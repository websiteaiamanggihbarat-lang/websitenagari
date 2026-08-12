import { connection } from "next/server"
import Link from "next/link"
import { fetchRekapKategoriKesenianAktif } from "@/lib/kesenian"

export const dynamic = "force-dynamic"

export default async function KesenianDinamis() {
  await connection()

  // Ambil rekap kategori kesenian tradisional aktif
  const ringkasanList = await fetchRekapKategoriKesenianAktif()

  return (
    <div className="public-card-hover p-6 sm:p-8 scroll-slide-right transition-all duration-300 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md">
      {/* Header Container */}
      <div className="flex items-center mb-5">
        <div className="w-11 h-11 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
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
              d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate">
            Kesenian Tradisional
          </h3>
          <p className="text-xs font-semibold text-[#5A3B0D]">
            Kategori &amp; Seni Budaya Nagari
          </p>
        </div>
      </div>

      {/* Subheader & Tabel Ringkasan Kategori / Empty State */}
      {ringkasanList.length === 0 ? (
        <div className="my-5 rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">
            Belum ada kesenian tradisional aktif.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Silakan kembali lagi nanti untuk melihat pembaruan data kesenian.
          </p>
        </div>
      ) : (
        <div className="my-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            Daftar kategori kesenian tradisional aktif:
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[45px_1fr_90px] bg-[#f0e8db] border-b border-gray-300 px-3.5 py-2.5 text-sm font-semibold text-gray-900">
                <div>No.</div>
                <div>Kategori Kesenian</div>
                <div className="text-right">Jumlah</div>
              </div>

              {/* Table Body Rows */}
              <div className="divide-y divide-gray-200 bg-white">
                {ringkasanList.map((item, index) => (
                  <Link
                    key={item.kategori}
                    href={`/kesenian-tradisional?kategori=${item.kategori}`}
                    aria-label={`Lihat kesenian kategori ${item.label}`}
                    className="grid grid-cols-[45px_1fr_90px] items-center px-3.5 py-3 text-sm text-gray-900 hover:bg-[#f7f2e8] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6b4b1d]"
                  >
                    <div className="font-medium text-gray-700">
                      {index + 1}.
                    </div>
                    <div className="font-semibold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
                      {item.label}
                    </div>
                    <div className="text-right font-bold text-[#2c1b01]">
                      {item.jumlah}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
