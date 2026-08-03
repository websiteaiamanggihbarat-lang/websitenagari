"use client"

import { useState } from "react"
import Link from "next/link"
import {
  DetailLembagaOrganisasiPublik,
  formatJenisLembagaOrganisasi,
} from "@/lib/lembagaOrganisasi"

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

  const handlePrevSlide = () => {
    if (galeriList.length <= 1) return
    setCurrentIndex((prev) => (prev === 0 ? galeriList.length - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    if (galeriList.length <= 1) return
    setCurrentIndex((prev) => (prev === galeriList.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-10">
      {/* Navigasi Breadcrumb & Tombol Kembali */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-[#6b4b1d] transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/lembaga-organisasi" className="hover:text-[#6b4b1d] transition-colors">
            Lembaga dan Organisasi
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold truncate max-w-xs">{detail.nama}</span>
        </nav>

        <Link
          href="/lembaga-organisasi"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors w-fit"
        >
          <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar
        </Link>
      </div>

      {/* Slider Galeri Foto */}
      {galeriList.length > 0 && (
        <div className="space-y-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {currentGaleri && !failedGaleriIds.has(currentGaleri.id) ? (
              <img
                src={currentGaleri.foto_url}
                alt={currentGaleri.teks_alt || `Foto ${detail.nama}`}
                onError={() => handleGaleriError(currentGaleri.id)}
                className="h-full w-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 text-center">
                <svg className="h-16 w-16 text-[#6b4b1d]/40 mb-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-700">{detail.nama}</span>
              </div>
            )}

            {/* Badges Cover Utama & Indikator */}
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              {currentGaleri?.is_cover && (
                <span className="rounded-lg bg-emerald-600/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                  Cover Utama
                </span>
              )}
            </div>

            {/* Kontrol Navigasi Slider */}
            {galeriList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md shadow-lg transition-all hover:bg-black/70 active:scale-95"
                >
                  <svg className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md shadow-lg transition-all hover:bg-black/70 active:scale-95"
                >
                  <svg className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Indikator Angka */}
                <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md">
                  {safeIndex + 1} / {galeriList.length}
                </div>
              </>
            )}
          </div>

          {/* Baris Thumbnail Galeri */}
          {galeriList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {galeriList.map((g, idx) => {
                const isSelected = idx === safeIndex
                const hasFailed = failedGaleriIds.has(g.id)

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Pilih foto galeri ${idx + 1}`}
                    aria-current={isSelected ? "true" : undefined}
                    className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[#6b4b1d] ring-2 ring-[#6b4b1d]/30 opacity-100 scale-105"
                        : "border-gray-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {!hasFailed ? (
                      <img
                        src={g.foto_url}
                        alt={g.teks_alt || `Thumbnail ${idx + 1}`}
                        onError={() => handleGaleriError(g.id)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                        No Photo
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Content Card: Header & Deskripsi */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 shadow-lg space-y-8">
        <div className="border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-lg bg-[#2c1b01] px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {formatJenisLembagaOrganisasi(detail.jenis)}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight break-words">
            {detail.nama}
          </h1>
        </div>

        {/* Deskripsi */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Profil & Deskripsi</h2>
          <p className="whitespace-pre-line text-base text-gray-700 leading-relaxed break-words font-normal">
            {detail.deskripsi}
          </p>
        </div>

        {/* Panel Struktur Pengurus */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Struktur Pengurus</h2>
          {detail.pengurus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-sm text-gray-500 italic">
              Struktur pengurus belum tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {detail.pengurus.map((p) => {
                const hasPhotoFailed = p.id ? failedPengurusIds.has(p.id) : false

                return (
                  <div
                    key={p.id}
                    className="flex flex-col items-center rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 p-5 text-center shadow-sm transition-all hover:border-[#b6a587] hover:shadow-md"
                  >
                    {p.foto_url && !hasPhotoFailed ? (
                      <img
                        src={p.foto_url}
                        alt={`Foto ${p.nama_pengurus || p.nama_jabatan}`}
                        onError={() => p.id && handlePengurusError(p.id)}
                        className="h-20 w-20 rounded-full object-cover ring-4 ring-[#6b4b1d]/15 shadow-sm mb-3"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/60 text-[#6b4b1d] ring-4 ring-[#6b4b1d]/15 shadow-inner mb-3">
                        <svg className="h-10 w-10 opacity-70" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-gray-900 break-words">{p.nama_jabatan}</h3>
                    <p className="mt-1 text-xs text-gray-600 font-medium break-words">
                      {p.nama_pengurus || <span className="italic text-gray-400">Belum ditetapkan</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel Daftar Tugas */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Tugas & Fungsi</h2>
          {detail.tugas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-sm text-gray-500 italic">
              Daftar tugas belum tersedia.
            </div>
          ) : (
            <ol className="space-y-3">
              {detail.tugas.map((t, idx) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3.5 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-800"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white shadow-sm mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-line break-words leading-relaxed">{t.isi_tugas}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Panel Informasi Kontak & Operasional */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Informasi & Sekelompok</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Alamat */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5">
              <div className="flex items-center gap-2.5 text-[#6b4b1d] font-bold text-xs uppercase tracking-wider mb-2">
                <svg className="h-5 w-5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Alamat Kantor</span>
              </div>
              <p className="whitespace-pre-line text-sm text-gray-800 break-words leading-relaxed">{detail.alamat}</p>
            </div>

            {/* Kontak */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5">
              <div className="flex items-center gap-2.5 text-[#6b4b1d] font-bold text-xs uppercase tracking-wider mb-2">
                <svg className="h-5 w-5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Kontak Resmi</span>
              </div>
              <p className="whitespace-pre-line text-sm text-gray-800 break-words leading-relaxed">
                {detail.kontak || <span className="italic text-gray-400">Kontak belum tersedia</span>}
              </p>
            </div>

            {/* Jam Kerja */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5">
              <div className="flex items-center gap-2.5 text-[#6b4b1d] font-bold text-xs uppercase tracking-wider mb-2">
                <svg className="h-5 w-5 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Jam Operasional</span>
              </div>
              <p className="whitespace-pre-line text-sm text-gray-800 break-words leading-relaxed">
                {detail.jam_kerja || <span className="italic text-gray-400">Jam kerja belum tersedia</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigasi Bawah */}
      <div className="flex justify-center pt-4">
        <Link
          href="/lembaga-organisasi"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#6b4b1d] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
        >
          <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Lembaga dan Organisasi
        </Link>
      </div>
    </div>
  )
}
