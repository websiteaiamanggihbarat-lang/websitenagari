import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#2c1b01] text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Nagari Aia Manggih Barat</h3>
            <p className="text-[#e6ddcf] text-sm">
              Website resmi Pemerintahan Nagari Aia Manggih Barat. Menyediakan
              informasi dan layanan publik untuk masyarakat.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Tautan Cepat</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-[#e6ddcf] hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/struktur-organisasi"
                  className="text-[#e6ddcf] hover:text-white"
                >
                  Struktur Organisasi
                </Link>
              </li>
              <li>
                <Link
                  href="/layanan-informasi"
                  className="text-[#e6ddcf] hover:text-white"
                >
                  Layanan Informasi
                </Link>
              </li>
              <li>
                <Link href="/berita" className="text-[#e6ddcf] hover:text-white">
                  Berita Nagari
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Layanan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/layanan-informasi"
                  className="text-[#e6ddcf] hover:text-white"
                >
                  Persyaratan Dokumen
                </Link>
              </li>
              <li>
                <Link
                  href="/layanan-informasi#pengaduan"
                  className="text-[#e6ddcf] hover:text-white"
                >
                  Informasi Pengaduan
                </Link>
              </li>
              <li>
                <Link
                  href="/ppid"
                  className="text-[#e6ddcf] hover:text-white"
                >
                  PPID Nagari
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Kontak</h3>
            <ul className="space-y-2 text-sm text-[#e6ddcf]">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Nagari Aia Manggih Barat</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>info@aiamanggihbarat.go.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#5a3b0d] mt-8 pt-8 text-center text-sm text-[#e6ddcf]">
          <p>
            © {new Date().getFullYear()} Nagari Aia Manggih Barat. Hak Cipta
            Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
