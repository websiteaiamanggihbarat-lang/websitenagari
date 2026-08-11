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
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Halaman Publik */}
          <div className="text-center mb-14 scroll-slide-left">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
              Kelembagaan
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Lembaga dan Organisasi Nagari
            </h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mt-2">
              Profil, struktur pengurus, dan informasi lembaga kemasyarakatan yang aktif di Nagari Aia Manggih Barat
            </p>
            <div className="gonjong-line max-w-xs mx-auto mt-4" />
          </div>

          {/* Daftar Kartu Publik Dinamis */}
          <LembagaOrganisasiDinamis daftar={daftar} loadError={loadError} />
        </div>
      </div>
    </div>
  )
}
