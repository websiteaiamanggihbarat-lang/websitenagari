export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
            Nagari Aia Manggih Barat
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
            Website Resmi Pemerintahan Nagari Aia Manggih Barat
          </p>
        </div>
      </section>

      {/* Peta Section */}
      <section id="peta" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16 text-center tracking-tight">
            Peta Nagari
          </h2>
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg
                  className="w-20 h-20 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="text-base font-medium">Peta akan ditampilkan di sini</p>
                <p className="text-sm mt-1 text-gray-400">
                  Integrasikan dengan Google Maps atau peta interaktif
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profil Nagari Section */}
      <section id="profil" className="py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-20 text-center tracking-tight">
            Profil Nagari
          </h2>
          <div className="space-y-16">
            {/* Pengertian Nagari */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Pengertian Nagari
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Konten tentang pengertian nagari akan ditampilkan di sini.
              </p>
            </div>

            {/* Batas Wilayah */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Batas-Batas Wilayah
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Informasi batas-batas wilayah nagari akan ditampilkan di sini.
              </p>
            </div>

            {/* Korong */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Korong
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Daftar korong di Nagari Aia Manggih Barat akan ditampilkan di
                sini.
              </p>
            </div>

            {/* Informasi Penduduk */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Informasi Penduduk
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Data kependudukan akan ditampilkan di sini.
              </p>
            </div>

            {/* Luas Wilayah */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Luas Wilayah
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Informasi luas wilayah akan ditampilkan di sini.
              </p>
            </div>

            {/* Sarana Pendidikan */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Sarana Pendidikan
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Informasi sarana pendidikan akan ditampilkan di sini.
              </p>
            </div>

            {/* Kehidupan Sosial Keagamaan */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Kehidupan Sosial Keagamaan
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Informasi kehidupan sosial keagamaan akan ditampilkan di sini.
              </p>
            </div>

            {/* Kesehatan */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Kesehatan
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Informasi kesehatan akan ditampilkan di sini.
              </p>
            </div>

            {/* Sejarah Nagari */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Sejarah Nagari Aia Manggih
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Sejarah nagari akan ditampilkan di sini.
              </p>
            </div>

            {/* Pemekaran */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Pemekaran
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                Informasi tentang pemekaran nagari akan ditampilkan di sini.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visi Misi Section */}
      <section id="visi-misi" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-20 text-center tracking-tight">
            Visi & Misi
          </h2>
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Visi */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-blue-600 mb-8 tracking-tight">
                Visi
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Visi Nagari Aia Manggih Barat akan ditampilkan di sini.
              </p>
            </div>

            {/* Misi */}
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-blue-600 mb-8 tracking-tight">
                Misi
              </h3>
              <ul className="space-y-4 text-lg text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span>Misi pertama akan ditampilkan di sini</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span>Misi kedua akan ditampilkan di sini</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span>Misi ketiga akan ditampilkan di sini</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
