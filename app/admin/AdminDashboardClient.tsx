"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface AdminDashboardClientProps {
  userEmail: string | null
}

export default function AdminDashboardClient({ userEmail }: AdminDashboardClientProps) {
  const [isBerandaOpen, setIsBerandaOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("admin_dashboard_beranda_open") === "true"
      } catch {
        return false
      }
    }
    return false
  })
  const [loadingLogout, setLoadingLogout] = useState(false)

  const handleLogout = async () => {
    try {
      setLoadingLogout(true)
      await supabase.auth.signOut()

      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      const response = await fetch("/auth/signout", {
        method: "POST",
        credentials: "include",
        redirect: "follow",
      })

      if (response.redirected) {
        window.location.href = response.url
      } else {
        window.location.href = `/login?logout=success&t=${Date.now()}`
      }
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = `/login?logout=success&t=${Date.now()}`
    }
  }

  const toggleBeranda = () => {
    setIsBerandaOpen((prev) => {
      const nextState = !prev
      try {
        sessionStorage.setItem("admin_dashboard_beranda_open", String(nextState))
      } catch {
        /* ignore storage errors */
      }
      return nextState
    })
  }

  const berandaSubmenus = [
    {
      nama: "Hero Beranda",
      deskripsi: "Banner & slide foto utama beranda",
      href: "/admin/hero-beranda",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      nama: "Informasi Penduduk",
      deskripsi: "Statistik & demografi kependudukan",
      href: "/admin/informasi-penduduk",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4m-4-10a4 4 0 110-8 4 4 0 010 8zm-7 2a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
      ),
    },
    {
      nama: "Sarana Pendidikan",
      deskripsi: "Fasilitas & data sekolah Nagari",
      href: "/admin/sarana-pendidikan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      nama: "Kesehatan",
      deskripsi: "Fasilitas kesehatan & posyandu",
      href: "/admin/kesehatan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      nama: "Kesenian Tradisional",
      deskripsi: "Seni, budaya & sanggar nagari",
      href: "/admin/kesenian-tradisional",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z" />
        </svg>
      ),
    },
    {
      nama: "Kelompok Tani & BUMNag",
      deskripsi: "Ekonomi lokal, usaha & tani nagari",
      href: "/admin/kelompok-tani-bumnag",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V7m0 4h4m-4 0H7" />
        </svg>
      ),
    },
    {
      nama: "Peta Nagari",
      deskripsi: "Batas wilayah & spasial nagari",
      href: "/admin/peta-nagari",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
  ]

  const mainModules = [
    {
      nama: "Struktur Organisasi",
      deskripsi: "Perangkat nagari, BPRN, KAN & struktur pemerintahan",
      href: "/admin/struktur-organisasi",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      nama: "Lembaga & Organisasi",
      deskripsi: "Lembaga adat, kemasyarakatan, PKK, Karang Taruna",
      href: "/admin/lembaga-organisasi",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4m-4-10a4 4 0 110-8 4 4 0 010 8zm-7 2a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
      ),
    },
    {
      nama: "Layanan Informasi",
      deskripsi: "Layanan surat publik, persyaratan & kontak admin",
      href: "/admin/layanan-informasi",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      nama: "Berita Nagari",
      deskripsi: "Pengumuman, publikasi artikel & kegiatan resmi nagari",
      href: "/admin/tambah-berita",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-h-2m-4-3H9M7 3v2m6-2v2m-6 4h10" />
        </svg>
      ),
    },
    {
      nama: "Galeri",
      deskripsi: "Dokumentasi foto & galeri kegiatan Nagari",
      href: "/admin/galeri",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-admin-warm pb-20 text-[#1F2937]">
      {/* Top Header Panel - Deep Mahogany Warm Government Theme */}
      <header className="bg-gradient-to-r from-[#1A1200] via-[#2C1B01] to-[#3D2605] border-b border-[#B6A587]/30 shadow-lg text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#B6A587]/15 text-[#B6A587] border border-[#B6A587]/30 shadow-inner">
              <svg className="h-6 w-6 text-[#B6A587]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Admin Panel
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Resmi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Nagari Aia Manggih Barat &bull; Kabupaten Pasaman
              </p>
              {userEmail && (
                <p className="text-[11px] text-[#B6A587] mt-1 font-mono">
                  Sesi: {userEmail}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B6A587] hover:bg-[#c9b99b] text-[#1A1200] font-bold px-4 py-2.5 text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 text-[#1A1200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
              </svg>
              <span>Lihat Beranda</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loadingLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-200 hover:text-white font-semibold px-4 py-2.5 text-xs sm:text-sm border border-red-500/30 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{loadingLogout ? "Keluar..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#d1c2a0]/60 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C1B01] tracking-tight">
              Pusat Navigasi &amp; Pengelolaan Data Admin
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Pilih modul di bawah ini untuk mengelola informasi publik Nagari Aia Manggih Barat.
            </p>
          </div>
        </div>

        {/* Main Navigation Container */}
        <div className="space-y-5">
          {/* PAGE 1: BERANDA (ACCORDION HYBRID) */}
          <div className="rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs overflow-hidden transition-all duration-300 hover:border-[#b6a587] hover:shadow-md">
            <button
              type="button"
              onClick={toggleBeranda}
              aria-expanded={isBerandaOpen}
              aria-controls="beranda-accordion-panel"
              className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${
                isBerandaOpen
                  ? "bg-[#f0e8db]/40 border-b border-[#d1c2a0]/60"
                  : "hover:bg-[#fbfaf7]"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                  isBerandaOpen 
                    ? "bg-[#2C1B01] text-[#e6ddcf] border border-[#2C1B01] shadow-xs" 
                    : "bg-[#f0e8db]/60 text-[#2C1B01] border border-[#d1c2a0]/60"
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#2C1B01]">
                    Halaman Beranda Utama
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Kelola 7 komponen informasi utama pada tampilan depan website publik
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-500">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#f0e8db]/70 text-[#2C1B01] border border-[#d1c2a0]/50 hidden sm:inline-block">
                  7 Pengelolaan
                </span>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-[#d1c2a0]/70 shadow-xs">
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 text-[#2C1B01] ${
                      isBerandaOpen ? "rotate-180 text-[#2C1B01]" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Submenu Panel (Expand / Accordion) */}
            {isBerandaOpen && (
              <div id="beranda-accordion-panel" className="p-5 sm:p-6 bg-[#fbfaf7]/60 border-t border-[#d1c2a0]/40 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {berandaSubmenus.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="group flex items-start space-x-3.5 p-4 rounded-xl border border-[#d1c2a0]/60 bg-white hover:bg-[#f0e8db]/30 hover:border-[#b6a587] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f0e8db]/60 text-[#2C1B01] group-hover:bg-[#2C1B01] group-hover:text-[#e6ddcf] border border-[#d1c2a0]/40 group-hover:border-[#2C1B01] transition-all duration-200">
                        {sub.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#1F2937] group-hover:text-[#2C1B01] transition-colors">
                            {sub.nama}
                          </span>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#2C1B01] group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {sub.deskripsi}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN MODULES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mainModules.map((mod, idx) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group relative flex items-start space-x-4 p-5 sm:p-6 rounded-2xl border border-[#d1c2a0]/70 bg-white shadow-xs hover:shadow-md hover:border-[#b6a587] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Decorative Subtle Accent Bar */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d1c2a0]/60 group-hover:bg-[#2C1B01] transition-colors duration-300" />

                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f0e8db]/60 text-[#2C1B01] group-hover:bg-[#2C1B01] group-hover:text-[#e6ddcf] border border-[#d1c2a0]/60 group-hover:border-[#2C1B01] transition-all duration-300 shadow-2xs group-hover:scale-105">
                  {mod.icon}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-base sm:text-lg font-bold text-[#1F2937] group-hover:text-[#2C1B01] transition-colors">
                    {mod.nama}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                    {mod.deskripsi}
                  </p>
                </div>

                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-[#f0e8db]/40 group-hover:bg-[#2C1B01] transition-all duration-300 shadow-2xs">
                  <svg className="w-4 h-4 text-[#2C1B01] group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

