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
      <div className="min-h-screen bg-white">
        <div className="pt-24 pb-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16 scroll-slide-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Struktur Organisasi
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 font-normal">
                Struktur Pemerintahan Nagari Aia Manggih Barat
              </p>
            </div>

            {/* Bagan Struktur Organisasi Dinamis */}
            <StrukturOrganisasiDinamis data={data} />
          </div>
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen bg-white">
        <div className="pt-24 pb-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16 scroll-slide-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Struktur Organisasi
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 font-normal">
                Struktur Pemerintahan Nagari Aia Manggih Barat
              </p>
            </div>

            {/* Error State */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-sm">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-3 text-base font-semibold text-red-900">
                Struktur organisasi belum dapat dimuat. Silakan coba kembali nanti.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
