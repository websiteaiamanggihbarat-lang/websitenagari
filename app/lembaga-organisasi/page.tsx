import { Metadata } from "next"
import { connection } from "next/server"
import {
  KartuLembagaOrganisasiPublik,
  fetchDaftarLembagaOrganisasiPublik,
} from "@/lib/lembagaOrganisasi"
import LembagaOrganisasiDinamis from "@/components/LembagaOrganisasiDinamis"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Lembaga dan Organisasi Nagari — Nagari Aia Manggih Barat",
  description:
    "Daftar lembaga dan organisasi kemasyarakatan di Nagari Aia Manggih Barat.",
}

export default async function LembagaOrganisasiIndexPage() {
  await connection()

  let daftar: KartuLembagaOrganisasiPublik[] = []
  let loadError: string | null = null

  try {
    daftar = await fetchDaftarLembagaOrganisasiPublik()
  } catch {
    loadError = "Data lembaga dan organisasi belum dapat dimuat. Silakan coba kembali."
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-white to-[#f7f3eb]">
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Halaman Publik */}
          <div className="text-center mb-12 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Lembaga dan Organisasi Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6" />
            <p className="text-lg md:text-xl text-gray-600 font-normal max-w-3xl mx-auto leading-relaxed">
              Lembaga dan organisasi yang ada di Nagari Aia Manggih Barat.
            </p>
          </div>

          {/* Daftar Kartu Publik Dinamis */}
          <LembagaOrganisasiDinamis daftar={daftar} loadError={loadError} />
        </div>
      </div>
    </div>
  )
}
