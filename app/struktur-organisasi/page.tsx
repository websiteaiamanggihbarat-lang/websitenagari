export default function StrukturOrganisasi() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Struktur Organisasi
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Struktur organisasi Pemerintahan Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Organizational Chart Placeholder */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-12 lg:p-16 mb-12 border border-gray-200/50 shadow-xl">
            <div className="flex flex-col items-center">
              {/* Top Level - Wali Nagari */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 mb-12 min-w-[300px] text-center shadow-2xl shadow-blue-500/30 hover:shadow-3xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
                <h3 className="text-2xl font-bold mb-2 tracking-tight">
                  Wali Nagari
                </h3>
                <p className="text-blue-100 font-medium">Nama Wali Nagari</p>
              </div>

              {/* Second Level - Sekretaris & Kasi */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">Sekretaris</h4>
                  <p className="text-sm text-blue-50">Nama Sekretaris</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">
                    Kasi Pemerintahan
                  </h4>
                  <p className="text-sm text-blue-50">Nama Kasi</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">
                    Kasi Kesejahteraan
                  </h4>
                  <p className="text-sm text-blue-50">Nama Kasi</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">Kasi Pelayanan</h4>
                  <p className="text-sm text-blue-50">Nama Kasi</p>
                </div>
              </div>

              {/* Third Level - Staff */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-xl p-6 text-center shadow-lg shadow-blue-400/20 hover:shadow-xl hover:shadow-blue-400/30 transition-all duration-300 hover:scale-105">
                  <h5 className="font-semibold mb-2">Staff Pemerintahan</h5>
                  <p className="text-sm text-blue-50">Nama Staff</p>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-xl p-6 text-center shadow-lg shadow-blue-400/20 hover:shadow-xl hover:shadow-blue-400/30 transition-all duration-300 hover:scale-105">
                  <h5 className="font-semibold mb-2">Staff Kesejahteraan</h5>
                  <p className="text-sm text-blue-50">Nama Staff</p>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-xl p-6 text-center shadow-lg shadow-blue-400/20 hover:shadow-xl hover:shadow-blue-400/30 transition-all duration-300 hover:scale-105">
                  <h5 className="font-semibold mb-2">Staff Pelayanan</h5>
                  <p className="text-sm text-blue-50">Nama Staff</p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Note */}
          <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong className="font-semibold">Catatan:</strong> Struktur
              organisasi lengkap dengan nama dan jabatan akan ditampilkan di
              sini setelah data lengkap tersedia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
