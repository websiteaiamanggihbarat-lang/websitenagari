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
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Galeri Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal max-w-2xl mx-auto">
              Dokumentasi kegiatan dan aktivitas Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Galeri Grid Dinamis */}
          <GaleriGrid foto={foto} gagalMemuat={gagalMemuat} />
        </div>
      </div>
    </div>
  )
}
