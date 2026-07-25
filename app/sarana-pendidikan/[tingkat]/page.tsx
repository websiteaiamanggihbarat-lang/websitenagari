import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import {
  getTingkatBySlug,
  getAktifPendataanDanSarana,
  formatAngka,
  formatStatusOperasional,
  kelasStatusOperasional,
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
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigasi */}
          <nav className="flex items-center text-sm text-gray-500 mb-8 space-x-2">
            <Link href="/" className="hover:text-[#2c1b01] transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/sarana-pendidikan" className="hover:text-[#2c1b01] transition-colors">
              Sarana Pendidikan
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">{tingkatObj.label}</span>
          </nav>

          {/* Header Tingkat Pendidikan */}
          <div className="mb-12 scroll-slide-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-gray-200">
              <div>
                <span className="inline-block rounded-lg bg-[#f0e8db] px-3 py-1 text-xs font-bold text-[#2c1b01] mb-3">
                  Tingkat {tingkatObj.dbValue}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Daftar Sekolah {tingkatObj.label}
                </h1>
                <p className="text-gray-600 mt-2 text-base max-w-2xl">
                  {tingkatObj.deskripsi} di wilayah Nagari Aia Manggih Barat.
                </p>
              </div>

              <Link
                href="/sarana-pendidikan"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-[#f7f2e8] hover:border-[#b6a587]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Pilih Tingkat Lain</span>
              </Link>
            </div>

            {/* Rekap Ringkas Tingkat Ini */}
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-xl">
              <div className="rounded-xl bg-[#f0e8db]/60 border border-[#d1c2a0]/40 p-3 text-center">
                <p className="text-xs text-gray-600 font-medium">Jumlah Sekolah</p>
                <p className="text-xl font-bold text-[#2c1b01] mt-0.5">
                  {formatAngka(daftarSekolahTingkat.length)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50/80 border border-blue-200/50 p-3 text-center">
                <p className="text-xs text-blue-700 font-medium">Total Siswa</p>
                <p className="text-xl font-bold text-blue-700 mt-0.5">
                  {formatAngka(totalSiswa)}
                </p>
              </div>
              <div className="rounded-xl bg-green-50/80 border border-green-200/50 p-3 text-center">
                <p className="text-xs text-green-700 font-medium">Total Guru</p>
                <p className="text-xl font-bold text-green-700 mt-0.5">
                  {formatAngka(totalGuru)}
                </p>
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
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/70 p-12 text-center max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 bg-[#f0e8db] text-[#2c1b01] rounded-2xl flex items-center justify-center mx-auto mb-4">
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
              <Link
                href="/sarana-pendidikan"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1a1200] transition-colors"
              >
                &larr; Lihat Tingkat Pendidikan Lainnya
              </Link>
            </div>
          )}

          {/* Grid Daftar Sekolah */}
          {daftarSekolahTingkat.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {daftarSekolahTingkat.map((sekolah) => {
                const nomorTelepon = String(sekolah.nomor_kontak || "").replace(/[^0-9+]/g, "")

                return (
                  <article
                    key={sekolah.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-xl"
                  >
                    <div>
                      {/* Foto Utama atau Foto Cadangan */}
                      {sekolah.foto_url ? (
                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                          <img
                            src={sekolah.foto_url}
                            alt={`Foto ${sekolah.nama_sarana}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        /* Foto Cadangan (Fallback Photo UI) */
                        <div className="aspect-video bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden flex items-center justify-center p-6 text-center">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-[#e6ddcf]">Nagari Aia Manggih Barat</span>
                            <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">{sekolah.nama_sarana}</span>
                          </div>
                        </div>
                      )}

                      {/* Konten Kartu */}
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="rounded-full bg-[#f0e8db] px-2.5 py-1 text-xs font-semibold text-[#2c1b01]">
                            {sekolah.tingkat_pendidikan}
                          </span>

                          {sekolah.jenis_pengelolaan && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {sekolah.jenis_pengelolaan}
                            </span>
                          )}

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kelasStatusOperasional(
                              sekolah.status_operasional
                            )}`}
                          >
                            {formatStatusOperasional(sekolah.status_operasional)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#5a3b0d] transition-colors mb-2">
                          <Link href={`/sarana-pendidikan/${tingkatSlug}/${sekolah.id}`}>
                            {sekolah.nama_sarana}
                          </Link>
                        </h3>

                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
                          {sekolah.alamat}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="rounded-xl bg-blue-50/70 p-3">
                            <p className="text-xs text-gray-500">Jumlah Siswa</p>
                            <p className="text-base font-bold text-blue-700 mt-0.5">
                              {formatAngka(sekolah.jumlah_siswa)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-green-50/70 p-3">
                            <p className="text-xs text-gray-500">Jumlah Guru</p>
                            <p className="text-base font-bold text-green-700 mt-0.5">
                              {formatAngka(sekolah.jumlah_guru)}
                            </p>
                          </div>
                        </div>

                        {sekolah.nomor_kontak && (
                          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                            </svg>
                            <span>Kontak: {sekolah.nomor_kontak}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi Bawah */}
                    <div className="p-6 pt-0">
                      <Link
                        href={`/sarana-pendidikan/${tingkatSlug}/${sekolah.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-[#1a1200] hover:to-[#2c1b01]"
                      >
                        <span>Rincian Lengkap Sekolah</span>
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
