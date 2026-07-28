"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export interface KesenianSlide {
  id: string
  fotoUrl: string
  teksAlt: string
  caption?: string | null
  judul?: string | null
  subjudul?: string | null
  href?: string | null
}

export interface KesenianCarouselProps {
  slides: KesenianSlide[]
  autoPlayInterval?: number
  aspectRatio?: string
  className?: string
  showCaptionOverlay?: boolean
}

export default function KesenianCarousel({
  slides = [],
  autoPlayInterval = 5000,
  aspectRatio = "aspect-[16/9]",
  className = "",
  showCaptionOverlay = true,
}: KesenianCarouselProps) {
  // 1. activeIndex awal selalu 0
  const [activeIndex, setActiveIndex] = useState(0)

  // Explicit interaction states (Point 1 & 2)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTouching, setIsTouching] = useState(false)

  // Reduced motion state
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Computed pause state: paused if ANY interaction state is active
  const isPaused = isHovered || isFocused || isTouching

  // Touch / Swipe State
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const isDragging = useRef(false)

  const MIN_SWIPE_DISTANCE = 40 // Minimal threshold 40px

  // 3. Reset activeIndex jika slides berubah / berkurang
  useEffect(() => {
    if (slides.length > 0 && activeIndex >= slides.length) {
      setActiveIndex(0)
    }
  }, [slides.length, activeIndex])

  // 14. matchMedia hanya dipanggil di useEffect
  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  // 2, 3, 4, 5, 6. Auto-slide useEffect dengan cleanup
  useEffect(() => {
    // Jangan buat interval jika slide <= 1, isPaused, atau reduced-motion aktif
    if (slides.length <= 1 || isPaused || prefersReducedMotion) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, autoPlayInterval)

    return () => {
      clearInterval(timer)
    }
  }, [slides.length, isPaused, prefersReducedMotion, autoPlayInterval])

  // Navigation handlers
  const handlePrev = () => {
    if (slides.length <= 1) return
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleNext = () => {
    if (slides.length <= 1) return
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setActiveIndex(index)
    }
  }

  // Pointer & Focus pause handlers (Point 1 & 2)
  const handlePointerEnter = () => setIsHovered(true)
  const handlePointerLeave = () => setIsHovered(false)

  const handleFocus = () => setIsFocused(true)

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Jika fokus hanya berpindah ke elemen lain di dalam carousel yang sama, tetap pertahankan state isFocused
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }
    setIsFocused(false)
  }

  // Touch Swipe Handlers (Mobile) (Point 1 & 4)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true)
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    touchEndX.current = e.touches[0].clientX
  }

  const resetTouchState = () => {
    setIsTouching(false)
    touchStartX.current = null
    touchEndX.current = null
    isDragging.current = false
  }

  const handleTouchEnd = () => {
    if (!isDragging.current || touchStartX.current === null || touchEndX.current === null) {
      resetTouchState()
      return
    }

    const distance = touchStartX.current - touchEndX.current
    if (Math.abs(distance) >= MIN_SWIPE_DISTANCE) {
      if (distance > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }

    resetTouchState()
  }

  const handleTouchCancel = () => {
    resetTouchState()
  }

  // 18. Slides kosong: Tampilkan placeholder yang tenang
  if (!slides || slides.length === 0) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 ${aspectRatio} ${className} flex items-center justify-center`}
      >
        <div className="p-6 text-center text-sm text-gray-500">
          <svg
            className="mx-auto h-10 w-10 text-gray-400 mb-2"
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
          <p className="font-medium text-gray-600">Belum ada foto yang tersedia.</p>
        </div>
      </div>
    )
  }

  const hasMultiple = slides.length > 1
  const safeActiveIndex = activeIndex < slides.length ? activeIndex : 0

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gray-900 shadow-xl ${aspectRatio} ${className}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      aria-label="Carousel Kesenian Tradisional"
      role="region"
    >
      {/* Slides Container */}
      <div className="relative h-full w-full overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === safeActiveIndex
          return (
            <div
              key={slide.id || `slide-${idx}`}
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              {/* Gambar Kompatibel Project */}
              <img
                src={slide.fotoUrl}
                alt={slide.teksAlt}
                className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                loading={idx === 0 ? "eager" : "lazy"}
              />

              {/* Overlay Caption (jika diaktifkan) */}
              {showCaptionOverlay && (slide.judul || slide.caption || slide.subjudul) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  {slide.subjudul && (
                    <span className="mb-1.5 inline-block text-xs font-semibold uppercase tracking-wider text-amber-300">
                      {slide.subjudul}
                    </span>
                  )}

                  {slide.judul && (
                    <h3 className="text-xl font-bold sm:text-2xl lg:text-3xl tracking-tight leading-snug text-white">
                      {slide.href ? (
                        <Link
                          href={slide.href}
                          className="hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                        >
                          {slide.judul}
                        </Link>
                      ) : (
                        slide.judul
                      )}
                    </h3>
                  )}

                  {slide.caption && (
                    <p className="mt-1.5 text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-2xl leading-relaxed">
                      {slide.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tombol Prev & Next (Hanya jika slides > 1) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide Sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/80 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide Berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/80 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indikator Titik / Dots (Hanya jika slides > 1) */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Pergi ke slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                i === safeActiveIndex
                  ? "w-7 bg-amber-400"
                  : "w-2.5 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
