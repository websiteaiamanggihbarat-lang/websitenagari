"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    { href: "/ppid", label: "PPID Nagari" },
    { href: "/layanan-informasi", label: "Layanan Informasi" },
    { href: "/berita", label: "Berita Nagari" },
  ];

  return (
    <nav className="bg-white/85 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center group-hover:from-[#3a2604] group-hover:to-[#100b00] transition-all duration-300 shadow-lg shadow-[rgba(44,27,1,0.28)] group-hover:shadow-xl group-hover:shadow-[rgba(44,27,1,0.38)] group-hover:scale-105">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-[#2c1b01] transition-colors">
                Nagari Aia Manggih Barat
              </h1>
              <p className="text-xs text-gray-500 font-medium">Pemerintahan Nagari</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === item.href
                    ? "text-[#2c1b01] bg-[#f0e8db]"
                    : "text-gray-700 hover:text-[#2c1b01] hover:bg-[#f7f2e8]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-700"
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Overlay & Sidebar */}
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* Sidebar from right with glassmorphism */}
            <div className="fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white/96 backdrop-blur-2xl shadow-2xl z-50 lg:hidden animate-slide-in-right border-l border-gray-200/80">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/60 bg-gradient-to-r from-white/92 to-[#f7f2e8]/90 backdrop-blur-md">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
                    aria-label="Close menu"
                  >
                    <svg
                      className="w-6 h-6"
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
                
                {/* Menu Items */}
                <div className="flex-1 p-6 pt-8 flex flex-col justify-start">
                  <div className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                          pathname === item.href
                            ? "text-[#2c1b01] bg-[#f0e8db] shadow-md border border-[#d1c2a0]"
                            : "text-gray-800 hover:bg-[#f7f2e8] hover:text-[#2c1b01]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
