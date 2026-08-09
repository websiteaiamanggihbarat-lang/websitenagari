"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface AdminDashboardClientProps {
  userEmail: string | null
}

export default function AdminDashboardClient({ userEmail }: AdminDashboardClientProps) {
  const [isBerandaOpen, setIsBerandaOpen] = useState(false)
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
    setIsBerandaOpen((prev) => !prev)
  }

  const berandaSubmenus = [
    {
      nama: "Hero Beranda",
      href: "/admin/hero-beranda",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      nama: "Informasi Penduduk",
      href: "/admin/informasi-penduduk",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4m-4-10a4 4 0 110-8 4 4 0 010 8zm-7 2a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
      ),
    },
    {
      nama: "Sarana Pendidikan",
      href: "/admin/sarana-pendidikan",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      nama: "Kesehatan",
      href: "/admin/kesehatan",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      nama: "Kesenian Tradisional",
      href: "/admin/kesenian-tradisional",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11 5.518.4a.562.562 0 01.32.98l-4.204 3.6 1.285 5.39a.562.562 0 01-.84.61L12 17.77l-4.724 2.82a.562.562 0 01-.84-.61l1.285-5.39-4.204-3.6a.562.562 0 01.32-.98l5.518-.4 2.125-5.11z" />
        </svg>
      ),
    },
    {
      nama: "Kelompok Tani & BUMNag",
      href: "/admin/kelompok-tani-bumnag",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V7m0 4h4m-4 0H7" />
        </svg>
      ),
    },
    {
      nama: "Peta Nagari",
      href: "/admin/peta-nagari",
      icon: (
        <svg className="w-5 h-5 text-[#6b4b1d] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Header Cokelat Tua Solid */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Admin Panel
              </h1>
              <p className="text-xs sm:text-sm text-white">
                Nagari Aia Manggih Barat
              </p>
              {userEmail && (
                <p className="text-[11px] text-white/80 mt-0.5">
                  Login sebagai: {userEmail}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-4 py-2 text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
              </svg>
              <span>Lihat Beranda</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loadingLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Container (Hybrid Accordion + Direct Links) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* PAGE 1: BERANDA (ACCORDION) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={toggleBeranda}
            aria-expanded={isBerandaOpen}
            aria-controls="beranda-accordion-panel"
            className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${
              isBerandaOpen
                ? "bg-[#f7f2e8]/80 border-b border-gray-200"
                : "hover:bg-[#f7f2e8]/40"
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f2e8] text-[#2c1b01] font-bold border border-[#2c1b01]/10">
                <svg className="w-5 h-5 text-[#6b4b1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                Beranda
              </span>
            </div>

            <div className="flex items-center space-x-2 text-gray-500">
              <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                {isBerandaOpen ? "Tutup Submenu" : "7 Pengelolaan"}
              </span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${
                  isBerandaOpen ? "rotate-180 text-[#6b4b1d]" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Submenu Panel (Expand / Push content down) */}
          {isBerandaOpen && (
            <div id="beranda-accordion-panel" className="p-5 sm:p-6 bg-white transition-all duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {berandaSubmenus.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className="group flex items-center space-x-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-[#6b4b1d] hover:bg-[#f7f2e8]/40 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#f7f2e8] group-hover:bg-[#6b4b1d] transition-colors">
                      {sub.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
                      {sub.nama}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PAGE 2: STRUKTUR ORGANISASI (DIRECT LINK) */}
        <Link
          href="/admin/struktur-organisasi"
          className="group flex items-center justify-between w-full px-6 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-[#6b4b1d] hover:bg-[#f7f2e8]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f2e8] text-[#2c1b01] font-bold border border-[#2c1b01]/10">
              <svg className="w-5 h-5 text-[#6b4b1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
              Struktur Organisasi
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#6b4b1d] transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* PAGE 3: LEMBAGA & ORGANISASI (DIRECT LINK) */}
        <Link
          href="/admin/lembaga-organisasi"
          className="group flex items-center justify-between w-full px-6 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-[#6b4b1d] hover:bg-[#f7f2e8]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f2e8] text-[#2c1b01] font-bold border border-[#2c1b01]/10">
              <svg className="w-5 h-5 text-[#6b4b1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
              Lembaga &amp; Organisasi
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#6b4b1d] transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* PAGE 4: LAYANAN INFORMASI (DIRECT LINK) */}
        <Link
          href="/admin/layanan-informasi"
          className="group flex items-center justify-between w-full px-6 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-[#6b4b1d] hover:bg-[#f7f2e8]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f2e8] text-[#2c1b01] font-bold border border-[#2c1b01]/10">
              <svg className="w-5 h-5 text-[#6b4b1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
              Layanan Informasi
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#6b4b1d] transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* PAGE 5: BERITA NAGARI (DIRECT LINK) */}
        <Link
          href="/admin/tambah-berita"
          className="group flex items-center justify-between w-full px-6 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-[#6b4b1d] hover:bg-[#f7f2e8]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f2e8] text-[#2c1b01] font-bold border border-[#2c1b01]/10">
              <svg className="w-5 h-5 text-[#6b4b1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 3v2m6-2v2m-6 4h10" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
              Berita Nagari
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#6b4b1d] transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* PAGE 6: GALERI (DIRECT LINK) */}
        <Link
          href="/admin/galeri"
          className="group flex items-center justify-between w-full px-6 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-[#6b4b1d] hover:bg-[#f7f2e8]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f2e8] text-[#2c1b01] font-bold border border-[#2c1b01]/10">
              <svg className="w-5 h-5 text-[#6b4b1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#6b4b1d] transition-colors">
              Galeri
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#6b4b1d] transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
