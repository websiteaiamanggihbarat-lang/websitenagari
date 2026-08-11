"use client"

import { useState } from "react"
import Link from "next/link"
import { KartuLembagaOrganisasiPublik, getTwoSentences } from "@/lib/lembagaOrganisasi"

interface Props {
  daftar: KartuLembagaOrganisasiPublik[]
  loadError?: string | null
}

export default function LembagaOrganisasiDinamis({ daftar, loadError }: Props) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
          <svg className="h-7 w-7" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Gagal Memuat Data</h3>
        <p className="mt-2 text-sm text-gray-600">{loadError}</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#6b4b1d] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  if (daftar.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-[#6b4b1d] shadow-inner mb-4">
          <svg className="h-8 w-8" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Belum ada lembaga atau organisasi yang dipublikasikan.
        </h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Data akan tampil setelah admin melengkapi foto cover dan mempublikasikannya.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {daftar.map((item, index) => {
        const hasImageFailed = failedImageIds.has(item.id) || !item.foto_url || !item.foto_url.trim()

        return (
          <Link
            key={item.id}
            href={`/lembaga-organisasi/${item.id}`}
            className={`group public-card-hover flex h-full flex-col overflow-hidden cursor-pointer ${
              index % 3 === 0
                ? "scroll-slide-left"
                : index % 3 === 1
                ? "scroll-slide-bottom"
                : "scroll-slide-right"
            }`}
          >
            {/* Foto Cover */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F0E8DB]/60 border-b border-[#E6DDCF]">
              {!hasImageFailed ? (
                <img
                  src={item.foto_url}
                  alt={item.teks_alt || `Foto ${item.nama}`}
                  onError={() => handleImageError(item.id)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#2C1B01] via-[#3D2605] to-[#1A1200] p-4 text-center">
                  <svg className="h-12 w-12 text-[#B6A587]/40 mb-2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="text-xs font-bold text-[#E6DDCF] break-words max-w-xs">{item.nama}</span>
                </div>
              )}
            </div>

            {/* Isi Kartu */}
            <div className="flex flex-1 flex-col p-6 bg-white justify-between">
              <div>
                {/* Nama Lembaga / Organisasi */}
                <h2 className="text-xl font-extrabold text-[#1F2937] tracking-tight break-words group-hover:text-[#2C1B01] transition-colors mb-3 leading-snug">
                  {item.nama}
                </h2>

                {/* Ringkasan Profil/Deskripsi Maksimal 2 Kalimat */}
                <p className="text-sm text-gray-600 leading-relaxed break-words line-clamp-3">
                  {getTwoSentences(item.deskripsi)}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E6DDCF]/50 flex items-center justify-between text-xs font-bold text-[#2C1B01]">
                <span>Lihat Profil Detail</span>
                <svg className="w-4 h-4 text-[#B6A587] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
