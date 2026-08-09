"use client"

import { useState, useEffect, useCallback } from "react"
import { DetailLembagaOrganisasiPublik } from "@/lib/lembagaOrganisasi"

interface Props {
  detail: DetailLembagaOrganisasiPublik
}

export default function DetailLembagaOrganisasiDinamis({ detail }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedGaleriIds, setFailedGaleriIds] = useState<Set<string>>(new Set())
  const [failedPengurusIds, setFailedPengurusIds] = useState<Set<string>>(new Set())

  const galeriList = detail.galeri || []
  const safeIndex = galeriList.length > 0 ? Math.min(currentIndex, galeriList.length - 1) : 0
  const currentGaleri = galeriList[safeIndex]

  const handleGaleriError = (id: string) => {
    setFailedGaleriIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const handlePengurusError = (id: string) => {
    setFailedPengurusIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const handlePrevSlide = useCallback(() => {
    if (galeriList.length <= 1) return
    setCurrentIndex((prev) => (prev === 0 ? galeriList.length - 1 : prev - 1))
  }, [galeriList.length])

  const handleNextSlide = useCallback(() => {
    if (galeriList.length <= 1) return
    setCurrentIndex((prev) => (prev === galeriList.length - 1 ? 0 : prev + 1))
  }, [galeriList.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevSlide()
      } else if (e.key === "ArrowRight") {
        handleNextSlide()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrevSlide, handleNextSlide])

  return (
    <div className="bg-white text-gray-900 space-y-10 pb-16">
      {/* ========================================================================= */}
      {/* 1. SLIDER FOTO BESAR UTAMA (Clean, Tanpa Border, Frame, atau Outer Card)   */}
      {/* ========================================================================= */}
      {galeriList.length > 0 && (
        <div className="relative aspect-[16/9] sm:aspect-[21/9] md:h-[500px] w-full overflow-hidden rounded-2xl bg-gray-900 shadow-sm group">
          {currentGaleri && !failedGaleriIds.has(currentGaleri.id) ? (
            <img
              src={currentGaleri.foto_url}
              alt={currentGaleri.teks_alt || `Foto ${detail.nama}`}
              onError={() => handleGaleriError(currentGaleri.id)}
              className="h-full w-full object-cover transition-all duration-500"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/40 p-8 text-center">
              <svg className="h-20 w-20 text-[#6b4b1d]/40 mb-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-lg font-bold text-gray-700">{detail.nama}</span>
            </div>
          )}

          {/* Overlay Gradien & Keterangan Foto */}
          {currentGaleri?.teks_alt && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 text-white">
              <p className="text-sm sm:text-base font-medium max-w-3xl leading-snug drop-shadow">
                {currentGaleri.teks_alt}
              </p>
            </div>
          )}

          {/* Tombol Panah Navigasi Slider: Kiri (←) & Kanan (→) */}
          {galeriList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Foto sebelumnya"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#2c1b01]/85 text-white shadow-xl backdrop-blur-md transition-all hover:bg-[#2c1b01] hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 z-10"
              >
                <svg className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Foto berikutnya"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#2c1b01]/85 text-white shadow-xl backdrop-blur-md transition-all hover:bg-[#2c1b01] hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 z-10"
              >
                <svg className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Indikator Posisi Foto */}
              <div className="absolute top-4 right-4 rounded-full bg-black/65 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-md shadow-md">
                {safeIndex + 1} / {galeriList.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. JUDUL IDENTITAS LEMBAGA                                                */}
      {/* ========================================================================= */}
      <div className="border-b border-[#d1c2a0]/60 pb-6 pt-2">
        <div className="inline-block rounded-lg bg-amber-100/80 border border-amber-200/80 px-3 py-1 text-xs font-bold text-[#2c1b01] tracking-wide uppercase mb-3">
          {detail.jenis === "lembaga" ? "Lembaga Nagari" : "Organisasi Nagari"}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
          {detail.nama}
        </h1>
        <div className="w-20 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] rounded-full mt-4" />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PROFIL / DESKRIPSI (Header Krem/Cokelat + Body Putih)          */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        {/* Header Section Bertema Krem/Cokelat */}
        <div className="flex items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border border-[#d1c2a0] shadow-sm">
          <div className="w-11 h-11 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md shadow-[rgba(44,27,1,0.25)] mr-4 flex-shrink-0">
            <svg className="w-5 h-5 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Profil / Deskripsi</h2>
            <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Informasi profil dan gambaran umum lembaga</p>
          </div>
        </div>

        {/* Body Content Polos Putih dengan Border Krem Lembut */}
        <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 sm:p-8 shadow-xs text-base sm:text-lg text-gray-700 leading-relaxed whitespace-pre-line font-normal">
          {detail.deskripsi}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: INFORMASI LEMBAGA (SATU Section Besar Gabungan)                */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        {/* Header Section Bertema Krem/Cokelat */}
        <div className="flex items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f0e8db] via-[#f7f2ea] to-[#fffdf9] border border-[#d1c2a0] shadow-sm">
          <div className="w-11 h-11 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-md shadow-[rgba(44,27,1,0.25)] mr-4 flex-shrink-0">
            <svg className="w-5 h-5 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Informasi Lembaga</h2>
            <p className="text-xs text-[#6b4b1d] font-medium mt-0.5">Informasi alamat, kontak, operasional, dan kepengurusan lembaga</p>
          </div>
        </div>

        {/* SATU Body Besar Putih Gabungan dengan Border Krem Lembut */}
        <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white p-6 sm:p-8 shadow-xs space-y-8">
          {/* 1. BAGIAN ATAS: 3 Item Sejajar Desktop (Alamat, Kontak, Jam Operasional) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Alamat */}
            <div className="flex items-start gap-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white p-5 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-amber-100/90 text-[#2c1b01] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">Alamat</h3>
                <p className="text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed break-words">
                  {detail.alamat}
                </p>
              </div>
            </div>

            {/* Kontak */}
            <div className="flex items-start gap-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white p-5 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-amber-100/90 text-[#2c1b01] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">Kontak</h3>
                {detail.kontak ? (
                  <a
                    href={`tel:${detail.kontak.replace(/[^0-9+]/g, "")}`}
                    className="text-sm text-[#6b4b1d] font-bold whitespace-pre-line leading-relaxed break-words hover:underline block"
                  >
                    {detail.kontak}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Kontak belum tersedia
                  </p>
                )}
              </div>
            </div>

            {/* Jam Operasional */}
            <div className="flex items-start gap-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white p-5 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-amber-100/90 text-[#2c1b01] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">Jam Operasional</h3>
                <p className="text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed break-words">
                  {detail.jam_kerja || "Senin - Jumat: 08:00 - 16:00 WIB"}
                </p>
              </div>
            </div>
          </div>

          {/* Divider Tipis Krem */}
          <div className="border-t border-[#d1c2a0]/60" />

          {/* 2. BAGIAN TENGAH: Struktur Pengurus (Di dalam Body Informasi Lembaga yang Sama) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
              <svg className="h-5 w-5 text-[#2c1b01]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Struktur Pengurus
            </h3>
            {detail.pengurus.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Data struktur pengurus belum diisi.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {detail.pengurus.map((p) => {
                  const hasFailed = p.id ? failedPengurusIds.has(p.id) : false
                  return (
                    <div key={p.id} className="flex flex-col items-center rounded-xl border border-[#d1c2a0]/60 bg-white p-5 text-center shadow-xs">
                      {p.foto_url && !hasFailed ? (
                        <img
                          src={p.foto_url}
                          alt={p.nama_pengurus || p.nama_jabatan}
                          onError={() => p.id && handlePengurusError(p.id)}
                          className="h-20 w-20 rounded-full object-cover ring-4 ring-[#2c1b01]/15 mb-3 shadow-xs"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-amber-100/90 text-[#2c1b01] flex items-center justify-center ring-4 ring-[#2c1b01]/15 mb-3 shadow-xs">
                          <svg className="h-10 w-10 opacity-70" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <h4 className="text-sm font-bold text-gray-900">{p.nama_jabatan}</h4>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        {p.nama_pengurus || <span className="italic text-gray-400">Belum diisi</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Divider Tipis Krem */}
          <div className="border-t border-[#d1c2a0]/60" />

          {/* 3. BAGIAN BAWAH: Tugas & Fungsi Utama (Di dalam Body Informasi Lembaga yang Sama) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
              <svg className="h-5 w-5 text-[#2c1b01]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Tugas & Fungsi Utama
            </h3>
            {detail.tugas.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Data tugas & fungsi belum diisi.</p>
            ) : (
              <ul className="space-y-3">
                {detail.tugas.map((t, idx) => (
                  <li key={t.id} className="flex items-start gap-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white p-4 text-sm sm:text-base text-gray-800 shadow-xs">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{t.isi_tugas}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
