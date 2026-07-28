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
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-white to-[#f7f3eb]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Navigasi Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/kesenian-tradisional" className="hover:text-gray-900 transition">
              Kesenian Tradisional
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate">{detail.nama_kesenian}</span>
          </div>

          {/* Carousel Galeri Foto */}
          <div className="mb-10">
            <KesenianCarousel
              slides={slides}
              aspectRatio="aspect-[16/9]"
              autoPlayInterval={5000}
              className="shadow-2xl"
            />
          </div>

          {/* Main Content Info */}
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 shadow-lg">
            {/* Badges & Header Title */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  {getLabelKategoriKesenian(detail.kategori)}
                </span>
                {detail.alamat && (
                  <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                    <svg
                      className="mr-1 h-3.5 w-3.5 text-amber-700"
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

              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
                {detail.nama_kesenian}
              </h1>

              {detail.deskripsi_singkat && (
                <p className="mt-3 text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
                  {detail.deskripsi_singkat}
                </p>
              )}
            </div>

            {/* Grid Detail Informasional */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mb-8">
              {/* Kelompok Pengelola & Ketua */}
              {(detail.nama_kelompok_pengelola || detail.nama_ketua) && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Pengelola & Pengurus
                  </h3>
                  <div className="space-y-2 text-sm text-gray-800">
                    {detail.nama_kelompok_pengelola && (
                      <div>
                        <span className="font-semibold text-gray-600 block text-xs">Sanggar / Kelompok:</span>
                        <span className="font-medium text-gray-900">{detail.nama_kelompok_pengelola}</span>
                      </div>
                    )}
                    {detail.nama_ketua && (
                      <div>
                        <span className="font-semibold text-gray-600 block text-xs">Ketua / Penanggung Jawab:</span>
                        <span className="font-medium text-gray-900">{detail.nama_ketua}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kontak & Jadwal Latihan */}
              {(detail.nomor_kontak || detail.jadwal_latihan) && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Kontak & Jadwal Kegiatan
                  </h3>
                  <div className="space-y-2 text-sm text-gray-800">
                    {detail.jadwal_latihan && (
                      <div>
                        <span className="font-semibold text-gray-600 block text-xs">Jadwal Latihan:</span>
                        <span className="font-medium text-gray-900">{detail.jadwal_latihan}</span>
                      </div>
                    )}
                    {detail.nomor_kontak && (
                      <div>
                        <span className="font-semibold text-gray-600 block text-xs">Nomor Kontak:</span>
                        {isPhoneValid ? (
                          <a
                            href={`https://wa.me/${numDigits.startsWith("0") ? "62" + numDigits.slice(1) : numDigits.replace("+", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center font-semibold text-emerald-700 hover:underline"
                          >
                            <svg className="w-4 h-4 mr-1 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                            </svg>
                            {detail.nomor_kontak}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-900">{detail.nomor_kontak}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Penjelasan Lengkap / Sejarah */}
            {detail.penjelasan_lengkap && (
              <div className="mb-8 border-t border-gray-100 pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Penjelasan & Sejarah Kesenian</h2>
                <div className="prose prose-amber max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {detail.penjelasan_lengkap}
                </div>
              </div>
            )}

            {/* Tautan Peta Lokasi */}
            {detail.tautan_peta && (
              <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Lokasi Peta Pementasan / Sanggar</h3>
                  <p className="text-xs text-gray-500">Buka peta lokasi di Google Maps untuk petunjuk arah.</p>
                </div>
                <a
                  href={detail.tautan_peta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#4a3210] transition"
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
