export default function PPID() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              PPID Nagari
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Pejabat Pengelola Informasi dan Dokumentasi Nagari Aia Manggih
              Barat
            </p>
          </div>

          {/* Main Info Card */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
              Informasi PPID
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Informasi tentang PPID Nagari akan ditampilkan di sini.
            </p>
          </div>

          {/* PPID Structure */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">
              Struktur PPID
            </h3>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-600 pl-6">
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                  Pejabat Pengelola Informasi dan Dokumentasi
                </h4>
                <p className="text-gray-600">
                  Nama dan kontak akan ditampilkan di sini
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                  Staf PPID
                </h4>
                <p className="text-gray-600">
                  Nama dan kontak akan ditampilkan di sini
                </p>
              </div>
            </div>
          </div>

          {/* Information Request */}
          <div className="bg-gray-50 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
              Permintaan Informasi Publik
            </h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Masyarakat dapat mengajukan permintaan informasi publik melalui:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span>
                  Formulir permintaan informasi (akan ditampilkan di sini)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span>Email: ppid@aiamanggihbarat.go.id</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span>Kantor Nagari Aia Manggih Barat</span>
              </li>
            </ul>
          </div>

          {/* Note */}
          <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong className="font-semibold">Catatan:</strong> Halaman ini
              akan diisi dengan informasi lengkap tentang PPID Nagari setelah
              data tersedia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
