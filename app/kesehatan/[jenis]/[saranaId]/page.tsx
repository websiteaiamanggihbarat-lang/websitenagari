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
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* C1. Breadcrumb Navigasi */}
          <nav className="flex flex-wrap items-center text-sm text-gray-500 mb-8 gap-2">
            <Link href="/" className="hover:text-[#2c1b01] transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-gray-600">Kesehatan</span>
            <span>/</span>
            <Link
              href={`/kesehatan/${jenisSlug}`}
              className="hover:text-[#2c1b01] transition-colors"
            >
              {labelJenis}
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900 truncate max-w-[200px]">
              {sarana.nama_sarana}
            </span>
          </nav>

          {/* Header Sarana Kesehatan */}
          <div className="mb-8 border-b border-gray-200 pb-8 scroll-slide-left">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <span className={`inline-block rounded-md border px-3 py-1 text-xs font-semibold mb-3 ${getWarnaStatusOperasional(sarana.status_operasional)}`}>
                  {getLabelStatusOperasional(sarana.status_operasional)}
                </span>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {sarana.nama_sarana}
                </h1>
              </div>

              {/* C2. Tombol Kembali ke Kategori */}
              <Link
                href={`/kesehatan/${jenisSlug}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-[#f7f2e8] hover:border-[#b6a587] shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke {labelJenis}</span>
              </Link>
            </div>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed flex items-start gap-2">
              <svg className="w-5 h-5 text-[#5a3b0d] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{sarana.alamat}</span>
            </p>
          </div>

          {/* C3. Foto Utama atau Fallback Foto UI */}
          <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 shadow-md">
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

          {/* D. Statistik Ringkas Sarana Kesehatan */}
          <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[#f0e8db]/60 border border-[#d1c2a0]/40 p-4 text-center">
              <p className="text-xs text-gray-600 font-medium">Unit Fasilitas</p>
              <p className="text-2xl font-bold text-[#2c1b01] mt-1">
                {formatAngka(totalUnitFasilitas)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{totalJenisFasilitas} jenis fasilitas</p>
            </div>

            <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/50 p-4 text-center">
              <p className="text-xs text-emerald-800 font-medium">Tenaga Kesehatan</p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">
                {formatAngka(totalTenagaKesehatan)}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">{listTenaga.length} kategori tenaga</p>
            </div>

            <div className="rounded-xl bg-blue-50/80 border border-blue-200/50 p-4 text-center">
              <p className="text-xs text-blue-800 font-medium">Kader Posyandu</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">
                {formatAngka(totalKaderPosyandu)}
              </p>
              <p className="text-[10px] text-blue-600 mt-0.5">kader aktif</p>
            </div>

            <div className="rounded-xl bg-purple-50/80 border border-purple-200/50 p-4 text-center">
              <p className="text-xs text-purple-800 font-medium">Indikator Tambahan</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {formatAngka(totalIndikator)}
              </p>
              <p className="text-[10px] text-purple-600 mt-0.5">spesifikasi layanan</p>
            </div>
          </div>

          {/* C4 & C5. Informasi Kontak, Peta, dan Keterangan */}
          <div className="mb-12 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2c1b01]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Informasi Umum & Kontak</span>
              </h2>

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
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">
                    {sarana.keterangan}
                  </p>
                </div>
              )}

              {/* C5. Tautan Google Maps (Render aman sebagai <a> tab baru) */}
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

          {/* E. Tabel-tabel Rincian (Fasilitas, Tenaga, Indikator) */}
          <div className="space-y-8">
            {/* E1. Tabel Fasilitas Sarana Kesehatan */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2c1b01]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Daftar Fasilitas Internal</span>
                </span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {listFasilitas.length} fasilitas
                </span>
              </h2>

              {listFasilitas.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Data fasilitas belum tersedia.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#f0e8db]/40 text-gray-900">
                        <th className="py-3 px-4 font-bold w-14 text-center">No.</th>
                        <th className="py-3 px-4 font-bold">Nama Fasilitas</th>
                        <th className="py-3 px-4 font-bold text-center w-32">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {listFasilitas.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-gray-500">{index + 1}.</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{item.nama_fasilitas}</td>
                          <td className="py-3 px-4 text-center font-bold text-[#2c1b01]">
                            {formatAngka(item.jumlah)} unit
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* E2. Tabel Tenaga Kesehatan / Kader */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4m-4-10a4 4 0 110-8 4 4 0 010 8zm-7 2a3 3 0 110-6 3 3 0 010 6z" />
                  </svg>
                  <span>Daftar Tenaga Kesehatan & Kader</span>
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  {formatAngka(totalTenagaKesehatan)} orang
                </span>
              </h2>

              {listTenaga.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Data tenaga kesehatan belum tersedia.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-emerald-50/60 text-emerald-900">
                        <th className="py-3 px-4 font-bold w-14 text-center">No.</th>
                        <th className="py-3 px-4 font-bold">Jenis Tenaga Kesehatan / Kader</th>
                        <th className="py-3 px-4 font-bold text-center w-32">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {listTenaga.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-gray-500">{index + 1}.</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {item.jenis_tenaga}
                            {(item.jenis_tenaga || "").trim().toLowerCase() === "kader posyandu" && (
                              <span className="ml-2 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                Kader Posyandu
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-800">
                            {formatAngka(item.jumlah)} orang
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* E3. Tabel Indikator Tambahan */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Indikator & Spesifikasi Layanan</span>
                </span>
                <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full">
                  {listIndikator.length} indikator
                </span>
              </h2>

              {listIndikator.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Data indikator tambahan belum tersedia.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-purple-50/60 text-purple-900">
                        <th className="py-3 px-4 font-bold w-14 text-center">No.</th>
                        <th className="py-3 px-4 font-bold">Nama Indikator</th>
                        <th className="py-3 px-4 font-bold">Nilai</th>
                        <th className="py-3 px-4 font-bold">Satuan</th>
                        <th className="py-3 px-4 font-bold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {listIndikator.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-gray-500">{index + 1}.</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{item.nama_indikator}</td>
                          <td className="py-3 px-4 font-bold text-purple-900">{item.nilai_indikator}</td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{item.satuan || "-"}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs italic">{item.keterangan || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Tombol Bawah Kembali ke Kategori */}
          <div className="mt-12 text-center border-t border-gray-200 pt-8">
            <Link
              href={`/kesehatan/${jenisSlug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#1a1200] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Lihat Sarana {labelJenis} Lainnya</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
