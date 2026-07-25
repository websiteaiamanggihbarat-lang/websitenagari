import Link from "next/link"
import { connection } from "next/server"
import {
  LIST_TINGKAT_PENDIDIKAN,
  getAktifPendataanDanSarana,
  formatAngka,
} from "@/lib/saranaPendidikan"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SaranaPendidikanIndexPage() {
  await connection()

  const { pendataan, sarana, error } = await getAktifPendataanDanSarana()

  // Sarana operasional aktif
  const saranaAktif = sarana.filter((item) => item.status_operasional === "aktif")

  // Hitung jumlah sekolah untuk masing-masing tingkat
  const rekapTingkat = LIST_TINGKAT_PENDIDIKAN.map((tingkat) => {
    const jumlahSekolah = saranaAktif.filter(
      (item) => item.tingkat_pendidikan.toLowerCase() === tingkat.dbValue.toLowerCase()
    ).length

    return {
      ...tingkat,
      jumlahSekolah,
    }
  })

  const totalSiswa = saranaAktif.reduce((acc, item) => acc + Number(item.jumlah_siswa || 0), 0)
  const totalGuru = saranaAktif.reduce((acc, item) => acc + Number(item.jumlah_guru || 0), 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 scroll-slide-left">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c1b01] to-[#1a1200] text-white shadow-lg mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Sarana Pendidikan Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal max-w-3xl mx-auto leading-relaxed">
              Fasilitas dan lembaga pendidikan resmi di Nagari Aia Manggih Barat. Silakan pilih tingkat pendidikan di bawah ini untuk melihat daftar sekolah.
            </p>
          </div>

          {/* Ringkasan Keseluruhan jika ada data */}
          {pendataan && !error && (
            <div className="mb-12 rounded-2xl border border border-gray-200/80 bg-gradient-to-br from-white via-[#f7f2e8]/40 to-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Pendataan Pendidikan Tahun {pendataan.tahun_pendataan}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sumber Data: <span className="font-medium text-gray-800">{pendataan.sumber_data}</span>
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-semibold text-[#5a3b0d] hover:text-[#2c1b01] hover:underline"
                >
                  &larr; Kembali ke Beranda
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="rounded-xl bg-[#f0e8db]/60 border border-[#d1c2a0]/40 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-gray-600 font-medium">Total Sarana</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-[#2c1b01] mt-1">
                    {formatAngka(saranaAktif.length)} <span className="text-sm font-normal text-gray-600">Sekolah</span>
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50/80 border border-blue-200/50 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-blue-700 font-medium">Total Siswa</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-blue-700 mt-1">
                    {formatAngka(totalSiswa)} <span className="text-sm font-normal text-blue-600">Orang</span>
                  </p>
                </div>
                <div className="rounded-xl bg-green-50/80 border border-green-200/50 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-green-700 font-medium">Total Guru</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-green-700 mt-1">
                    {formatAngka(totalGuru)} <span className="text-sm font-normal text-green-600">Orang</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid Pilihan Tingkat Pendidikan */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="w-2.5 h-6 bg-[#2c1b01] rounded-full inline-block"></span>
              Pilih Tingkat Pendidikan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rekapTingkat.map((item) => (
                <Link
                  key={item.slug}
                  href={`/sarana-pendidikan/${item.slug}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.2)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center justify-center rounded-xl bg-[#f0e8db] px-3 py-1.5 text-xs font-bold text-[#2c1b01] group-hover:bg-[#2c1b01] group-hover:text-white transition-colors">
                        {item.dbValue}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {item.jumlahSekolah} Sekolah
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#5a3b0d] transition-colors mb-2">
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-[#5a3b0d] pt-4 border-t border-gray-100 group-hover:text-[#2c1b01]">
                    <span>Lihat Daftar Sekolah</span>
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
