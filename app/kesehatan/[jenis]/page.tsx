import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  fetchPendataanKesehatanAktif,
  fetchSaranaKesehatanByJenis,
  getLabelJenisSarana,
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
  }>
}

export default async function DaftarSaranaKesehatanPerJenisPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const jenisSlugRaw = resolvedParams?.jenis || ""

  // 1. Validasi Parameter URL Jenis (Hanya jenis_slug yang diizinkan)
  const opsiJenis = PILIHAN_JENIS_SARANA.find((item) => item.slug === jenisSlugRaw)
  if (!opsiJenis) {
    notFound()
  }

  const jenisSlug = opsiJenis.slug as JenisSlugKesehatan
  const labelJenis = opsiJenis.label

  // 2. Query Data Publik Aktif dari Helper lib/kesehatan.ts
  const pendataanAktif = await fetchPendataanKesehatanAktif()
  const listSarana = await fetchSaranaKesehatanByJenis(jenisSlug)

  return (
    <div className="min-h-screen bg-public-warm text-[#1F2937]">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigasi */}
          <nav className="flex items-center text-sm text-gray-500 mb-8 space-x-2">
            <Link href="/" className="hover:text-[#2c1b01] transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-gray-600">Kesehatan</span>
            <span>/</span>
            <span className="font-semibold text-gray-900">{labelJenis}</span>
          </nav>

          {/* Header Kategori Kesehatan */}
          <div className="mb-12 scroll-slide-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-gray-200">
              <div>
                <span className="inline-block rounded-lg bg-[#f0e8db] px-3 py-1 text-xs font-bold text-[#2c1b01] mb-3">
                  Kategori Sarana Kesehatan
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  {labelJenis}
                </h1>
                <p className="text-gray-600 mt-2 text-base max-w-2xl leading-relaxed">
                  Daftar sarana dan fasilitas layanan kesehatan {labelJenis.toLowerCase()} di wilayah Nagari Aia Manggih Barat.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-[#f7f2e8] hover:border-[#b6a587]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke Beranda</span>
              </Link>
            </div>

            {/* Rekap Ringkas Periode & Jumlah Sarana */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#f0e8db]/60 border border-[#d1c2a0]/40 p-4 text-center">
                  <p className="text-xs text-gray-600 font-medium">Jumlah Sarana {labelJenis}</p>
                  <p className="text-2xl font-bold text-[#2c1b01] mt-0.5">
                    {formatAngka(listSarana.length)}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/50 p-4 text-center">
                  <p className="text-xs text-emerald-800 font-medium">Periode Pendataan Aktif</p>
                  <p className="text-2xl font-bold text-emerald-800 mt-0.5">
                    {pendataanAktif ? `Tahun ${pendataanAktif.tahun_pendataan}` : "Belum Ada"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State jika belum ada sarana kesehatan aktif */}
          {listSarana.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/70 p-12 text-center max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 bg-[#f0e8db] text-[#2c1b01] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Belum Ada Sarana {labelJenis} Terdaftar
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Saat ini belum ada data sarana kesehatan kategori <span className="font-semibold">{labelJenis}</span> yang terdaftar aktif dalam pendataan publik nagari.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1a1200] transition-colors"
              >
                ← Kembali ke Beranda
              </Link>
            </div>
          )}

          {/* Grid Daftar Sarana Kesehatan */}
          {listSarana.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listSarana.map((sarana) => {
                return (
                  <article
                    key={sarana.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-xl"
                  >
                    <div>
                      {/* Foto Utama atau Fallback Foto UI */}
                      {sarana.foto_url ? (
                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                          <img
                            src={sarana.foto_url}
                            alt={`Foto ${sarana.nama_sarana}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-6 text-center">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2 shadow-sm">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-[#e6ddcf]">Nagari Aia Manggih Barat</span>
                            <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">{sarana.nama_sarana}</span>
                          </div>
                        </div>
                      )}

                      {/* Konten Kartu: Nama, Status, Alamat */}
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getWarnaStatusOperasional(sarana.status_operasional)}`}>
                            {getLabelStatusOperasional(sarana.status_operasional)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#5a3b0d] transition-colors mb-2">
                          <Link href={`/kesehatan/${jenisSlug}/${sarana.id}`}>
                            {sarana.nama_sarana}
                          </Link>
                        </h3>

                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-3">
                          {sarana.alamat}
                        </p>

                        {sarana.keterangan && (
                          <p className="text-xs text-gray-500 line-clamp-2 italic border-t border-gray-100 pt-2">
                            "{sarana.keterangan}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tombol Rincian Lengkap */}
                    <div className="p-6 pt-0">
                      <Link
                        href={`/kesehatan/${jenisSlug}/${sarana.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-[#1a1200] hover:to-[#2c1b01]"
                      >
                        <span>Rincian Lengkap Sarana</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
