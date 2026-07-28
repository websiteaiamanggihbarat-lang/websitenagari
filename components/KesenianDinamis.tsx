import { connection } from "next/server"
import Link from "next/link"
import KesenianCarousel, { KesenianSlide } from "@/components/KesenianCarousel"
import {
  fetchKesenianAktifDenganCover,
  getLabelKategoriKesenian,
} from "@/lib/kesenian"

export const dynamic = "force-dynamic"

export default async function KesenianDinamis() {
  await connection()

  // Ambil kesenian aktif beserta cover aktif (eksplisit is_active = true)
  const listKesenian = await fetchKesenianAktifDenganCover()

  // Konversi data kesenian menjadi slide carousel
  const slides: KesenianSlide[] = listKesenian.map((item) => ({
    id: item.id,
    fotoUrl: item.cover?.foto_url || "",
    teksAlt: item.cover?.teks_alt || item.nama_kesenian,
    judul: item.nama_kesenian,
    subjudul: `${getLabelKategoriKesenian(item.kategori)}${
      item.alamat ? ` • ${item.alamat}` : ""
    }`,
    caption: item.deskripsi_singkat,
    href: `/kesenian-tradisional/${item.id}`,
  }))

  return (
    <div className="group rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] scroll-slide-right">
      {/* Header Container */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a3210] to-[#2c1b01] shadow-lg shadow-[rgba(44,27,1,0.25)] transition-transform group-hover:scale-110">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              Kesenian Tradisional
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sanggar seni, tari, dan musik kebudayaan Nagari Aia Manggih Barat.
            </p>
          </div>
        </div>

        <Link
          href="/kesenian-tradisional"
          className="inline-flex items-center text-xs font-semibold text-[#6b4b1d] hover:text-[#2c1b01] transition"
        >
          Lihat Semua Kesenian →
        </Link>
      </div>

      {/* Carousel Kesenian / Empty State */}
      {slides.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-8 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Belum ada kesenian tradisional yang dipublikasikan.</p>
          <p className="mt-1 text-xs text-gray-400">Silakan kembali lagi nanti untuk melihat pembaruan data kesenian.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl shadow-md">
          <KesenianCarousel
            slides={slides}
            aspectRatio="aspect-[16/9]"
            autoPlayInterval={5000}
            showCaptionOverlay={true}
          />
        </div>
      )}
    </div>
  )
}
