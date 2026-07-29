import { connection } from "next/server"
import Link from "next/link"
import { fetchRingkasanJenisKesenianAktif } from "@/lib/kesenian"

export const dynamic = "force-dynamic"

export default async function KesenianDinamis() {
  await connection()

  // Ambil ringkasan jenis kesenian tradisional aktif (maksimal 5 jenis)
  const ringkasanFull = await fetchRingkasanJenisKesenianAktif()
  const ringkasanList = ringkasanFull.slice(0, 5)

  return (
    <div className="group rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] scroll-slide-right">
      {/* Header Container */}
      <div className="mb-6 flex items-center">
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
              d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z"
            />
          </svg>
        </div>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Kesenian Tradisional
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Sanggar seni, tari, dan musik kebudayaan Nagari Aia Manggih Barat.
          </p>
        </div>
      </div>

      {/* Subheader & Tabel Ringkasan Jenis / Empty State */}
      {ringkasanList.length === 0 ? (
        <div className="my-5 rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">
            Belum ada jenis kesenian tradisional aktif.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Silakan kembali lagi nanti untuk melihat pembaruan data kesenian.
          </p>
        </div>
      ) : (
        <div className="my-5 space-y-3">
          <p className="text-sm font-semibold text-gray-800">
            Daftar jenis kesenian tradisional aktif:
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0e8db] border-b border-gray-300">
                  <th className="px-3.5 py-2.5 text-left font-semibold text-gray-900 w-12">
                    No.
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-semibold text-gray-900">
                    Jenis Kesenian
                  </th>
                  <th className="px-3.5 py-2.5 text-right font-semibold text-gray-900 w-24">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {ringkasanList.map((item, index) => (
                  <tr
                    key={item.jenis_slug}
                    className="hover:bg-[#f7f2e8]/60 transition-colors group/row"
                  >
                    <td className="px-3.5 py-2.5 text-gray-600 font-medium">
                      {index + 1}.
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Link
                        href={`/kesenian-tradisional?jenis=${item.jenis_slug}`}
                        aria-label={`Lihat kesenian jenis ${item.jenis_kesenian}`}
                        className="font-semibold text-gray-900 group-hover/row:text-[#2c1b01] flex items-center justify-between hover:underline focus:outline-none focus:ring-2 focus:ring-[#5a3b0d] rounded-md px-1 py-0.5"
                      >
                        <span>{item.jenis_kesenian}</span>
                        <span className="text-xs text-[#5a3b0d] font-normal group-hover/row:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          <span>Lihat</span>
                          <svg
                            className="w-3.5 h-3.5"
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
                        </span>
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-[#2c1b01]">
                      {item.jumlah}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tombol Lihat Semua Kesenian Tradisional */}
      <div className="pt-2">
        <Link
          href="/kesenian-tradisional"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-[#1a1200] hover:to-[#2c1b01] hover:shadow-lg"
        >
          <span>Lihat Semua Kesenian Tradisional</span>
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
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
