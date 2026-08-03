"use client"

import { useState } from "react"
import Link from "next/link"
import {
  KartuLembagaOrganisasiPublik,
  formatJenisLembagaOrganisasi,
} from "@/lib/lembagaOrganisasi"

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
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-gray-300 bg-white/80 p-10 text-center shadow-sm backdrop-blur-sm">
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
      {daftar.map((item) => {
        const hasImageFailed = failedImageIds.has(item.id)

        return (
          <div
            key={item.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b6a587] hover:shadow-xl"
          >
            {/* Foto Cover */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {!hasImageFailed ? (
                <img
                  src={item.foto_url}
                  alt={item.teks_alt || `Foto ${item.nama}`}
                  onError={() => handleImageError(item.id)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 text-center">
                  <svg className="h-10 w-10 text-[#6b4b1d]/40 mb-2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 break-words max-w-xs">{item.nama}</span>
                </div>
              )}

              {/* Badge Jenis */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center rounded-lg bg-[#2c1b01]/90 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                  {formatJenisLembagaOrganisasi(item.jenis)}
                </span>
              </div>
            </div>

            {/* Isi Kartu */}
            <div className="flex flex-1 flex-col p-6">
              {/* Nama */}
              <h2 className="text-xl font-bold text-gray-900 tracking-tight break-words line-clamp-2 min-h-[56px] group-hover:text-[#6b4b1d] transition-colors">
                {item.nama}
              </h2>

              {/* Detail Alamat & Kontak */}
              <div className="mt-4 space-y-2.5 text-sm text-gray-600 flex-1">
                {/* Alamat */}
                <div className="flex items-start gap-2.5" title={item.alamat}>
                  <svg className="h-5 w-5 flex-shrink-0 text-[#6b4b1d] mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <span className="line-clamp-2 break-words text-xs leading-relaxed text-gray-700">{item.alamat}</span>
                </div>

                {/* Kontak */}
                <div className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 flex-shrink-0 text-[#6b4b1d]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-xs text-gray-600 break-words">
                    {item.kontak || <span className="italic text-gray-400">Kontak belum tersedia</span>}
                  </span>
                </div>
              </div>

              {/* Tombol Lihat Rincian (Aktif) */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  href={`/lembaga-organisasi/${item.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#6b4b1d] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  <span>Lihat Rincian</span>
                  <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
