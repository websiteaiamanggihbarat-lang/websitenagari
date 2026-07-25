import { connection } from "next/server"
import Link from "next/link"
import {
  fetchRingkasanKesehatanAktif,
  JenisSlugKesehatan,
} from "@/lib/kesehatan"

function formatAngka(nilai: number | null | undefined): string {
  return Number(nilai || 0).toLocaleString("id-ID")
}

export default async function KesehatanDinamis() {
  await connection()

  const { pendataan, jumlahPerJenis, jumlahKaderPosyandu } =
    await fetchRingkasanKesehatanAktif()

  const pustuCount = jumlahPerJenis.pustu || 0
  const posyanduCount = jumlahPerJenis.posyandu || 0
  const bidanCount = jumlahPerJenis["praktik-bidan"] || 0
  const polindesCount = jumlahPerJenis.polindes || 0
  const puskesmasCount = jumlahPerJenis.puskesmas || 0

  const wcSeptic = pendataan?.wc_septic_tanah ?? 0
  const wcTanpaSeptic = pendataan?.wc_tanpa_septic ?? 0
  const mckSungai = pendataan?.mck_sungai ?? 0

  const daftarSaranaRow = [
    { no: 1, nama: "Pustu", slug: "pustu" as JenisSlugKesehatan, jumlah: pustuCount },
    { no: 2, nama: "Posyandu", slug: "posyandu" as JenisSlugKesehatan, jumlah: posyanduCount },
    { no: 3, nama: "Praktek Bidan", slug: "praktik-bidan" as JenisSlugKesehatan, jumlah: bidanCount },
    { no: 4, nama: "Polindes", slug: "polindes" as JenisSlugKesehatan, jumlah: polindesCount },
  ]

  if (puskesmasCount > 0) {
    daftarSaranaRow.unshift({
      no: 0,
      nama: "Puskesmas",
      slug: "puskesmas" as JenisSlugKesehatan,
      jumlah: puskesmasCount,
    })
    daftarSaranaRow.forEach((item, index) => {
      item.no = index + 1
    })
  }

  const noKaderPosyandu = daftarSaranaRow.length + 1

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-right">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#4a3210] to-[#2c1b01] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
          <svg
            className="w-6 h-6 text-white"
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

        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            Kesehatan
          </h3>
          {pendataan && (
            <p className="text-xs text-gray-500 font-normal">
              Periode {pendataan.tahun_pendataan}
            </p>
          )}
        </div>
      </div>

      <div className="text-gray-700 leading-relaxed space-y-4">
        <div>
          <p className="mb-4">
            Di Nagari Aia Manggih Barat terdapat sarana Kesehatan sebagai berikut:
          </p>

          <div className="overflow-x-auto mb-6 scroll-slide-right">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0e8db] border-b border-gray-300">
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    No.
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    Uraian
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-900">
                    Jumlah
                  </th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                {daftarSaranaRow.map((item) => (
                  <tr key={item.slug} className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
                    <td className="px-3 py-2">{item.no}.</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/kesehatan/${item.slug}`}
                        className="text-gray-900 hover:text-[#2c1b01] hover:underline font-medium flex items-center gap-1 group/link"
                      >
                        <span>{item.nama}</span>
                        <svg className="w-3.5 h-3.5 text-gray-400 group-hover/link:text-[#2c1b01] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">
                      {formatAngka(item.jumlah)}
                    </td>
                  </tr>
                ))}

                <tr>
                  <td className="px-3 py-2">{noKaderPosyandu}.</td>
                  <td className="px-3 py-2">Kader Posyandu</td>
                  <td className="px-3 py-2 text-center font-semibold">
                    {formatAngka(jumlahKaderPosyandu)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="mb-4">
            Sedangkan keadaan Kesehatan lingkungan Masyarakat dapat dilihat sebagai berikut:
          </p>

          <div className="overflow-x-auto scroll-slide-right">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0e8db] border-b border-gray-300">
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    No.
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    Uraian
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-900">
                    Jumlah
                  </th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2">1.</td>
                  <td className="px-3 py-2">
                    Rumah memiliki WC, dengan septic tanah
                  </td>
                  <td className="px-3 py-2 text-center font-semibold">
                    {formatAngka(wcSeptic)}
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2">2.</td>
                  <td className="px-3 py-2">
                    Rumah memiliki WC, tanpa septic tanah
                  </td>
                  <td className="px-3 py-2 text-center font-semibold">
                    {formatAngka(wcTanpaSeptic)}
                  </td>
                </tr>

                <tr>
                  <td className="px-3 py-2">3.</td>
                  <td className="px-3 py-2">
                    Rumah memanfaatkan aliran Sungai untuk MCK
                  </td>
                  <td className="px-3 py-2 text-center font-semibold">
                    {formatAngka(mckSungai)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
