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
    <div className="public-card-hover p-6 sm:p-8 scroll-slide-right transition-all duration-300 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md">
      {/* 1. Header Kartu */}
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate">
            Kesehatan
          </h3>
          <p className="text-xs font-semibold text-[#5A3B0D]">
            Posyandu &amp; Sarana Kesehatan Nagari
          </p>
        </div>
      </div>

      <div className="text-gray-700 leading-relaxed space-y-5">
        {/* 2. Deskripsi Singkat */}
        <p>
          Di Nagari Aia Manggih Barat terdapat sarana dan indikator kesehatan masyarakat sebagai berikut:
        </p>

        {/* 3. Tiga Kotak Statistik Sanitasi (WC Septic, WC Tanpa Septic, MCK Sungai) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-4">
          {/* WC Septic */}
          <div className="flex flex-col items-center justify-center min-h-[100px] rounded-xl border border-[#e6ddcf] bg-gradient-to-b from-[#fdfbf7] to-[#f7f2e8] p-4 text-center shadow-sm hover:border-[#b6a587] transition-colors">
            <div className="flex items-center justify-center min-h-[24px] text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
              WC Septic
            </div>
            <div className="flex items-baseline justify-center gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#2c1b01] leading-none">
                {formatAngka(wcSeptic)}
              </span>
              <span className="text-xs font-medium text-gray-500 leading-none">
                rumah
              </span>
            </div>
          </div>

          {/* WC Tanpa Septic */}
          <div className="flex flex-col items-center justify-center min-h-[100px] rounded-xl border border-[#e6ddcf] bg-gradient-to-b from-[#fdfbf7] to-[#f7f2e8] p-4 text-center shadow-sm hover:border-[#b6a587] transition-colors">
            <div className="flex items-center justify-center min-h-[24px] text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
              WC Tanpa Septic
            </div>
            <div className="flex items-baseline justify-center gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#2c1b01] leading-none">
                {formatAngka(wcTanpaSeptic)}
              </span>
              <span className="text-xs font-medium text-gray-500 leading-none">
                rumah
              </span>
            </div>
          </div>

          {/* MCK Sungai */}
          <div className="flex flex-col items-center justify-center min-h-[100px] rounded-xl border border-[#e6ddcf] bg-gradient-to-b from-[#fdfbf7] to-[#f7f2e8] p-4 text-center shadow-sm hover:border-[#b6a587] transition-colors">
            <div className="flex items-center justify-center min-h-[24px] text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
              MCK Sungai
            </div>
            <div className="flex items-baseline justify-center gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#2c1b01] leading-none">
                {formatAngka(mckSungai)}
              </span>
              <span className="text-xs font-medium text-gray-500 leading-none">
                rumah
              </span>
            </div>
          </div>
        </div>

        {/* 4. Tabel Daftar Jenis Sarana Kesehatan */}
        <div className="border-t border-gray-200 pt-4">
          <p className="mb-3 font-semibold text-gray-900">
            Daftar sarana & tenaga kesehatan:
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_80px] bg-[#f0e8db] border-b border-gray-300 px-3.5 py-2.5 text-sm font-semibold text-gray-900">
                <div>No.</div>
                <div>Jenis Sarana</div>
                <div className="text-center">Jumlah</div>
              </div>

              {/* Table Body Rows */}
              <div className="divide-y divide-gray-200 bg-white">
                {daftarSaranaRow.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/kesehatan/${item.slug}`}
                    aria-label={`Lihat rincian sarana kesehatan ${item.nama}`}
                    className="grid grid-cols-[40px_1fr_80px] items-center px-3.5 py-3 text-sm text-gray-900 hover:bg-[#f7f2e8] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6b4b1d]"
                  >
                    <div className="font-medium text-gray-700">{item.no}.</div>
                    <div className="font-semibold text-gray-900">{item.nama}</div>
                    <div className="text-center font-semibold text-gray-900">
                      {formatAngka(item.jumlah)}
                    </div>
                  </Link>
                ))}

                {/* Kader Posyandu Row (Non-clickable info row) */}
                <div className="grid grid-cols-[40px_1fr_80px] items-center px-3.5 py-3 text-sm bg-white text-gray-900">
                  <div className="font-medium text-gray-700">{noKaderPosyandu}.</div>
                  <div className="font-semibold text-gray-900">Kader Posyandu</div>
                  <div className="text-center font-semibold text-gray-900">
                    {formatAngka(jumlahKaderPosyandu)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {pendataan?.sumber_data && (
          <div className="pt-2 text-xs text-gray-500">
            Sumber data: <span className="font-medium text-gray-700">{pendataan.sumber_data}</span>
          </div>
        )}
      </div>
    </div>
  )
}
