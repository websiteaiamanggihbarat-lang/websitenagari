import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  fetchPendataanKesehatanAktif,
  fetchSaranaKesehatanByJenis,
  PILIHAN_JENIS_SARANA,
  JenisSlugKesehatan,
} from "@/lib/kesehatan"

export const dynamic = "force-dynamic"
export const revalidate = 0

function formatAngka(nilai: number | null | undefined): string {
  return Number(nilai || 0).toLocaleString("id-ID")
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
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Kategori Kesehatan */}
          <div className="mb-10 scroll-slide-left">
            <div className="pb-8 border-b border-[#d1c2a0]/60 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-lg bg-[#f0e8db] border border-[#d1c2a0] px-3.5 py-1.5 text-xs font-bold text-[#2c1b01] tracking-wider uppercase mb-3 shadow-2xs">
                  Kategori Sarana Kesehatan
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  {labelJenis}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mt-2 leading-relaxed">
                  Daftar sarana dan fasilitas layanan kesehatan {labelJenis.toLowerCase()} di wilayah Nagari Aia Manggih Barat.
                </p>
              </div>

              {/* Rekap Ringkas Periode & Jumlah Sarana */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-white border border-[#d1c2a0]/70 px-4 py-2 text-center shadow-2xs">
                  <p className="text-xs text-[#2c1b01] font-semibold">Jumlah Sarana {labelJenis}</p>
                  <p className="text-lg font-bold text-[#2c1b01]">
                    {formatAngka(listSarana.length)}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-[#d1c2a0]/70 px-4 py-2 text-center shadow-2xs">
                  <p className="text-xs text-[#2c1b01] font-semibold">Periode Pendataan Aktif</p>
                  <p className="text-lg font-bold text-[#2c1b01]">
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
                const detailUrl = `/kesehatan/${jenisSlug}/${sarana.id}`

                return (
                  <Link
                    key={sarana.id}
                    href={detailUrl}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <div>
                      {/* Foto Utama atau Fallback Foto UI */}
                      {sarana.foto_url ? (
                        <div className="aspect-[16/10] relative overflow-hidden bg-[#f0e8db]/40">
                          <img
                            src={sarana.foto_url}
                            alt={`Foto ${sarana.nama_sarana}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-6 text-center">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2 border border-white/20">
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

                      {/* Konten Kartu: Nama & Alamat */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2c1b01] transition-colors mb-1.5">
                          {sarana.nama_sarana}
                        </h3>

                        {sarana.alamat && (
                          <p className="text-xs font-medium text-[#5a3b0d] flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-[#5a3b0d] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{sarana.alamat}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

