"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type HeroSlide = {
  id: string
  gambarUrl: string
  teksAlt: string
  objectPosition: string
}

type HeroCarouselProps = {
  slides: HeroSlide[]
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isManualPaused, setIsManualPaused] = useState<boolean>(false)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isFocusWithin, setIsFocusWithin] = useState<boolean>(false)
  const [isTouching, setIsTouching] = useState<boolean>(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)
  const [gambarErrorIds, setGambarErrorIds] = useState<string[]>([])

  // Touch Swipe State
  const touchStartXRef = useRef<number>(0)
  const touchStartYRef = useRef<number>(0)
  const touchCurrentXRef = useRef<number>(0)
  const touchCurrentYRef = useRef<number>(0)
  const heroWrapperRef = useRef<HTMLElement | null>(null)

  const totalSlides = slides.length

  // Safety Reset Active Index saat Slides Berubah
  useEffect(() => {
    if (totalSlides === 0) return
    if (activeIndex >= totalSlides) {
      setActiveIndex(0)
    }
  }, [totalSlides, activeIndex])

  // Purge Error IDs yang Tidak Lagi Tersedia di Slides
  useEffect(() => {
    if (gambarErrorIds.length === 0) return
    const validIds = new Set(slides.map((s) => s.id))
    setGambarErrorIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [slides, gambarErrorIds.length])

  // Deteksi prefers-reduced-motion dari Sistem Operasi
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

  // Fungsi Navigasi Slider
  const keBerikutnya = useCallback(() => {
    if (totalSlides <= 1) return
    setActiveIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const keSebelumnya = useCallback(() => {
    if (totalSlides <= 1) return
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const menujuSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setActiveIndex(index)
    }
  }

  // Autoplay Timer (5000 ms)
  useEffect(() => {
    if (
      totalSlides <= 1 ||
      isManualPaused ||
      isHovered ||
      isFocusWithin ||
      isTouching ||
      prefersReducedMotion
    ) {
      return
    }

    const timer = window.setInterval(() => {
      keBerikutnya()
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [totalSlides, isManualPaused, isHovered, isFocusWithin, isTouching, prefersReducedMotion, keBerikutnya])

  // Event Handlers Focus
  const handleFocusCapture = () => {
    setIsFocusWithin(true)
  }

  const handleBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    const targetBerikutnya = e.relatedTarget as Node | null
    if (targetBerikutnya && heroWrapperRef.current?.contains(targetBerikutnya)) {
      return
    }
    setIsFocusWithin(false)
  }

  // Event Handlers Touch / Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalSlides <= 1) return
    const touch = e.touches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    touchCurrentXRef.current = touch.clientX
    touchCurrentYRef.current = touch.clientY
    setIsTouching(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouching || totalSlides <= 1) return
    const touch = e.touches[0]
    touchCurrentXRef.current = touch.clientX
    touchCurrentYRef.current = touch.clientY
  }

  const handleTouchEnd = () => {
    if (!isTouching || totalSlides <= 1) return

    const deltaX = touchCurrentXRef.current - touchStartXRef.current
    const deltaY = touchCurrentYRef.current - touchStartYRef.current

    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        keBerikutnya()
      } else {
        keSebelumnya()
      }
    }

    touchStartXRef.current = 0
    touchStartYRef.current = 0
    touchCurrentXRef.current = 0
    touchCurrentYRef.current = 0
    setIsTouching(false)
  }

  const handleTouchCancel = () => {
    touchStartXRef.current = 0
    touchStartYRef.current = 0
    touchCurrentXRef.current = 0
    touchCurrentYRef.current = 0
    setIsTouching(false)
  }

  if (totalSlides === 0) {
    return null
  }

  return (
    <section
      ref={heroWrapperRef}
      aria-roledescription="carousel"
      aria-label="Gambar utama Nagari Aia Manggih Barat"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{ touchAction: "pan-y" }}
      className="relative h-screen min-h-[600px] px-6 lg:px-8 overflow-hidden flex items-center justify-center bg-gray-950"
    >
      {/* LAYER 1: Background Image Slides (Fade Transition, z-0) */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          const isError = gambarErrorIds.includes(slide.id)

          if (isError) {
            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 w-full h-full bg-gray-900 transition-opacity duration-[800ms] motion-reduce:transition-none ${
                  isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />
            )
          }

          return (
            <img
              key={slide.id}
              src={slide.gambarUrl}
              alt={isActive ? slide.teksAlt : ""}
              aria-hidden={!isActive}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              draggable={false}
              onError={() =>
                setGambarErrorIds((current) =>
                  current.includes(slide.id) ? current : [...current, slide.id]
                )
              }
              style={{
                objectPosition: slide.objectPosition,
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[800ms] motion-reduce:transition-none ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />
          )
        })}
      </div>

      {/* LAYER 2: Warm Dark Mahogany Gradient Overlay (z-[1]) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1200]/80 via-[#2C1B01]/70 to-[#1A1200]/85 z-[1]" />

      {/* LAYER 3: Static Hero Text (z-10, Tidak Ikut Fade/Loop) */}
      <div className="relative max-w-5xl mx-auto text-center animate-fade-in z-10 space-y-5">
        {/* Official Motto Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B6A587]/20 border border-[#B6A587]/40 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#B6A587] animate-pulse"></span>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-[#E6DDCF]">
            RANCAK BANA
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
          Nagari Aia Manggih Barat
        </h1>

        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#B6A587] to-transparent mx-auto rounded-full"></div>

        <p className="text-base sm:text-lg md:text-xl text-[#F7F2E8]/95 max-w-3xl mx-auto leading-relaxed drop-shadow-md font-medium">
          &ldquo;Ramah, Amanah, Normatif, Cepat, Akurat, Kreatif, Bebas Biaya, Aman, Nyaman, dan Adil&rdquo;
        </p>
      </div>

      {/* LAYER 4: Minimal Slider Controls (z-20, Hanya Tampil jika slides > 1) */}
      {totalSlides > 1 && (
        <div className="absolute inset-x-0 bottom-6 md:bottom-8 z-20 flex flex-col items-center gap-3 px-4">
          {/* Tombol Navigation Arrow & Pause/Play */}
          <div className="flex items-center justify-between w-full max-w-6xl pointer-events-none">
            {/* Tombol Previous */}
            <button
              type="button"
              onClick={keSebelumnya}
              aria-label="Tampilkan gambar sebelumnya"
              className="pointer-events-auto p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/80 shadow-lg"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Tombol Manual Pause / Play */}
            <button
              type="button"
              onClick={() => setIsManualPaused((prev) => !prev)}
              aria-label={isManualPaused ? "Lanjutkan pergantian gambar otomatis" : "Jeda pergantian gambar otomatis"}
              className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/70 text-amber-200/90 hover:text-amber-200 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/80 shadow-lg"
            >
              {isManualPaused ? (
                /* Icon Play */
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                /* Icon Pause */
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {/* Tombol Next */}
            <button
              type="button"
              onClick={keBerikutnya}
              aria-label="Tampilkan gambar selanjutnya"
              className="pointer-events-auto p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/80 shadow-lg"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md">
            {slides.map((slide, index) => {
              const isDotActive = index === activeIndex
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => menujuSlide(index)}
                  aria-label={`Tampilkan gambar ${index + 1}`}
                  aria-current={isDotActive ? "true" : undefined}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400/80 ${
                    isDotActive ? "w-6 bg-amber-400" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
