export default function LembagaOrganisasi() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Lembaga dan Organisasi Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Lembaga dan organisasi yang ada di Nagari Aia Manggih Barat
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BAMUS */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-left">
              <div className="bg-gradient-to-br from-[#2c1b01] to-[#1a1200] text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">BAMUS</h2>
                <p className="text-[#e6ddcf] mt-2 text-sm font-medium">
                  Badan Musyawarah Nagari
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Bamus merupakan Lembaga Pemberdayaan Masyarakat Nagari.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan BAMUS akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan BAMUS akan ditampilkan di sini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PKK */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-right">
              <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">PKK</h2>
                <p className="text-[#f0e8db] mt-2 text-sm font-medium">
                  Pemberdayaan Kesejahteraan Keluarga
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Informasi tentang PKK akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan PKK akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan PKK akan ditampilkan di sini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Karang Taruna */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-left">
              <div className="bg-gradient-to-br from-[#8a6a3a] to-[#4a3210] text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">
                  Karang Taruna
                </h2>
                <p className="text-[#f0e8db] mt-2 text-sm font-medium">
                  Organisasi Pemuda Nagari
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Informasi tentang Karang Taruna akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan Karang Taruna akan ditampilkan di
                      sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan Karang Taruna akan ditampilkan di
                      sini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kader Posyandu */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-right">
              <div className="bg-gradient-to-br from-[#2c1b01] to-[#1a1200] text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">
                  Kader Posyandu
                </h2>
                <p className="text-[#e6ddcf] mt-2 text-sm font-medium">
                  Kader Pos Pelayanan Terpadu
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Informasi tentang Kader Posyandu akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan Kader Posyandu akan ditampilkan di
                      sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan Kader Posyandu akan ditampilkan di
                      sini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LMPHBN */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 md:col-span-2 scroll-slide-bottom">
              <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">
                  LMPHBN
                </h2>
                <p className="text-[#f0e8db] mt-2 text-sm font-medium">
                  Lembaga Masyarakat Perlindungan Hutan Berbasis Nagari
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Informasi tentang LMPHBN akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan LMPHBN akan ditampilkan di
                      sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan LMPHBN akan ditampilkan di
                      sini.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
