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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800 shadow-sm">
        <p className="text-base font-semibold">
          Galeri belum dapat dimuat. Silakan coba kembali nanti.
        </p>
      </div>
    )
  }

  // State Data Kosong
  if (foto.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-3 text-base font-semibold text-gray-900">
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
              className={`group relative aspect-[4/3] w-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 border border-gray-200/50 hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.3)] transition-all duration-300 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#b6a587] ${
                index % 3 === 0
                  ? "scroll-slide-left"
                  : index % 3 === 1
                  ? "scroll-slide-bottom"
                  : "scroll-slide-right"
              }`}
            >
              {isFailed ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 p-4 text-center text-gray-500">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
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
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedFoto(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedFoto(null)}
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Tutup tampilan foto"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedFoto.foto_url}
              alt={
                selectedFoto.teks_alt ?? "Foto Galeri Nagari Aia Manggih Barat"
              }
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            {selectedFoto.teks_alt && (
              <p className="mt-3 text-center text-sm font-medium text-white/90 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm max-w-xl">
                {selectedFoto.teks_alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
