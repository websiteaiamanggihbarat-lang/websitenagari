export default function LembagaOrganisasi() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Lembaga dan Organisasi Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Lembaga dan organisasi yang ada di Nagari Aia Manggih Barat
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BUMNAG */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">BUMNAG</h2>
                <p className="text-blue-100 mt-2 text-sm font-medium">
                  Badan Usaha Milik Nagari
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Informasi tentang BUMNAG akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan BUMNAG akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan BUMNAG akan ditampilkan di sini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BAMUS */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">BAMUS</h2>
                <p className="text-blue-50 mt-2 text-sm font-medium">
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
                      Informasi tentang BAMUS akan ditampilkan di sini.
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
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">PKK</h2>
                <p className="text-blue-50 mt-2 text-sm font-medium">
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

            {/* Kelompok Tani */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">
                  Kelompok Tani
                </h2>
                <p className="text-blue-100 mt-2 text-sm font-medium">
                  Organisasi Kelompok Tani Nagari
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Informasi tentang Kelompok Tani akan ditampilkan di sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Struktur Kepengurusan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Struktur kepengurusan Kelompok Tani akan ditampilkan di
                      sini.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      Program & Kegiatan
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Program dan kegiatan Kelompok Tani akan ditampilkan di
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
