"use client"

import { useState, useEffect } from "react"
import type { GaleriFotoPublik } from "@/lib/galeri"

type GaleriGridProps = {
  foto: GaleriFotoPublik[]
  gagalMemuat?: boolean
}

export default function GaleriGrid({
  foto,
  gagalMemuat = false,
}: GaleriGridProps) {
  const [selectedFoto, setSelectedFoto] = useState<GaleriFotoPublik | null>(null)
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())

  // Lock body scroll saat modal fullscreen terbuka
  useEffect(() => {
    if (selectedFoto) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedFoto(null)
        }
      }

      document.addEventListener("keydown", handleKeyDown)

      return () => {
        document.body.style.overflow = originalOverflow
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [selectedFoto])

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  // State Query Gagal
  if (gagalMemuat) {
    return (
      <div className="public-card p-8 text-center text-red-800 bg-red-50/50 border-red-200">
        <p className="text-base font-bold">
          Galeri belum dapat dimuat. Silakan coba kembali nanti.
        </p>
      </div>
    )
  }

  // State Data Kosong
  if (foto.length === 0) {
    return (
      <div className="public-card p-12 text-center bg-white">
        <div className="w-14 h-14 bg-[#F0E8DB] text-[#2C1B01] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#B6A587]/40 shadow-sm">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-extrabold text-[#1F2937]">
          Belum ada foto galeri yang ditambahkan.
        </h3>
      </div>
    )
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {foto.map((item, index) => {
          const isFailed = failedImageIds.has(item.id)
          const altText = item.teks_alt ?? "Foto Galeri Nagari Aia Manggih Barat"

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedFoto(item)}
              aria-label={`Buka foto: ${altText}`}
              className={`group public-card-hover relative aspect-[4/3] w-full overflow-hidden cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#B6A587] ${
                index % 3 === 0
                  ? "scroll-slide-left"
                  : index % 3 === 1
                  ? "scroll-slide-bottom"
                  : "scroll-slide-right"
              }`}
            >
              {isFailed ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#F0E8DB]/40 p-4 text-center text-gray-500">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-xs font-medium">Foto tidak dapat dimuat</p>
                </div>
              ) : (
                <img
                  src={item.foto_url}
                  alt={altText}
                  loading="lazy"
                  decoding="async"
                  onError={() => handleImageError(item.id)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1200]/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white truncate max-w-[80%]">
                    {item.teks_alt || "Foto Galeri"}
                  </p>
                  <div className="w-8 h-8 rounded-full bg-[#B6A587] text-[#1A1200] flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal Fullscreen Lightbox */}
      {selectedFoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tampilan penuh foto: ${
            selectedFoto.teks_alt ?? "Foto Galeri Nagari Aia Manggih Barat"
          }`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1200]/95 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedFoto(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedFoto(null)}
            className="absolute top-4 right-4 z-10 bg-[#B6A587] hover:bg-[#c9b99b] text-[#1A1200] rounded-full p-3 shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B6A587]"
            aria-label="Tutup tampilan foto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedFoto.foto_url}
              alt={selectedFoto.teks_alt ?? "Foto Galeri Nagari Aia Manggih Barat"}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-[#B6A587]/30 shadow-2xl"
            />
            {selectedFoto.teks_alt && (
              <p className="mt-4 text-center text-xs sm:text-sm font-semibold text-[#E6DDCF] bg-[#2C1B01]/90 px-4 py-2 rounded-full border border-[#B6A587]/30 max-w-xl shadow-lg">
                {selectedFoto.teks_alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
