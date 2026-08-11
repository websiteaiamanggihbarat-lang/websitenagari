import { connection } from "next/server"
import {
  fetchStrukturOrganisasiPublik,
  type StrukturOrganisasiPublik,
} from "@/lib/strukturOrganisasi"
import StrukturOrganisasiDinamis from "@/components/StrukturOrganisasiDinamis"

export const metadata = {
  title: "Struktur Organisasi | Nagari Aia Manggih Barat",
  description: "Struktur pemerintahan Nagari Aia Manggih Barat.",
}

export default async function StrukturOrganisasiPage() {
  await connection()

  try {
    const data = await fetchStrukturOrganisasiPublik()

    return (
      <div className="min-h-screen bg-public-warm text-[#1F2937]">
        <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-14 scroll-slide-left">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
                Pemerintahan Nagari
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F2937] tracking-tight">
                Struktur Organisasi
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mt-2">
                Bagan dan susunan aparatur Pemerintahan Nagari Aia Manggih Barat
              </p>
              <div className="gonjong-line max-w-xs mx-auto mt-4"></div>
            </div>

            {/* Bagan Struktur Organisasi Dinamis */}
            <StrukturOrganisasiDinamis data={data} />
          </div>
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen bg-public-warm text-[#1F2937]">
        <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-14 scroll-slide-left">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
                Pemerintahan Nagari
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F2937] tracking-tight">
                Struktur Organisasi
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mt-2">
                Bagan dan susunan aparatur Pemerintahan Nagari Aia Manggih Barat
              </p>
              <div className="gonjong-line max-w-xs mx-auto mt-4"></div>
            </div>

            {/* Error State */}
            <div className="public-card p-8 text-center bg-red-50/50 border-red-200 shadow-sm max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-extrabold text-[#1F2937]">
                Struktur organisasi belum dapat dimuat. Silakan coba kembali nanti.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
