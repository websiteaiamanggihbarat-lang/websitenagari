import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  getTingkatBySlug,
  getAktifPendataanDanSarana,
  formatAngka,
} from "@/lib/saranaPendidikan"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  params: Promise<{
    tingkat: string
  }>
}

export default async function DaftarSekolahPerTingkatPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const tingkatSlug = resolvedParams?.tingkat || ""

  // 1. Validasi Slug Tingkat Pendidikan
  const tingkatObj = getTingkatBySlug(tingkatSlug)
  if (!tingkatObj) {
    notFound()
  }

  // 2. Query Data Publik Aktif dari Supabase
  const { pendataan, sarana, error } = await getAktifPendataanDanSarana()

  // 3. Filter Sekolah berdasarkan tingkat_pendidikan & status operasional
  const daftarSekolahTingkat = sarana.filter(
    (item) => item.tingkat_pendidikan.toLowerCase() === tingkatObj.dbValue.toLowerCase()
  )

  const totalSiswa = daftarSekolahTingkat.reduce(
    (acc, item) => acc + Number(item.jumlah_siswa || 0),
    0
  )
  const totalGuru = daftarSekolahTingkat.reduce(
    (acc, item) => acc + Number(item.jumlah_guru || 0),
    0
  )

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Tingkat Pendidikan */}
          <div className="mb-10 scroll-slide-left">
            <div className="pb-8 border-b border-[#d1c2a0]/60 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-lg bg-[#f0e8db] border border-[#d1c2a0] px-3.5 py-1.5 text-xs font-bold text-[#2c1b01] tracking-wider uppercase mb-3 shadow-2xs">
                  Tingkat {tingkatObj.dbValue}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Daftar Sekolah {tingkatObj.label}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mt-2 leading-relaxed">
                  {tingkatObj.deskripsi} di wilayah Nagari Aia Manggih Barat.
                </p>
              </div>

              {/* Rekap Ringkas Tingkat Ini */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-white border border-[#d1c2a0]/70 px-4 py-2 text-center shadow-2xs">
                  <p className="text-xs text-[#2c1b01] font-semibold">Jumlah Sekolah</p>
                  <p className="text-lg font-bold text-[#2c1b01]">
                    {formatAngka(daftarSekolahTingkat.length)}
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-[#d1c2a0]/70 px-4 py-2 text-center shadow-2xs">
                  <p className="text-xs text-[#2c1b01] font-semibold">Total Siswa</p>
                  <p className="text-lg font-bold text-[#2c1b01]">
                    {formatAngka(totalSiswa)}
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-[#d1c2a0]/70 px-4 py-2 text-center shadow-2xs">
                  <p className="text-xs text-[#2c1b01] font-semibold">Total Guru</p>
                  <p className="text-lg font-bold text-[#2c1b01]">
                    {formatAngka(totalGuru)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pesan Error Supabase */}
          {error && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Data sarana pendidikan belum dapat dimuat: {error}
            </div>
          )}

          {/* Tampilan Kosong (Empty State) jika belum ada sekolah */}
          {!error && daftarSekolahTingkat.length === 0 && (
            <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
              <div className="w-16 h-16 bg-[#f0e8db] text-[#2c1b01] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#d1c2a0]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Belum Ada Sekolah Terdaftar
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Saat ini belum ada sarana pendidikan untuk tingkat <span className="font-semibold">{tingkatObj.label}</span> yang terdaftar aktif dalam pendataan publik nagari.
              </p>
            </div>
          )}

          {/* Grid Daftar Sekolah */}
          {daftarSekolahTingkat.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {daftarSekolahTingkat.map((sekolah) => {
                return (
                  <Link
                    key={sekolah.id}
                    href={`/sarana-pendidikan/${tingkatSlug}/${sekolah.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <div>
                      {/* Foto Utama atau Foto Cadangan */}
                      {sekolah.foto_url ? (
                        <div className="aspect-[16/10] relative overflow-hidden bg-[#f0e8db]/40">
                          <img
                            src={sekolah.foto_url}
                            alt={`Foto ${sekolah.nama_sarana}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        /* Foto Cadangan (Fallback Photo UI) */
                        <div className="aspect-[16/10] bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-6 text-center">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2 border border-white/20">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-[#e6ddcf]">Nagari Aia Manggih Barat</span>
                            <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">{sekolah.nama_sarana}</span>
                          </div>
                        </div>
                      )}

                      {/* Konten Kartu: Nama & Alamat */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2c1b01] transition-colors mb-1.5">
                          {sekolah.nama_sarana}
                        </h3>

                        <p className="text-xs font-medium text-[#5a3b0d] flex items-center gap-1.5 mb-3">
                          <svg className="w-3.5 h-3.5 text-[#5a3b0d] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{sekolah.alamat}</span>
                        </p>
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
