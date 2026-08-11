import { connection } from "next/server"
import { fetchGaleriFotoAktif, type GaleriFotoPublik } from "@/lib/galeri"
import GaleriGrid from "@/components/GaleriGrid"

export default async function GaleriPage() {
  await connection()

  let foto: GaleriFotoPublik[] = []
  let gagalMemuat = false

  try {
    foto = await fetchGaleriFotoAktif()
  } catch {
    gagalMemuat = true
  }

  return (
    <div className="min-h-screen bg-public-warm text-[#1F2937]">
      <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14 scroll-slide-left">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
              Dokumentasi Visual
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Galeri Nagari
            </h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mt-2">
              Dokumentasi foto kegiatan, kebudayaan, dan aktivitas masyarakat Nagari Aia Manggih Barat
            </p>
            <div className="gonjong-line max-w-xs mx-auto mt-4"></div>
          </div>

          {/* Galeri Grid Dinamis */}
          <GaleriGrid foto={foto} gagalMemuat={gagalMemuat} />
        </div>
      </div>
    </div>
  )
}
