import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  fetchDetailSaranaKesehatan,
  fetchFasilitasKesehatanBySaranaId,
  fetchTenagaKesehatanBySaranaId,
  fetchIndikatorTambahanBySaranaId,
  fetchPendataanKesehatanAktif,
  PILIHAN_JENIS_SARANA,
  JenisSlugKesehatan,
} from "@/lib/kesehatan"

export const dynamic = "force-dynamic"
export const revalidate = 0

function formatAngka(nilai: number | null | undefined): string {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function getLabelStatusOperasional(status: string): string {
  switch (status) {
    case "aktif":
      return "Aktif Beroperasi"
    case "tidak_aktif":
      return "Tidak Aktif"
    case "dalam_pembangunan":
      return "Dalam Pembangunan"
    default:
      return "Lainnya"
  }
}

function getWarnaStatusOperasional(status: string): string {
  switch (status) {
    case "aktif":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "dalam_pembangunan":
      return "bg-amber-100 text-amber-800 border-amber-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

type PageProps = {
  params: Promise<{
    jenis: string
    saranaId: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const jenisSlug = resolvedParams?.jenis || ""
  const saranaId = resolvedParams?.saranaId || ""

  const opsiJenis = PILIHAN_JENIS_SARANA.find((item) => item.slug === jenisSlug)
  if (!opsiJenis) return { title: "Sarana Kesehatan Tidak Ditemukan" }

  const sarana = await fetchDetailSaranaKesehatan(saranaId)
  if (!sarana || sarana.jenis_slug !== jenisSlug) {
    return { title: "Sarana Kesehatan Tidak Ditemukan" }
  }

  return {
    title: `${sarana.nama_sarana} - Sarana Kesehatan Nagari Aia Manggih Barat`,
    description: `Informasi detail ${sarana.nama_sarana} (${opsiJenis.label}) di ${sarana.alamat}, Nagari Aia Manggih Barat.`,
  }
}

export default async function DetailSaranaKesehatanPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const jenisSlugRaw = resolvedParams?.jenis || ""
  const saranaId = resolvedParams?.saranaId || ""

  // A1 & A2. Validasi Parameter Jenis
  const opsiJenis = PILIHAN_JENIS_SARANA.find((item) => item.slug === jenisSlugRaw)
  if (!opsiJenis) {
    notFound()
  }

  const jenisSlug = opsiJenis.slug as JenisSlugKesehatan
  const labelJenis = opsiJenis.label

  // A4. Fetch Detail Sarana (Sudah memfilter is_active = true & pendataan aktif dipublikasikan)
  const sarana = await fetchDetailSaranaKesehatan(saranaId)

  // A5 & F1. Validasi Keberadaan Sarana dan Kecocokan jenis_slug dengan URL
  if (!sarana || sarana.jenis_slug !== jenisSlug) {
    notFound()
  }

  // B & F2. Query Concurrently via Promise.all (dengan penanganan error aman)
  const [listFasilitas, listTenaga, listIndikator, pendataanAktif] = await Promise.all([
    fetchFasilitasKesehatanBySaranaId(saranaId).catch((err) => {
      console.error("fetchFasilitasKesehatanBySaranaId error:", err)
      return []
    }),
    fetchTenagaKesehatanBySaranaId(saranaId).catch((err) => {
      console.error("fetchTenagaKesehatanBySaranaId error:", err)
      return []
    }),
    fetchIndikatorTambahanBySaranaId(saranaId).catch((err) => {
      console.error("fetchIndikatorTambahanBySaranaId error:", err)
      return []
    }),
    fetchPendataanKesehatanAktif().catch((err) => {
      console.error("fetchPendataanKesehatanAktif error:", err)
      return null
    }),
  ])

  // D. Perhitungan Statistik Ringkas
  const totalJenisFasilitas = listFasilitas.length
  const totalUnitFasilitas = listFasilitas.reduce((total, f) => total + Number(f.jumlah || 0), 0)
  const totalTenagaKesehatan = listTenaga.reduce((total, t) => total + Number(t.jumlah || 0), 0)
  const totalKaderPosyandu = listTenaga
    .filter((t) => (t.jenis_tenaga || "").trim().toLowerCase() === "kader posyandu")
    .reduce((total, t) => total + Number(t.jumlah || 0), 0)
  const totalIndikator = listIndikator.length

  const nomorTelepon = String(sarana.nomor_kontak || "").replace(/[^0-9+]/g, "")

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Sarana Kesehatan (Sejajar dengan card di bawah) */}
          <div className="w-full rounded-2xl border border-[#d1c2a0]/70 bg-gradient-to-br from-[#fbfaf7] via-white to-[#f7f2ea]/80 p-6 sm:p-8 lg:p-10 shadow-xs mb-8 sm:mb-10 scroll-slide-left">
            <div className="flex flex-col gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {sarana.nama_sarana}
              </h1>
            </div>

            <p className="text-base md:text-lg text-gray-700 leading-relaxed flex items-start gap-2 mt-3">
              <svg className="w-5 h-5 text-[#5a3b0d] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{sarana.alamat}</span>
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] via-[#b6a587] to-transparent rounded-full mt-5" />
          </div>

          {/* C3. Foto Utama atau Fallback Foto UI */}
          <div className="mb-10 overflow-hidden rounded-2xl border border-[#d1c2a0]/70 shadow-sm">
            {sarana.foto_url ? (
              <img
                src={sarana.foto_url}
                alt={`Foto ${sarana.nama_sarana}`}
                className="w-full h-[350px] md:h-[450px] object-cover"
              />
            ) : (
              <div className="h-[280px] md:h-[350px] bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-8 text-center">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#e6ddcf]">Nagari Aia Manggih Barat</span>
                  <span className="text-lg font-bold text-white mt-1 max-w-md">{sarana.nama_sarana}</span>
                  <span className="text-xs text-white/80 mt-1 bg-white/10 px-3 py-1 rounded-full">{labelJenis}</span>
                </div>
              </div>
            )}
          </div>

          {/* C4 & C5. Informasi Kontak, Peta, dan Keterangan */}
          <div className="mb-10">
            <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center p-4 sm:p-5 bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border-b border-[#d1c2a0]/70">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md shadow-[rgba(44,27,1,0.25)] mr-3.5 flex-shrink-0 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Informasi Umum &amp; Kontak</h2>
                  <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Rincian status, nomor kontak, dan lokasi sarana</p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Kategori Sarana</span>
                    <span className="font-semibold text-gray-900">{labelJenis}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-xs">Status Operasional</span>
                    <span className="font-semibold text-gray-900">{getLabelStatusOperasional(sarana.status_operasional)}</span>
                  </div>

                  {sarana.nomor_kontak && (
                    <div>
                      <span className="text-gray-500 block text-xs">Nomor Kontak / Telepon</span>
                      {nomorTelepon ? (
                        <a
                          href={`tel:${nomorTelepon}`}
                          className="font-semibold text-[#2c1b01] hover:underline flex items-center gap-1.5 mt-0.5"
                        >
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{sarana.nomor_kontak}</span>
                        </a>
                      ) : (
                        <span className="font-semibold text-gray-900">{sarana.nomor_kontak}</span>
                      )}
                    </div>
                  )}

                  {pendataanAktif && (
                    <div>
                      <span className="text-gray-500 block text-xs">Periode Pendataan</span>
                      <span className="font-semibold text-gray-900">
                        Tahun {pendataanAktif.tahun_pendataan} ({pendataanAktif.sumber_data})
                      </span>
                    </div>
                  )}
                </div>

                {sarana.keterangan && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-gray-500 block text-xs mb-1">Keterangan Tambahan</span>
                    <p className="text-sm text-gray-700 leading-relaxed bg-[#fcfaf7] border border-[#d1c2a0]/40 p-3.5 rounded-xl">
                      {sarana.keterangan}
                    </p>
                  </div>
                )}

                {/* C5. Tautan Google Maps */}
                {sarana.tautan_peta && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <a
                      href={sarana.tautan_peta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-5 py-3 text-sm font-semibold text-white shadow-md hover:from-[#1a1200] hover:to-[#2c1b01] transition-all"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>Buka Lokasi di Google Maps</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* E. Daftar-daftar Rincian (Direct List tanpa Tabel) */}
          <div className="space-y-8">
            {/* E1 & E2. Grid Berdampingan pada Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* E1. Daftar Fasilitas Internal */}
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border-b border-[#d1c2a0]/70">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md shadow-[rgba(44,27,1,0.25)] mr-3.5 flex-shrink-0 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Daftar Fasilitas Internal</h2>
                      <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Kelengkapan sarana dan prasarana fisik</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#6b4b1d] shrink-0">
                    {listFasilitas.length} fasilitas
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  {listFasilitas.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500 bg-[#fcfaf7] rounded-xl border border-dashed border-[#d1c2a0]/60">
                      Data fasilitas belum tersedia.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#e6ddcf]/60">
                      {listFasilitas.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between gap-3 py-3 px-1 hover:bg-[#fcfaf7] rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-bold text-[#6b4b1d] w-5 flex-shrink-0">{index + 1}.</span>
                            <span className="font-semibold text-gray-900 text-sm truncate">{item.nama_fasilitas}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-[#2c1b01] shrink-0">
                            {formatAngka(item.jumlah)} unit
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* E2. Daftar Tenaga Kesehatan & Kader */}
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border-b border-[#d1c2a0]/70">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md shadow-[rgba(44,27,1,0.25)] mr-3.5 flex-shrink-0 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4m-4-10a4 4 0 110-8 4 4 0 010 8zm-7 2a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Daftar Tenaga Kesehatan &amp; Kader</h2>
                      <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Petugas kesehatan dan kader pelaksana</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#6b4b1d] shrink-0">
                    {formatAngka(totalTenagaKesehatan)} orang
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  {listTenaga.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500 bg-[#fcfaf7] rounded-xl border border-dashed border-[#d1c2a0]/60">
                      Data tenaga kesehatan belum tersedia.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#e6ddcf]/60">
                      {listTenaga.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between gap-3 py-3 px-1 hover:bg-[#fcfaf7] rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                            <span className="text-xs font-bold text-[#6b4b1d] w-5 flex-shrink-0">{index + 1}.</span>
                            <span className="font-semibold text-gray-900 text-sm">{item.jenis_tenaga}</span>
                            {(item.jenis_tenaga || "").trim().toLowerCase() === "kader posyandu" && (
                              <span className="rounded-md bg-[#f0e8db] border border-[#d1c2a0] px-2 py-0.5 text-[10px] font-bold text-[#2c1b01] shrink-0">
                                Kader Posyandu
                              </span>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-[#2c1b01] shrink-0">
                            {formatAngka(item.jumlah)} orang
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* E3. Indikator Tambahan */}
            <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border-b border-[#d1c2a0]/70">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md shadow-[rgba(44,27,1,0.25)] mr-3.5 flex-shrink-0 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Indikator &amp; Spesifikasi Layanan</h2>
                    <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Parameter dan indikator operasional sarana</p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#6b4b1d] shrink-0">
                  {listIndikator.length} indikator
                </span>
              </div>

              <div className="p-6 sm:p-8">
                {listIndikator.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500 bg-[#fcfaf7] rounded-xl border border-dashed border-[#d1c2a0]/60">
                    Data indikator tambahan belum tersedia.
                  </p>
                ) : (
                  <div className="divide-y divide-[#e6ddcf]/60">
                    {listIndikator.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3.5 px-2 hover:bg-[#fcfaf7] rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-xs font-bold text-[#6b4b1d] w-6 flex-shrink-0 mt-0.5">{index + 1}.</span>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm sm:text-base block">{item.nama_indikator}</span>
                            {item.keterangan && (
                              <span className="text-xs text-gray-500 italic block mt-0.5">{item.keterangan}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0 ml-9 sm:ml-0">
                          <span className="text-xs sm:text-sm font-medium text-[#2c1b01] inline-block">
                            {item.nilai_indikator} {item.satuan || ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
