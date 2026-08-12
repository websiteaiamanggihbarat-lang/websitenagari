import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  getTingkatBySlug,
  getAktifPendataanDanSarana,
  getFasilitasBySaranaId,
  getKegiatanBySaranaId,
  formatAngka,
} from "@/lib/saranaPendidikan"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  params: Promise<{
    tingkat: string
    sekolahId: string
  }>
}

export default async function RincianSekolahPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const tingkatSlug = resolvedParams?.tingkat || ""
  const sekolahId = resolvedParams?.sekolahId || ""

  // 1. Validasi Slug Tingkat Pendidikan pada URL
  const tingkatObj = getTingkatBySlug(tingkatSlug)
  if (!tingkatObj) {
    notFound()
  }

  // 2. Query Pendataan Publik & Daftar Sekolah Aktif
  const { pendataan, sarana, error } = await getAktifPendataanDanSarana()
  if (error || !pendataan) {
    notFound()
  }

  // 3. Cari Sekolah Berdasarkan sekolahId
  const sekolah = sarana.find((item) => item.id === sekolahId)

  // 4. Validasi Keberadaan Sekolah, Keaktifan, dan Kesesuaian Tingkat Pendidikan dengan URL
  if (
    !sekolah ||
    !sekolah.is_active ||
    sekolah.tingkat_pendidikan.toLowerCase() !== tingkatObj.dbValue.toLowerCase()
  ) {
    notFound()
  }

  // 5. Query Daftar Fasilitas dan Kegiatan Sekolah (Read-Only)
  const [{ fasilitas }, { kegiatan }] = await Promise.all([
    getFasilitasBySaranaId(sekolah.id),
    getKegiatanBySaranaId(sekolah.id),
  ])

  const nomorTelepon = String(sekolah.nomor_kontak || "").replace(/[^0-9+]/g, "")
  const keteranganTrimmed = (sekolah.keterangan || "").trim()
  const jumlahStaf = Number(sekolah.jumlah_staf || 0)

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* 1. Nama Sekolah dan Alamat Header Card */}
          <div className="w-full rounded-2xl border border-[#d1c2a0]/70 bg-gradient-to-br from-[#fbfaf7] via-white to-[#f7f2ea]/80 p-6 sm:p-8 lg:p-10 shadow-xs mb-8 sm:mb-10 scroll-slide-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              {sekolah.nama_sarana}
            </h1>

            <p className="text-base md:text-lg text-gray-700 leading-relaxed flex items-start gap-2">
              <svg className="w-5 h-5 text-[#5a3b0d] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{sekolah.alamat}</span>
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] via-[#b6a587] to-transparent rounded-full mt-5" />
          </div>

          {/* 2. Foto Utama Sekolah */}
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xs border border-[#d1c2a0]/70 bg-gray-50 scroll-slide-bottom">
            {sekolah.foto_url ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-900">
                <img
                  src={sekolah.foto_url}
                  alt={`Foto ${sekolah.nama_sarana}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
            ) : (
              /* Foto Cadangan (Fallback Photo UI) */
              <div className="py-16 px-8 bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{sekolah.nama_sarana}</h3>
                  <p className="text-xs text-[#e6ddcf]">Pemerintahan Nagari Aia Manggih Barat</p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Statistik Sekolah (Langsung di bawah Foto Utama Sekolah) */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Statistik Sekolah</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-5 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2c1b01] to-[#4a3210] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg className="w-5.5 h-5.5 text-[#e6ddcf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah Siswa</p>
                  <p className="text-lg font-bold text-[#2c1b01] mt-0.5">
                    {formatAngka(sekolah.jumlah_siswa)}{" "}
                    <span className="text-xs font-medium text-gray-500">Siswa/i</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-5 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2c1b01] to-[#4a3210] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg className="w-5.5 h-5.5 text-[#e6ddcf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 3v2m6-2v2m-6 4h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah Guru</p>
                  <p className="text-lg font-bold text-[#2c1b01] mt-0.5">
                    {formatAngka(sekolah.jumlah_guru)}{" "}
                    <span className="text-xs font-medium text-gray-500">Guru</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-5 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2c1b01] to-[#4a3210] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg className="w-5.5 h-5.5 text-[#e6ddcf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah Staf</p>
                  <p className="text-lg font-bold text-[#2c1b01] mt-0.5">
                    {formatAngka(jumlahStaf)}{" "}
                    <span className="text-xs font-medium text-gray-500">Tendik/Staf</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* 4. Bagian Keterangan Sekolah */}
            {keteranganTrimmed && (
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 md:p-8 shadow-xs">
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Keterangan Sekolah</span>
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                  {keteranganTrimmed}
                </p>
              </div>
            )}

            {/* 5. Bagian Daftar Sarana Sekolah (Direct List) */}
            {fasilitas && fasilitas.length > 0 && (
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 md:p-8 shadow-xs overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Daftar Sarana Sekolah</span>
                </h2>

                <div className="divide-y divide-[#e6ddcf]/60">
                  {fasilitas.map((item, idx) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-500">{idx + 1}.</span>
                        <span className="font-semibold text-gray-900">{item.nama_fasilitas}</span>
                      </div>
                      <span className="font-bold text-[#2c1b01]">
                        {formatAngka(item.jumlah)} unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Bagian Kegiatan & Ekstrakurikuler */}
            {kegiatan && kegiatan.length > 0 && (
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 md:p-8 shadow-xs overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4V4z" />
                  </svg>
                  <span>Kegiatan & Ekstrakurikuler</span>
                </h2>

                <div className="divide-y divide-[#e6ddcf]/60">
                  {kegiatan.map((item, idx) => (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-500">{idx + 1}.</span>
                        <span className="font-semibold text-gray-900">{item.nama_kegiatan}</span>
                      </div>
                      {item.keterangan && (
                        <span className="text-xs text-gray-600 sm:text-right pl-7 sm:pl-0 italic">
                          {item.keterangan}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Bagian Kontak dan Akses Sekolah */}
            {(sekolah.nomor_kontak || sekolah.lokasi_peta) && (
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 md:p-8 shadow-xs">
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                  </svg>
                  <span>Kontak dan Akses Sekolah</span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {sekolah.nomor_kontak && (
                    <a
                      href={`tel:${nomorTelepon}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d1c2a0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2c1b01] shadow-2xs transition-all hover:bg-[#f7f2e8]"
                    >
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                      </svg>
                      <span>Telepon: {sekolah.nomor_kontak}</span>
                    </a>
                  )}

                  {sekolah.lokasi_peta && (
                    <a
                      href={sekolah.lokasi_peta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4a3210]"
                    >
                      <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Buka Lokasi di Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
