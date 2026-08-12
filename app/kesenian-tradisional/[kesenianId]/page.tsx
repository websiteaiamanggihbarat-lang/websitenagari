import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import KesenianCarousel, { KesenianSlide } from "@/components/KesenianCarousel"
import {
  fetchDetailKesenianAktif,
  getLabelKategoriKesenian,
} from "@/lib/kesenian"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  params: Promise<{
    kesenianId: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const kesenianId = resolvedParams?.kesenianId || ""

  if (!kesenianId) {
    return {
      title: "Kesenian Tradisional Tidak Ditemukan — Nagari Aia Manggih Barat",
    }
  }

  const detail = await fetchDetailKesenianAktif(kesenianId)
  if (!detail || !detail.is_active) {
    return {
      title: "Kesenian Tradisional Tidak Ditemukan — Nagari Aia Manggih Barat",
    }
  }

  return {
    title: `${detail.nama_kesenian} — Kesenian Tradisional Nagari`,
    description:
      detail.deskripsi_singkat ||
      `Informasi detail kebudayaan dan kelompok kesenian ${detail.nama_kesenian} di Nagari Aia Manggih Barat.`,
  }
}

export default async function DetailKesenianPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const kesenianId = resolvedParams?.kesenianId || ""

  if (!kesenianId) {
    notFound()
  }

  // Fetch detail kesenian aktif beserta galeri aktifnya
  const detail = await fetchDetailKesenianAktif(kesenianId)

  if (!detail || !detail.is_active) {
    notFound()
  }

  // Format slides untuk KesenianCarousel
  const slides: KesenianSlide[] = detail.galeri.map((g) => ({
    id: g.id,
    fotoUrl: g.foto_url,
    teksAlt: g.teks_alt || detail.nama_kesenian,
    caption: g.caption,
    subjudul: g.is_cover ? "Foto Utama Cover" : undefined,
  }))

  // Format aman nomor kontak
  const numDigits = String(detail.nomor_kontak || "").replace(/[^0-9+]/g, "")
  const isPhoneValid = numDigits.length >= 8

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Carousel Galeri Foto */}
          <div className="mb-10">
            <KesenianCarousel
              slides={slides}
              aspectRatio="aspect-[16/9]"
              autoPlayInterval={5000}
              className="shadow-2xl"
            />
          </div>

          {/* Main Content Info (Independent Breathable Cards) */}
          <div className="space-y-8 sm:space-y-10">
            {/* Header Identitas Card */}
            <div className="rounded-2xl border border-[#d1c2a0]/70 bg-gradient-to-br from-[#fbfaf7] via-white to-[#f7f2ea]/80 p-6 sm:p-8 lg:p-10 shadow-xs">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center rounded-lg bg-[#f0e8db] border border-[#d1c2a0] px-3.5 py-1.5 text-xs font-bold text-[#2c1b01] tracking-wider uppercase shadow-2xs">
                  {getLabelKategoriKesenian(detail.kategori)}
                </span>
                {detail.alamat && (
                  <span className="inline-flex items-center text-xs font-semibold text-gray-700 bg-white border border-[#d1c2a0]/60 px-3 py-1.5 rounded-lg shadow-2xs">
                    <svg
                      className="mr-1.5 h-3.5 w-3.5 text-[#5a3b0d]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {detail.alamat}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl">
                {detail.nama_kesenian}
              </h1>

              {detail.deskripsi_singkat && (
                <p className="mt-4 text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
                  {detail.deskripsi_singkat}
                </p>
              )}
              <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] via-[#b6a587] to-transparent rounded-full mt-5" />
            </div>

            {/* Grid Detail Informasional (Pengurus & Kontak) */}
            {(detail.nama_kelompok_pengelola || detail.nama_ketua || detail.nomor_kontak || detail.jadwal_latihan) && (
              <section className="space-y-5 sm:space-y-6">
                <div className="flex items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border border-[#d1c2a0] shadow-xs">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md mr-3.5 flex-shrink-0 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informasi Pengelola & Kegiatan</h2>
                    <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Rincian pengurus sanggar, kontak, dan jadwal latihan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Kelompok Pengelola & Ketua */}
                  {(detail.nama_kelompok_pengelola || detail.nama_ketua) && (
                    <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5a3b0d] border-b border-[#d1c2a0]/50 pb-2">
                        Pengelola & Pengurus
                      </h3>
                      <div className="space-y-3 text-sm text-gray-800">
                        {detail.nama_kelompok_pengelola && (
                          <div>
                            <span className="font-semibold text-gray-500 block text-xs">Sanggar / Kelompok:</span>
                            <span className="font-bold text-gray-900 text-base">{detail.nama_kelompok_pengelola}</span>
                          </div>
                        )}
                        {detail.nama_ketua && (
                          <div>
                            <span className="font-semibold text-gray-500 block text-xs">Ketua / Penanggung Jawab:</span>
                            <span className="font-bold text-gray-900 text-base">{detail.nama_ketua}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kontak & Jadwal Latihan */}
                  {(detail.nomor_kontak || detail.jadwal_latihan) && (
                    <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5a3b0d] border-b border-[#d1c2a0]/50 pb-2">
                        Kontak & Jadwal Kegiatan
                      </h3>
                      <div className="space-y-3 text-sm text-gray-800">
                        {detail.jadwal_latihan && (
                          <div>
                            <span className="font-semibold text-gray-500 block text-xs">Jadwal Latihan:</span>
                            <span className="font-bold text-gray-900 text-base">{detail.jadwal_latihan}</span>
                          </div>
                        )}
                        {detail.nomor_kontak && (
                          <div>
                            <span className="font-semibold text-gray-500 block text-xs">Nomor Kontak:</span>
                            {isPhoneValid ? (
                              <a
                                href={`https://wa.me/${numDigits.startsWith("0") ? "62" + numDigits.slice(1) : numDigits.replace("+", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center font-bold text-emerald-700 hover:underline text-base mt-0.5"
                              >
                                <svg className="w-4 h-4 mr-1.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                                </svg>
                                {detail.nomor_kontak}
                              </a>
                            ) : (
                              <span className="font-bold text-gray-900 text-base">{detail.nomor_kontak}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Penjelasan Lengkap / Sejarah */}
            {detail.penjelasan_lengkap && (
              <section className="space-y-5 sm:space-y-6">
                <div className="flex items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border border-[#d1c2a0] shadow-xs">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md mr-3.5 flex-shrink-0 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Penjelasan & Sejarah Kesenian</h2>
                    <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Kisah latar belakang dan nilai kebudayaan</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="prose prose-stone max-w-none text-gray-800 leading-relaxed sm:leading-loose whitespace-pre-line text-sm sm:text-base text-justify">
                    {detail.penjelasan_lengkap}
                  </div>
                </div>
              </section>
            )}

            {/* Tautan Peta Lokasi */}
            {detail.tautan_peta && (
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Lokasi Peta Pementasan / Sanggar</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Buka peta lokasi di Google Maps untuk petunjuk arah.</p>
                </div>
                <a
                  href={detail.tautan_peta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#4a3210] transition shrink-0"
                >
                  <svg className="w-4 h-4 mr-2 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Buka Peta Lokasi
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
