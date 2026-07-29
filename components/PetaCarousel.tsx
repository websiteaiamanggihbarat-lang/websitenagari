"use client"

import { useEffect, useRef, useState } from "react"

export type PetaSlide = {
  id: string
  judul: string
  jenis: string
  labelJenis: string
  deskripsi: string | null
  tahun: number
  sumber: string
  gambarUrl: string
  teksAlt: string
  fileUrl: string | null
}

export type PetaCarouselProps = {
  slides: PetaSlide[]
}

export default function PetaCarousel({ slides }: PetaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({})

  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  // Pastikan activeIndex tetap dalam rentang valid jika slides berubah
  useEffect(() => {
    if (slides.length === 0) return
    if (activeIndex >= slides.length) {
      setActiveIndex(0)
    }
  }, [slides, activeIndex])

  // Deteksi setting prefers-reduced-motion dari sistem (hanya di client effect)
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else if ("addListener" in mediaQuery) {
      ;(mediaQuery as any).addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else if ("removeListener" in mediaQuery) {
        ;(mediaQuery as any).removeListener(handleChange)
      }
    }
  }, [])

  // Autoplay 8 detik jika slide > 1 dan tidak sedang dipause / reduced motion
  useEffect(() => {
    if (slides.length <= 1 || isPaused || prefersReducedMotion || isModalOpen) {
      return
    }

    const intervalId = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length)
    }, 8000)

    return () => clearInterval(intervalId)
  }, [slides.length, isPaused, prefersReducedMotion, isModalOpen])

  // Keyboard Escape & Scroll Lock untuk Modal Zoom
  useEffect(() => {
    if (!isModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    // Fokuskan tombol tutup saat modal terbuka
    if (closeButtonRef.current) {
      closeButtonRef.current.focus()
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isModalOpen])

  if (!slides || slides.length === 0) {
    return null
  }

  const currentSlide = slides[activeIndex] || slides[0]
  const isMultiple = slides.length > 1

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  // Event handlers untuk touch / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    touchStartXRef.current = e.touches[0].clientX
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current
      const minSwipeDistance = 50

      if (diff > minSwipeDistance && isMultiple) {
        goToNext()
      } else if (diff < -minSwipeDistance && isMultiple) {
        goToPrevious()
      }
    }
    touchStartXRef.current = null
    touchEndXRef.current = null
    setIsPaused(false)
  }

  const handleFocusCapture = () => setIsPaused(true)
  const handleBlurCapture = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsPaused(false)
    }
  }

  const handleImageError = (id: string) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div
      className="group/carousel relative w-full space-y-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-live="polite"
    >
      {/* Container Utama Slider Peta */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-[#fdfbf7] to-[#f7f2e8] shadow-lg transition-all duration-300 hover:border-[#c0ae86] hover:shadow-xl">
        
        {/* Frame Gambar Utama Peta */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#f0e8db]/40 flex items-center justify-center cursor-pointer group/img select-none">
          {imageErrorMap[currentSlide.id] ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-gray-500">
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="font-semibold text-gray-800">Gambar peta tidak dapat dimuat.</p>
              <p className="text-xs text-gray-400 mt-1">Silakan periksa koneksi internet Anda atau hubungi admin.</p>
            </div>
          ) : (
            <img
              src={currentSlide.gambarUrl}
              alt={currentSlide.teksAlt}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => handleImageError(currentSlide.id)}
              onClick={() => setIsModalOpen(true)}
              className={`h-full w-full object-contain transition-transform duration-500 ${
                prefersReducedMotion ? "" : "group-hover/img:scale-105"
              }`}
            />
          )}

          {/* Overlay & Tombol Zoom (Perbesar Peta) */}
          <div
            className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsModalOpen(true)
              }}
              aria-label={`Perbesar ${currentSlide.judul}`}
              className="pointer-events-auto opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center gap-2 rounded-full bg-[#2c1b01]/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-xl hover:bg-[#2c1b01] hover:scale-105 transition-all"
            >
              <svg
                className="w-4 h-4"
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
              <span>Perbesar Peta</span>
            </button>
          </div>

          {/* Badge Jenis Peta di Pojok Kiri Atas */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center rounded-xl bg-[#2c1b01]/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-amber-200 border border-amber-500/30 shadow-md">
              {currentSlide.labelJenis}
            </span>
          </div>

          {/* Tombol Navigasi Previous / Next (Hanya tampil jika slides > 1) */}
          {isMultiple && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Tampilkan peta sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-gray-900 shadow-md transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={goToNext}
                aria-label="Tampilkan peta berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-gray-900 shadow-md transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Info & Metadata Peta */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                {currentSlide.judul}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600">
                <span className="inline-flex items-center text-[#2c1b01]">
                  Tahun {currentSlide.tahun}
                </span>
                <span>•</span>
                <span className="text-gray-600">Sumber: {currentSlide.sumber}</span>
              </div>
            </div>

            {/* Tombol PDF Unduhan (Jika fileUrl tersedia) */}
            {currentSlide.fileUrl && (
              <a
                href={currentSlide.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka dokumen PDF ${currentSlide.judul}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2c1b01] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#4a3210] hover:shadow-lg transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Buka / Unduh PDF ↗</span>
              </a>
            )}
          </div>

          {currentSlide.deskripsi && currentSlide.deskripsi.trim() !== "" && (
            <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-200/80 pt-3">
              {currentSlide.deskripsi.trim()}
            </p>
          )}
        </div>
      </div>

      {/* Indikator Slide (Dot Buttons) - Hanya tampil jika slides > 1 */}
      {isMultiple && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Tampilkan peta ${index + 1}: ${slide.judul}`}
                aria-current={isActive ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-8 bg-[#2c1b01]"
                    : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            )
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tampilan Peta Fullscreen - ${currentSlide.judul}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Close Button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsModalOpen(false)}
            aria-label="Tutup tampilan peta penuh"
            className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-3 text-gray-900 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Content Container */}
          <div
            className="relative flex max-h-[95vh] max-w-[95vw] flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentSlide.gambarUrl}
              alt={`${currentSlide.teksAlt} - Fullscreen`}
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-3 rounded-lg bg-black/60 px-4 py-2 text-center text-white backdrop-blur-md">
              <p className="text-sm font-bold">{currentSlide.judul}</p>
              <p className="text-xs text-amber-200 mt-0.5">
                {currentSlide.labelJenis} • Tahun {currentSlide.tahun} • Sumber: {currentSlide.sumber}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
