import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#1A1200] via-[#2C1B01] to-[#3D2605] text-white mt-auto border-t border-[#B6A587]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Brand & About */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex-shrink-0 bg-white p-1.5 rounded-xl shadow-md border border-[#B6A587]/30">
                <Image
                  src="/image/logo-kkn.png"
                  alt="Logo Nagari Aia Manggih Barat"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
              </Link>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Nagari Aia Manggih Barat
                </h3>
                <p className="text-xs text-[#B6A587] font-semibold">Kec. Lubuk Sikaping, Kab. Pasaman</p>
              </div>
            </div>
            <p className="text-[#E6DDCF] text-xs sm:text-sm leading-relaxed">
              Website resmi Pemerintahan Nagari Aia Manggih Barat. Portal digital layanan publik, transparansi informasi, serta kemajuan nagari.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                RANCAK BANA
              </span>
            </div>
          </div>

          {/* Column 2: Tautan Cepat */}
          <div>
            <h4 className="text-base font-extrabold text-white mb-4 uppercase tracking-wider text-xs text-[#B6A587]">
              Tautan Cepat
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/" className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1">
                  <span>›</span> Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/struktur-organisasi"
                  className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1"
                >
                  <span>›</span> Struktur Organisasi
                </Link>
              </li>
              <li>
                <Link
                  href="/lembaga-organisasi"
                  className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1"
                >
                  <span>›</span> Lembaga &amp; Organisasi
                </Link>
              </li>
              <li>
                <Link
                  href="/layanan-informasi"
                  className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1"
                >
                  <span>›</span> Layanan Informasi
                </Link>
              </li>
              <li>
                <Link href="/berita" className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1">
                  <span>›</span> Berita Nagari
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1">
                  <span>›</span> Galeri Nagari
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Layanan Publik */}
          <div>
            <h4 className="text-base font-extrabold text-white mb-4 uppercase tracking-wider text-xs text-[#B6A587]">
              Layanan Publik
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/layanan-informasi#persyaratan-dokumen"
                  className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1"
                >
                  <span>›</span> Persyaratan Dokumen
                </Link>
              </li>
              <li>
                <Link
                  href="/layanan-informasi#pengaduan"
                  className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1"
                >
                  <span>›</span> Informasi Pengaduan
                </Link>
              </li>
              <li>
                <Link
                  href="/layanan-informasi#kontak-pelayanan"
                  className="text-[#E6DDCF] hover:text-[#B6A587] transition-all inline-flex items-center gap-1.5 hover:translate-x-1"
                >
                  <span>›</span> Waktu Pelayanan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Informasi Kontak */}
          <div>
            <h4 className="text-base font-extrabold text-white mb-4 uppercase tracking-wider text-xs text-[#B6A587]">
              Kontak Kantor
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-[#E6DDCF]">
              <li className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B6A587]/15 flex items-center justify-center flex-shrink-0 text-[#B6A587] mt-0.5 border border-[#B6A587]/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <a
                  href="https://maps.app.goo.gl/STKDCR9RyTAFz44A6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors underline-offset-2 hover:underline"
                >
                  Kantor Wali Nagari Aia Manggih Barat, Kec. Lubuk Sikaping, Kab. Pasaman
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B6A587]/15 flex items-center justify-center flex-shrink-0 text-[#B6A587] border border-[#B6A587]/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span>082268789740 – 082172235321</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B6A587]/15 flex items-center justify-center flex-shrink-0 text-[#B6A587] border border-[#B6A587]/30">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <span>082213165168</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B6A587]/15 flex items-center justify-center flex-shrink-0 text-[#B6A587] border border-[#B6A587]/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>aiamanggihbarat02@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-[#5A3B0D]/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E6DDCF]">
          <p>© {new Date().getFullYear()} Kuliah Kerja Nyata Reguler 1 Universitas Andalas — All Rights Reserved.</p>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hover:text-[#B6A587] transition-colors text-[11px] font-semibold">
              Portal Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
