import HeroBerandaDinamis from "@/components/HeroBerandaDinamis";
import PetaNagariDinamis from "@/components/PetaNagariDinamis";
import InformasiPendudukDinamis from "@/components/InformasiPendudukDinamis";
import SaranaPendidikanDinamis from "@/components/SaranaPendidikanDinamis";
import KesehatanDinamis from "@/components/KesehatanDinamis";
import KesenianDinamis from "@/components/KesenianDinamis";
import KelompokTaniBumnagDinamis from "@/components/KelompokTaniBumnagDinamis";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      {/* Hero Beranda Dinamis */}
      <HeroBerandaDinamis />

      {/* Visi Misi Pelayanan Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-transparent border-b border-[#E6DDCF]/50">
        <div className="relative max-w-6xl mx-auto scroll-slide-bottom">
          <div className="text-center mb-12">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
              Pelayanan Publik
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
              Visi Misi Pelayanan
            </h2>
            <div className="gonjong-line max-w-xs mx-auto mt-3"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visi Pelayanan */}
            <div className="public-card-hover p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate">
                      Visi Pelayanan
                    </h3>
                    <p className="text-xs font-semibold text-[#5A3B0D]">Nagari Aia Manggih Barat</p>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Memberikan pelayanan prima kepada masyarakat dengan menerapkan &ldquo;<strong className="text-[#2C1B01]">RANCAK BANA</strong>&rdquo; (Ramah, Amanah, Normatif, Cepat, Akurat, Kreatif, Bebas Biaya, Aman, Nyaman, Adil).
                </p>
              </div>
            </div>

            {/* Misi Pelayanan */}
            <div className="public-card-hover p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate">
                      Misi Pelayanan
                    </h3>
                    <p className="text-xs font-semibold text-[#5A3B0D]">Komitmen Aparatur</p>
                  </div>
                </div>

                <ol className="space-y-3 text-gray-700 text-sm sm:text-base">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F0E8DB] text-[#2C1B01] text-xs font-extrabold flex items-center justify-center mt-0.5 border border-[#B6A587]/40">1</span>
                    <span>Mewujudkan pelayanan yang &ldquo;RANCAK BANA&rdquo;.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F0E8DB] text-[#2C1B01] text-xs font-extrabold flex items-center justify-center mt-0.5 border border-[#B6A587]/40">2</span>
                    <span>Meningkatkan kualitas aparatur pelayanan yang profesional.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F0E8DB] text-[#2C1B01] text-xs font-extrabold flex items-center justify-center mt-0.5 border border-[#B6A587]/40">3</span>
                    <span>Memberikan pelayanan sesuai Standar Operasional Pelayanan di Aia Manggih Barat.</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Peta Section */}
      <section id="peta" className="py-20 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 scroll-slide-left">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
              Geografis
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Peta Wilayah Nagari
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto mt-2">
              Lokasi dan batas-batas wilayah administratif Nagari Aia Manggih Barat
            </p>
            <div className="gonjong-line max-w-xs mx-auto mt-4"></div>
          </div>

          <div className="public-card p-4 sm:p-6 bg-white shadow-lg">
            <PetaNagariDinamis />
          </div>
        </div>
      </section>

      {/* Profil Nagari Section */}
      <section id="profil" className="py-20 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-[#E6DDCF]/50">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center scroll-slide-left">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
              Informasi Umum
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Profil Nagari
            </h2>
            <div className="gonjong-line max-w-xs mx-auto mt-4"></div>
          </div>

          {/* Sejarah Nagari - Full Width */}
          <div className="public-card p-6 sm:p-10 scroll-slide-bottom">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate">
                  Sejarah Nagari
                </h3>
                <p className="text-xs font-semibold text-[#5A3B0D]">Perjalanan Pemekaran &amp; Pembentukan Definitif</p>
              </div>
            </div>

            <div className="text-gray-700 leading-relaxed space-y-4 text-sm sm:text-base text-justify">
              <p>
                Nagari Aia Manggih Barat merupakan pemekaran nagari yang dilakukan oleh Pemerintah Kabupaten Pasaman melalui Peraturan Bupati Pasaman Nomor 21 Tahun 2017. Kebijakan ini menambah 25 nagari persiapan dari sebelumnya 37 nagari, salah satunya adalah Nagari Persiapan Aia Manggih Barat yang merupakan hasil pemekaran dari Nagari Induk Nagari Aia Manggih Barat Kecamatan Lubuk Sikaping. Kesepakatan pemekaran tersebut dihasilkan melalui Musyawarah Nagari pada 26 Oktober 2016 di MDTA Al Munawarah Aia Manggih Barat.
              </p>

              <p>
                Sebagai tindak lanjut, Yomi Valentia, S.S., M.M. dilantik sebagai Penjabat (PJ) Wali Nagari Persiapan Aia Manggih Barat pada tahun 2017. Pada masa awal, nagari persiapan belum memiliki struktur organisasi lengkap dan hanya dibantu oleh perangkat dari nagari induk serta dua jorong, yaitu Jorong Kampung Padang Paraman Dareh dan Jorong Padang Sarai. Setelah melalui proses seleksi dan mendapat rekomendasi camat, perangkat nagari persiapan resmi dilantik pada 30 Mei 2018.
              </p>

              <p>
                Pada akhir November 2019, jabatan PJ Wali Nagari Persiapan Aia Manggih Barat beralih kepada Amrizal, S.H., yang menjabat hingga Oktober 2022. Pada September 2022, berdasarkan penetapan nomor register dari Kementerian Dalam Negeri, Nagari Persiapan Aia Manggih Barat resmi menjadi nagari definitif. Selanjutnya, Ilham Syah, S.Pd., M.M. ditunjuk sebagai PJ Wali Nagari Definitif hingga terpilihnya wali nagari definitif.
              </p>

              <p>
                Pemilihan Wali Nagari serentak dilaksanakan pada 10 Desember 2022. Dari 11 bakal calon yang mendaftar, melalui proses seleksi ditetapkan 4 calon wali nagari. Hasil pemilihan menetapkan Afdel Haq, S.Pd.I. sebagai peraih suara terbanyak, yang kemudian dilantik pada 26 Desember 2022. Dengan pelantikan tersebut, Afdel Haq, S.Pd.I. resmi menjabat sebagai Wali Nagari Aia Manggih Barat dan berakhir pula masa jabatan PJ Wali Nagari sebelumnya.
              </p>
            </div>
          </div>

          {/* Visi & Misi Nagari */}
          <div>
            <div className="text-center mb-8 scroll-slide-left">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
                Visi &amp; Misi Nagari
              </h3>
              <div className="gonjong-line max-w-xs mx-auto mt-3"></div>
            </div>

            <div className="space-y-6">
              {/* Visi */}
              <div className="public-card p-6 sm:p-8 scroll-slide-bottom">
                <div className="flex items-center justify-center mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-extrabold text-[#1F2937] tracking-tight">
                    Visi
                  </h4>
                </div>

                <p className="text-base sm:text-lg leading-relaxed text-gray-800 text-center font-medium max-w-3xl mx-auto">
                  &ldquo;Mewujudkan Nagari Aia Manggih Barat yang Berprestasi dan Berkualitas untuk menuju Nagari yang Berkeadilan, Inovatif, Agamis, dan Berbudaya&rdquo;
                </p>
              </div>

              {/* Misi */}
              <div className="public-card p-6 sm:p-8 scroll-slide-bottom">
                <div className="flex items-center justify-center mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-extrabold text-[#1F2937] tracking-tight">
                    Misi
                  </h4>
                </div>

                <ul className="space-y-3.5 text-justify">
                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">1</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Meningkatkan serta Memelihara Nilai/norma Agama, Adat dan Budaya sesuai dengan Falsafah Adat Basandi Syara&apos;, Syara&apos; Basandi Kitabullah.
                    </span>
                  </li>

                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">2</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Mewujudkan Pemerintahan yang Amanah, Transparan dan Taat Aturan serta Profesional dalam Pelayanan Publik.
                    </span>
                  </li>

                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">3</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Mewujudkan Pembangunan yang Berkualitas dan sesuai dengan Kebutuhan Masyarakat.
                    </span>
                  </li>

                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">4</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Meningkatkan Kesejahteraan Masyarakat melalui Sumber Daya Nagari Berbasis Pemberdayaan Masyarakat.
                    </span>
                  </li>

                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">5</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Meningkatkan Daya Saing Ekonomi Masyarakat melalui Sumber Daya Alam dan Sumber Daya Manusia yang ada.
                    </span>
                  </li>

                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">6</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Menjadikan Pemuda sebagai &ldquo;Agent of Change&rdquo; (Pembawa Perubahan) dan Pemuda yang Kreatif.
                    </span>
                  </li>

                  <li className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 bg-[#F0E8DB] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#B6A587]/40 group-hover:bg-[#B6A587] transition-colors">
                      <span className="text-[#2C1B01] font-extrabold text-xs group-hover:text-white">7</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base pt-0.5">
                      Terwujudnya Lingkungan yang Bersih dan Sehat.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Batas Wilayah & Jorong */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Batas Wilayah */}
            <div className="public-card-hover p-6 sm:p-8 scroll-slide-left">
              <div className="flex items-center mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1F2937] tracking-tight truncate">
                    Batas-Batas Wilayah
                  </h3>
                  <p className="text-xs font-semibold text-[#5A3B0D]">Luas Wilayah ±9,38 km²</p>
                </div>
              </div>

              <div className="text-gray-700 leading-relaxed space-y-3 text-justify text-sm sm:text-base">
                <p>
                  Nagari Aia Manggih Barat merupakan daerah dataran dan perbukitan dengan luas wilayah lebih kurang ±9,38 km². Dengan batas-batas wilayah sebagai berikut:
                </p>

                <ul className="space-y-2 list-disc list-inside ml-2">
                  <li><strong>Sebelah Utara:</strong> berbatasan dengan Nagari Aia Manggih Utara</li>
                  <li><strong>Sebelah Selatan:</strong> berbatasan dengan Nagari Aia Manggih Selatan</li>
                  <li><strong>Sebelah Timur:</strong> berbatasan dengan Nagari Aia Manggih (Induk)</li>
                  <li><strong>Sebelah Barat:</strong> berbatasan dengan Nagari Sundata Selatan</li>
                </ul>
              </div>
            </div>

            {/* Jorong */}
            <div className="public-card-hover p-6 sm:p-8 scroll-slide-right">
              <div className="flex items-center mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1F2937] tracking-tight truncate">
                    Wilayah Jorong
                  </h3>
                  <p className="text-xs font-semibold text-[#5A3B0D]">2 Jorong Utama</p>
                </div>
              </div>

              <div className="text-gray-700 leading-relaxed space-y-3.5 text-justify text-sm sm:text-base">
                <p>
                  Nagari Aia Manggih Barat secara administratif terbagi menjadi 2 (dua) Jorong utama:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#F7F2E8] rounded-xl border border-[#E6DDCF]">
                    <p className="font-bold text-[#2C1B01] text-xs sm:text-sm mb-1">
                      1. Jorong Kampung Padang Paraman Dareh
                    </p>
                    <p className="text-xs text-gray-600 mb-1">Terdiri dari 2 kampung:</p>
                    <ul className="list-disc list-inside text-xs text-gray-700 font-medium ml-2 space-y-0.5">
                      <li>Kampung Padang</li>
                      <li>Kampung Paraman Dareh</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-[#F7F2E8] rounded-xl border border-[#E6DDCF]">
                    <p className="font-bold text-[#2C1B01] text-xs sm:text-sm mb-1">
                      2. Jorong Padang Sarai
                    </p>
                    <p className="text-xs text-gray-600 mb-1">Terdiri dari 4 kampung:</p>
                    <ul className="list-disc list-inside text-xs text-gray-700 font-medium ml-2 space-y-0.5">
                      <li>Kampung Caniago</li>
                      <li>Kampung Piliang</li>
                      <li>Kampung Mandailing</li>
                      <li>Kampung Tangah</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Penduduk */}
            <InformasiPendudukDinamis />

            {/* Sarana Pendidikan */}
            <SaranaPendidikanDinamis />

            {/* Kehidupan Sosial Keagamaan */}
            <div className="public-card-hover p-6 sm:p-8 scroll-slide-left">
              <div className="flex items-center mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-[#2C1B01] to-[#1A1200] rounded-xl flex items-center justify-center shadow-md text-[#B6A587] mr-3.5 flex-shrink-0 border border-[#B6A587]/30">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1F2937] tracking-tight truncate">
                    Kehidupan Sosial Keagamaan
                  </h3>
                  <p className="text-xs font-semibold text-[#5A3B0D]">Falsafah ABS-SBK</p>
                </div>
              </div>

              <div className="text-gray-700 leading-relaxed space-y-3.5 text-justify text-sm sm:text-base">
                <p>
                  Kehidupan sosial masyarakat nagari Aia Manggih Barat ditandai dengan kuatnya nilai kebersamaan, gotong royong, dan musyawarah. Masyarakat aktif dalam berbagai kegiatan sosial kemasyarakatan yang mempererat hubungan antarwarga serta menjaga keharmonisan hidup bersama.
                </p>

                <p>
                  Dalam kehidupan keagamaan, masyarakat nagari Aia Manggih Barat juga menjunjung tinggi nilai religius yang tercermin dalam pelaksanaan ibadah dan kegiatan keagamaan secara rutin seperti Jum&apos;atan, Wirid Yasin Nagari, Maulid Nabi, Isra&apos; Mi&apos;raj, dan Kegiatan Memasang Kaul Padi.
                </p>

                <p>
                  Rumah ibadah tidak hanya berfungsi sebagai tempat ibadah, tetapi juga sebagai pusat pembinaan moral, pendidikan keagamaan, dan penguatan persaudaraan antarwarga. Terdapat 3 Masjid dan 9 Mushalla di Nagari Aia Manggih Barat, serta 3 MDTA dan 2 TPQ yang aktif sebagai sarana pendidikan di Nagari ini.
                </p>
              </div>
            </div>

            {/* Kesehatan */}
            <KesehatanDinamis />

            {/* Kesenian Tradisional */}
            <KesenianDinamis />

            {/* Kelompok Tani dan BUMNag */}
            <KelompokTaniBumnagDinamis />
          </div>
        </div>
      </section>
    </div>
  );
}