import HeroBerandaDinamis from "@/components/HeroBerandaDinamis";
import PetaNagariDinamis from "@/components/PetaNagariDinamis";
import InformasiPendudukDinamis from "@/components/InformasiPendudukDinamis";
import SaranaPendidikanDinamis from "@/components/SaranaPendidikanDinamis";
import KesehatanDinamis from "@/components/KesehatanDinamis";
import KesenianDinamis from "@/components/KesenianDinamis";
import KelompokTaniBumnagDinamis from "@/components/KelompokTaniBumnagDinamis";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Beranda Dinamis */}
      <HeroBerandaDinamis />

      {/* Visi Misi Pelayanan */}
      <section className="relative py-20 px-6 lg:px-8 overflow-hidden">
        <div className="relative max-w-6xl mx-auto scroll-slide-bottom">
          <div className="text-center mb-10">
            <p className="text-2xl uppercase tracking-[0.3em] text-[#5a3b0d] mb-3">
              Visi Misi Pelayanan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visi Pelayanan */}
            <div className="group bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-gray-200/60 shadow-lg hover:shadow-2xl hover:border-[#c0ae86] transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Visi Pelayanan
                </h3>
              </div>

              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                Memberikan pelayanan prima kepada
                masyarakat dengan menerapkan “RANCAK BANA”
                (Ramah, Amanah, Normatif, Cepat, Akurat,
                Kreatif, Bebas Biaya, Aman, Nyaman, Adil).
              </p>
            </div>

            {/* Misi Pelayanan */}
            <div className="group bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-gray-200/60 shadow-lg hover:shadow-2xl hover:border-[#c0ae86] transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Misi Pelayanan
                </h3>
              </div>

              <ol className="space-y-3 text-gray-700 text-base md:text-lg list-decimal list-inside">
                <li>
                  Mewujudkan pelayanan yang “RANCAK BANA”.
                </li>

                <li>
                  Meningkatkan kualitas aparatur pelayanan
                  yang profesional.
                </li>

                <li>
                  Memberikan pelayanan sesuai Standar
                  Operasional Pelayanan di Aia Manggih Barat.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Peta Section */}
      <section
        id="peta"
        className="py-28 px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-slide-left">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Peta Nagari
            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Lokasi dan batas wilayah Nagari Aia Manggih
              Barat
            </p>
          </div>

          <PetaNagariDinamis />
        </div>
      </section>

      {/* Profil Nagari Section */}
      <section
        id="profil"
        className="py-28 px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-slide-left">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Profil Nagari
            </h2>

            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full"></div>
          </div>

          {/* Sejarah Nagari - Full Width */}
          <div className="mb-16 group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-10 lg:p-12 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-bottom">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                Sejarah Nagari
              </h3>
            </div>

            <div className="text-gray-700 leading-relaxed space-y-4 text-base text-justify">
              <p>
                Nagari Aia Manggih Barat merupakan pemekaran
                nagari yang dilakukan oleh Pemerintah
                Kabupaten Pasaman melalui Peraturan Bupati
                Pasaman Nomor 21 Tahun 2017. Kebijakan ini
                menambah 25 nagari persiapan dari sebelumnya
                37 nagari, salah satunya adalah Nagari
                Persiapan Aia Manggih Barat yang merupakan
                hasil pemekaran dari Nagari Induk Nagari Aia
                Manggih Barat Kecamatan Lubuk Sikaping.
                Kesepakatan pemekaran tersebut dihasilkan
                melalui Musyawarah Nagari pada 26 Oktober
                2016 di MDTA Al Munawarah Aia Manggih Barat.
              </p>

              <p>
                Sebagai tindak lanjut, Yomi Valentia, S.S.,
                M.M. dilantik sebagai Penjabat (PJ) Wali
                Nagari Persiapan Aia Manggih Barat pada tahun
                2017. Pada masa awal, nagari persiapan belum
                memiliki struktur organisasi lengkap dan
                hanya dibantu oleh perangkat dari nagari
                induk serta dua jorong, yaitu Jorong Kampung
                Padang Paraman Dareh dan Jorong Padang Sarai.
                Setelah melalui proses seleksi dan mendapat
                rekomendasi camat, perangkat nagari persiapan
                resmi dilantik pada 30 Mei 2018.
              </p>

              <p>
                Pada akhir November 2019, jabatan PJ Wali
                Nagari Persiapan Aia Manggih Barat beralih
                kepada Amrizal, S.H., yang menjabat hingga
                Oktober 2022. Pada September 2022,
                berdasarkan penetapan nomor register dari
                Kementerian Dalam Negeri, Nagari Persiapan
                Aia Manggih Barat resmi menjadi nagari
                definitif. Selanjutnya, Ilham Syah, S.Pd.,
                M.M. ditunjuk sebagai PJ Wali Nagari
                Definitif hingga terpilihnya wali nagari
                definitif.
              </p>

              <p>
                Pemilihan Wali Nagari serentak dilaksanakan
                pada 10 Desember 2022. Dari 11 bakal calon
                yang mendaftar, melalui proses seleksi
                ditetapkan 4 calon wali nagari. Hasil
                pemilihan menetapkan Afdel Haq, S.Pd.I.
                sebagai peraih suara terbanyak, yang kemudian
                dilantik pada 26 Desember 2022. Dengan
                pelantikan tersebut, Afdel Haq, S.Pd.I. resmi
                menjabat sebagai Wali Nagari Aia Manggih
                Barat dan berakhir pula masa jabatan PJ Wali
                Nagari sebelumnya.
              </p>
            </div>
          </div>

          {/* Visi Misi - Below Sejarah */}
          <div className="mb-16">
            <div className="text-center mb-12 scroll-slide-left">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                Visi & Misi
              </h3>

              <div className="w-20 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full"></div>
            </div>

            <div className="flex flex-col gap-8">
              {/* Visi */}
              <div className="group bg-white rounded-2xl p-10 border border-gray-200/50 shadow-xl hover:shadow-2xl hover:border-[#c0ae86] transition-all duration-300 hover:scale-[1.02] scroll-slide-bottom">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>

                  <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Visi
                  </h4>
                </div>

                <p className="text-lg leading-relaxed text-gray-700 text-center">
                  Mewujudkan Nagari Aia Manggih Barat yang
                  Berprestasi dan Berkualitas untuk menuju
                  Nagari yang Berkeadilan, Inovatif, Agamis,
                  dan Berbudaya
                </p>
              </div>

              {/* Misi */}
              <div className="group bg-white rounded-2xl p-10 border border-gray-200/50 shadow-xl hover:shadow-2xl hover:border-[#c0ae86] transition-all duration-300 hover:scale-[1.02] scroll-slide-bottom">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>

                  <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Misi
                  </h4>
                </div>

                <ul className="space-y-5 text-justify">
                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        1
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Meningkatkan serta Memelihara Nilai/norma
                      Agama, Adat dan Budaya sesuai dengan
                      Falsafah Adat Basandi Syara', Syara'
                      Basandi Kitabullah.
                    </span>
                  </li>

                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        2
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Mewujudkan Pemerintahan yang Amanah,
                      Transpran dan Taat Aturan serta
                      Profesional dalam Pelayanan Publik.
                    </span>
                  </li>

                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        3
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Mewujudkan Pembangunan yang Berkualitas
                      dan sesuai dengan Kebutuhan Masyarakat.
                    </span>
                  </li>

                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        4
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Meningkatkan Kesejahteraan Masyarakat
                      melalui Sumber Daya Nagari Berbasis
                      Pemberdayaan Masyarakat.
                    </span>
                  </li>

                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        5
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Meningkatkan Daya Saing Ekonomi
                      Masyarakat melalui Sumber Daya Alam dan
                      Sumber Daya Manusia yang ada.
                    </span>
                  </li>

                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        6
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Menjadikan Pemuda sebagai "Agen of
                      Change" (Pembawa Perubahan) dan Pemuda
                      yang Kreatif.
                    </span>
                  </li>

                  <li className="flex items-start group/item">
                    <div className="w-6 h-6 bg-[#e6ddcf] rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <span className="text-[#2c1b01] font-bold text-sm">
                        7
                      </span>
                    </div>

                    <span className="text-gray-700 leading-relaxed pt-0.5">
                      Terwujudnya Lingkungan yang Bersih dan
                      Sehat.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Batas Wilayah */}
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-left">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4a3210] to-[#2c1b01] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Batas-Batas Wilayah
                </h3>
              </div>

              <div className="text-gray-700 leading-relaxed space-y-3 text-justify">
                <p>
                  Nagari Aia Manggih Barat merupakan daerah
                  dataran dan perbukitan dengan luas wilayah
                  lebih kurang ±9,38 km². Dengan batas-batas
                  wilayah sebagai berikut:
                </p>

                <ul className="space-y-2 list-disc list-inside ml-2">
                  <li>
                    Sebelah Utara berbatasan dengan Nagari Aia
                    Manggih Utara
                  </li>

                  <li>
                    Sebelah Selatan berbatasan dengan Nagari
                    Aia Manggih Selatan
                  </li>

                  <li>
                    Sebelah Timur berbatasan dengan Nagari Aia
                    Manggih (Induk)
                  </li>

                  <li>
                    Sebelah Barat berbatasan dengan Nagari
                    Sundata Selatan
                  </li>
                </ul>
              </div>
            </div>

            {/* Jorong */}
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-right">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4a3210] to-[#2c1b01] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Jorong
                </h3>
              </div>

              <div className="text-gray-700 leading-relaxed space-y-4 text-justify">
                <p>
                  Nagari Aia Manggih Barat terdiri dari 2
                  jorong yaitu:
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold mb-2">
                      Jorong Kampung Padang Paraman Dareh
                      terdapat 2 kampung yaitu:
                    </p>

                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Kampung Padang</li>
                      <li>Kampung Paraman Dareh</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">
                      Jorong Padang Sarai terdiri dari 4
                      kampung yaitu:
                    </p>

                    <ul className="list-disc list-inside ml-4 space-y-1">
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
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-left">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4a3210] to-[#2c1b01] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Kehidupan Sosial Keagamaan
                </h3>
              </div>

              <div className="text-gray-700 leading-relaxed space-y-4 text-justify">
                <p>
                  Kehidupan sosial masyarakat nagari Aia
                  Manggih Barat ditandai dengan kuatnya nilai
                  kebersamaan, gotong royong, dan musyawarah.
                  Masyarakat aktif dalam berbagai kegiatan
                  sosial kemasyarakatan yang mempererat
                  hubungan antarwarga serta menjaga
                  keharmonisan hidup Bersama.
                </p>

                <p>
                  Dalam kehidupan keagamaan, masyarakat
                  nagari Aia Manggih Barat juga menjunjung
                  tinggi nilai religius yang tercermin dalam
                  pelaksanaan ibadah dan kegiatan keagamaan
                  secara rutin seperti Jum'atan, Wirid Yasin
                  Nagari, Maulid Nabi, Isra' Mijraj, dan
                  Kegiatan Memasang Kaul Padi.
                </p>

                <p>
                  Rumah ibadah tidak hanya berfungsi sebagai
                  tempat ibadah, tetapi juga sebagai pusat
                  pembinaan moral, pendidikan keagamaan, dan
                  penguatan persaudaraan antarwarga. Terdapat
                  3 Masjid dan 9 Mushalla di Nagari Aia
                  Manggih barat. Serta terdapat 3 MDTA dan 2
                  TPQ yang aktif sebagai sarana Pendidikan di
                  Nagari ini.
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