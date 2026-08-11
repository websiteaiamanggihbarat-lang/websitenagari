import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import KesenianCarousel, { KesenianSlide } from "@/components/KesenianCarousel"
import {
  getDetailKelompokTaniBumnagAktif,
  getLabelBidang,
  getLabelJenisEntitas,
  getLabelJenisItem,
  getLabelPimpinan,
} from "@/lib/kelompokTaniBumnag"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  params: Promise<{
    dataId: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const dataId = resolvedParams?.dataId || ""

  if (!dataId) {
    return {
      title: "Data Tidak Ditemukan — Nagari Aia Manggih Barat",
    }
  }

  const detail = await getDetailKelompokTaniBumnagAktif(dataId)
  if (!detail || !detail.is_active) {
    return {
      title: "Data Tidak Ditemukan — Nagari Aia Manggih Barat",
    }
  }

  return {
    title: `${detail.nama_entitas} — ${getLabelJenisEntitas(detail.jenis_entitas)} Nagari`,
    description:
      detail.deskripsi ||
      `Profil dan informasi rincian ${getLabelJenisEntitas(detail.jenis_entitas)} ${detail.nama_entitas} di Nagari Aia Manggih Barat.`,
  }
}

export default async function DetailKelompokTaniBumnagPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const dataId = resolvedParams?.dataId || ""

  if (!dataId) {
    notFound()
  }

  // Fetch detail entitas aktif beserta galeri aktif dan produk aktif
  const detail = await getDetailKelompokTaniBumnagAktif(dataId)

  // Keamanan metadata & privasi: ID salah atau entitas draft WAJIB 404 (notFound)
  if (!detail || !detail.is_active) {
    notFound()
  }

  // Format slides untuk KesenianCarousel
  const slides: KesenianSlide[] = detail.galeri.map((g) => ({
    id: g.id,
    fotoUrl: g.foto_url,
    teksAlt: g.teks_alt || detail.nama_entitas,
    caption: g.caption,
    subjudul: g.is_cover ? "Foto Utama Cover" : undefined,
  }))

  // Format link WhatsApp / telepon jika kontak valid
  const numDigits = String(detail.nomor_kontak || "").replace(/[^0-9+]/g, "")
  const isPhoneValid = numDigits.length >= 8
  const waUrl = isPhoneValid
    ? `https://wa.me/${numDigits.startsWith("0") ? "62" + numDigits.slice(1) : numDigits}`
    : null

  return (
    <div className="min-h-screen bg-public-warm text-[#1F2937]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Navigasi Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/kelompok-tani-bumnag" className="hover:text-gray-900 transition">
              Kelompok Tani & BUMNag
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate">{detail.nama_entitas}</span>
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

          {/* Main Layout Grid (2 Columns) */}
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-3">
            {/* Left Main Content Area (2 Cols) */}
            <div className="lg:col-span-2 space-y-8 sm:space-y-10">
              {/* Header Entitas */}
              <div className="rounded-2xl border border-[#d1c2a0]/70 bg-gradient-to-br from-[#fbfaf7] via-white to-[#f7f2ea]/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-bold rounded-lg text-white shadow-xs ${
                      detail.jenis_entitas === "kelompok_tani"
                        ? "bg-emerald-700"
                        : "bg-blue-700"
                    }`}
                  >
                    {getLabelJenisEntitas(detail.jenis_entitas)}
                  </span>
                  <span className="text-xs font-semibold text-[#5a3b0d] bg-[#f0e8db] border border-[#d1c2a0]/60 px-3 py-1 rounded-lg">
                    {getLabelBidang(detail.jenis_entitas)}: {detail.bidang_utama}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {detail.nama_entitas}
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-[#2c1b01] via-[#b6a587] to-transparent rounded-full mt-4" />
              </div>

              {/* Seksi Deskripsi Lengkap */}
              <section className="space-y-5 sm:space-y-6">
                <div className="flex items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border border-[#d1c2a0] shadow-xs">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md mr-3.5 flex-shrink-0 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Profil & Deskripsi</h2>
                    <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Penjelasan lengkap seputar kegiatan entitas</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="prose prose-stone max-w-none text-gray-800 leading-relaxed sm:leading-loose whitespace-pre-line text-sm sm:text-base text-justify">
                    {detail.deskripsi}
                  </div>
                </div>
              </section>

              {/* Seksi Produk, Unit Usaha, & Jasa */}
              <section className="space-y-5 sm:space-y-6">
                <div className="flex items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border border-[#d1c2a0] shadow-xs">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md mr-3.5 flex-shrink-0 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Produk, Unit Usaha, & Jasa</h2>
                    <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Daftar hasil kegiatan, produk panen, unit bisnis, atau jasa</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 sm:p-8 shadow-xs">
                  {detail.produk_usaha.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-[#fbfaf7] rounded-xl border border-[#d1c2a0]/60">
                      <p className="text-sm font-medium">Belum ada daftar produk / unit usaha yang dipublikasikan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {detail.produk_usaha.map((prod) => (
                        <div
                          key={prod.id}
                          className="p-5 rounded-xl border border-[#d1c2a0]/60 bg-[#fbfaf7] hover:bg-white transition shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0e8db] text-[#2c1b01] border border-[#d1c2a0]/50">
                              {getLabelJenisItem(prod.jenis_item)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">{prod.nama_produk_usaha}</h3>
                          {prod.deskripsi && (
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                              {prod.deskripsi}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Sidebar (1 Col) */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-md space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Informasi Detail
                </h3>

                <div className="space-y-4 text-sm">
                  {/* Pimpinan */}
                  <div>
                    <span className="block text-xs font-semibold uppercase text-gray-500">
                      {getLabelPimpinan(detail.jenis_entitas)}
                    </span>
                    <span className="font-semibold text-gray-900 text-base">
                      {detail.nama_pimpinan || "-"}
                    </span>
                  </div>

                  {/* Tahun Berdiri */}
                  <div>
                    <span className="block text-xs font-semibold uppercase text-gray-500">
                      Tahun Berdiri
                    </span>
                    <span className="font-medium text-gray-800">
                      {detail.tahun_berdiri ? `${detail.tahun_berdiri}` : "-"}
                    </span>
                  </div>

                  {/* Jumlah Anggota */}
                  <div>
                    <span className="block text-xs font-semibold uppercase text-gray-500">
                      Jumlah Anggota
                    </span>
                    <span className="font-medium text-gray-800">
                      {detail.jumlah_anggota !== null ? `${detail.jumlah_anggota} Orang` : "-"}
                    </span>
                  </div>

                  {/* Wilayah Kegiatan */}
                  <div>
                    <span className="block text-xs font-semibold uppercase text-gray-500">
                      Wilayah Kegiatan
                    </span>
                    <span className="font-medium text-gray-800">
                      {detail.wilayah_kegiatan || "-"}
                    </span>
                  </div>

                  {/* Alamat Fisik */}
                  <div>
                    <span className="block text-xs font-semibold uppercase text-gray-500">
                      Alamat Sekretariat
                    </span>
                    <span className="font-medium text-gray-800 leading-snug block">
                      {detail.alamat || "-"}
                    </span>
                  </div>

                  {/* Nomor Kontak */}
                  <div>
                    <span className="block text-xs font-semibold uppercase text-gray-500">
                      Nomor Kontak / WhatsApp
                    </span>
                    {detail.nomor_kontak ? (
                      waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-1 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                        >
                          <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                          {detail.nomor_kontak}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-800">{detail.nomor_kontak}</span>
                      )
                    ) : (
                      <span className="font-medium text-gray-800">-</span>
                    )}
                  </div>
                </div>

                {/* Tautan Peta */}
                {detail.tautan_peta && (
                  <div className="pt-4 border-t border-gray-100">
                    <a
                      href={detail.tautan_peta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full rounded-xl bg-amber-500 text-gray-950 px-4 py-2.5 text-xs font-bold shadow hover:bg-amber-400 transition"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Buka Peta Lokasi (Google Maps)
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
