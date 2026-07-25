import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  getTingkatBySlug,
  getAktifPendataanDanSarana,
  getFasilitasBySaranaId,
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

  // 5. Query Daftar Fasilitas Sekolah (Read-Only)
  const { fasilitas } = await getFasilitasBySaranaId(sekolah.id)

  const nomorTelepon = String(sekolah.nomor_kontak || "").replace(/[^0-9+]/g, "")
  const keteranganTrimmed = (sekolah.keterangan || "").trim()
  const jumlahStaf = Number(sekolah.jumlah_staf || 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigasi */}
          <nav className="flex flex-wrap items-center text-sm text-gray-500 mb-8 gap-2">
            <Link href="/" className="hover:text-[#2c1b01] transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/sarana-pendidikan" className="hover:text-[#2c1b01] transition-colors">
              Sarana Pendidikan
            </Link>
            <span>/</span>
            <Link
              href={`/sarana-pendidikan/${tingkatObj.slug}`}
              className="hover:text-[#2c1b01] transition-colors"
            >
              {tingkatObj.label}
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900 truncate max-w-[200px]">
              {sekolah.nama_sarana}
            </span>
          </nav>

          {/* 1. Nama Sekolah dan Alamat */}
          <div className="mb-8 border-b border-gray-200 pb-8 scroll-slide-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              {sekolah.nama_sarana}
            </h1>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed flex items-start gap-2">
              <svg className="w-5 h-5 text-[#5a3b0d] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{sekolah.alamat}</span>
            </p>
          </div>

          {/* 2. Foto Utama Sekolah */}
          <div className="mb-10 rounded-2xl overflow-hidden shadow-lg border border-gray-200/80 bg-gray-50 scroll-slide-bottom">
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

          <div className="space-y-10">
            {/* 3. Bagian Keterangan Sekolah (Di bawah foto) */}
            {keteranganTrimmed && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
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

            {/* 4. Bagian Daftar Sarana Sekolah (Tabel) */}
            {fasilitas && fasilitas.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Daftar Sarana Sekolah</span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#f7f2e8]/60 text-[#2c1b01]">
                        <th className="py-3 px-4 font-bold w-16 text-center">No.</th>
                        <th className="py-3 px-4 font-bold">Sarana Sekolah</th>
                        <th className="py-3 px-4 font-bold text-right w-28">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fasilitas.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{item.nama_fasilitas}</td>
                          <td className="py-3 px-4 text-right font-bold text-[#2c1b01]">
                            {formatAngka(item.jumlah)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Statistik jumlah siswa, guru, dan staf */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-[#5a3b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Statistik Sekolah</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Jumlah Siswa</p>
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 mt-0.5">
                      {formatAngka(sekolah.jumlah_siswa)}{" "}
                      <span className="text-xs font-medium text-gray-600">Siswa/i</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-green-200/80 bg-gradient-to-br from-green-50/50 via-white to-green-50/30 p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 3v2m6-2v2m-6 4h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Jumlah Guru</p>
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 mt-0.5">
                      {formatAngka(sekolah.jumlah_guru)}{" "}
                      <span className="text-xs font-medium text-gray-600">Guru</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Jumlah Staf</p>
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 mt-0.5">
                      {formatAngka(jumlahStaf)}{" "}
                      <span className="text-xs font-medium text-gray-600">Tendik/Staf</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Bagian Kontak dan Akses Sekolah */}
            {(sekolah.nomor_kontak || sekolah.lokasi_peta) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
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
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:bg-gray-100 hover:border-gray-400"
                    >
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Buka Lokasi di Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 7. Tombol Navigasi Kembali */}
            <div className="pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <Link
                href={`/sarana-pendidikan/${tingkatObj.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-[#f7f2e8] hover:border-[#b6a587]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke Daftar Sekolah {tingkatObj.label}</span>
              </Link>

              <Link
                href="/sarana-pendidikan"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-[#1a1200] hover:to-[#2c1b01]"
              >
                <span>Lihat Tingkat Pendidikan Lainnya</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
