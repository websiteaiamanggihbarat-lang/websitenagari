"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for dynamic navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMenuOpen]);

  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/struktur-organisasi", label: "Struktur Organisasi" },
    { href: "/lembaga-organisasi", label: "Lembaga & Organisasi" },
    { href: "/layanan-informasi", label: "Layanan Informasi" },
    { href: "/berita", label: "Berita Nagari" },
    { href: "/galeri", label: "Galeri" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E6DDCF] shadow-md py-0"
          : "bg-white/85 backdrop-blur-md border-b border-[#E6DDCF]/60 shadow-sm py-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3.5 group cursor-pointer">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 border border-[#B6A587]/30 bg-white p-1">
              <Image
                src="/image/logo-kkn.png"
                alt="Logo Nagari Aia Manggih Barat"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-[#1F2937] tracking-tight group-hover:text-[#2C1B01] transition-colors">
                  Nagari Aia Manggih Barat
                </h1>
              </div>
              <p className="text-xs text-[#6B7280] font-medium flex items-center gap-1.5">
                <span>Pemerintahan Nagari</span>
                <span className="inline-block w-1 h-1 rounded-full bg-[#B6A587]"></span>
                <span className="text-[#5A3B0D]">Lubuk Sikaping</span>
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-[#2C1B01] bg-[#F0E8DB] shadow-sm font-bold border border-[#B6A587]/30"
                      : "text-gray-700 hover:text-[#2C1B01] hover:bg-[#F7F2E8]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2C1B01] rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="lg:hidden p-2.5 rounded-xl text-[#2C1B01] hover:bg-[#F7F2E8] transition-colors border border-[#E6DDCF] focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
              onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-[#FCFAF7] shadow-2xl z-50 lg:hidden animate-slide-in-right border-l border-[#E6DDCF]">
              <div className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#E6DDCF] bg-gradient-to-r from-[#1A1200] via-[#2C1B01] to-[#3D2605] text-white">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/image/logo-kkn.png"
                      alt="Logo Nagari"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain bg-white rounded-md p-0.5"
                    />
                    <div>
                      <h2 className="text-base font-bold text-white">Navigasi Utama</h2>
                      <p className="text-[11px] text-[#E6DDCF]">Nagari Aia Manggih Barat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-[#E6DDCF] hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    aria-label="Close menu"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Drawer Links */}
                <div className="flex-1 p-5 space-y-2 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                          isActive
                            ? "text-[#1A1200] bg-[#F0E8DB] shadow-sm border border-[#B6A587]/40"
                            : "text-gray-700 hover:bg-[#F7F2E8] hover:text-[#2C1B01]"
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#2C1B01]"></span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Drawer Footer Info */}
                <div className="p-5 border-t border-[#E6DDCF] bg-[#F7F2E8]/60 text-center">
                  <p className="text-xs text-[#5A3B0D] font-bold">RANCAK BANA</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Website Resmi Pemerintahan Nagari</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
