export default function StrukturOrganisasi() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Struktur Organisasi
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Struktur organisasi Pemerintahan Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Organizational Chart Placeholder */}
          <div className="bg-gray-50 rounded-lg p-12 lg:p-16 mb-12">
            <div className="flex flex-col items-center">
              {/* Top Level - Wali Nagari */}
              <div className="bg-blue-600 text-white rounded-lg p-8 mb-12 min-w-[280px] text-center">
                <h3 className="text-2xl font-semibold mb-2 tracking-tight">
                  Wali Nagari
                </h3>
                <p className="text-blue-100">Nama Wali Nagari</p>
              </div>

              {/* Second Level - Sekretaris & Kasi */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="bg-blue-500 text-white rounded-lg p-6 min-w-[240px] text-center">
                  <h4 className="font-semibold mb-2 text-lg">Sekretaris</h4>
                  <p className="text-sm text-blue-100">Nama Sekretaris</p>
                </div>
                <div className="bg-blue-500 text-white rounded-lg p-6 min-w-[240px] text-center">
                  <h4 className="font-semibold mb-2 text-lg">
                    Kasi Pemerintahan
                  </h4>
                  <p className="text-sm text-blue-100">Nama Kasi</p>
                </div>
                <div className="bg-blue-500 text-white rounded-lg p-6 min-w-[240px] text-center">
                  <h4 className="font-semibold mb-2 text-lg">
                    Kasi Kesejahteraan
                  </h4>
                  <p className="text-sm text-blue-100">Nama Kasi</p>
                </div>
                <div className="bg-blue-500 text-white rounded-lg p-6 min-w-[240px] text-center">
                  <h4 className="font-semibold mb-2 text-lg">Kasi Pelayanan</h4>
                  <p className="text-sm text-blue-100">Nama Kasi</p>
                </div>
              </div>

              {/* Third Level - Staff */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                <div className="bg-blue-400 text-white rounded-lg p-6 text-center">
                  <h5 className="font-medium mb-2">Staff Pemerintahan</h5>
                  <p className="text-sm text-blue-50">Nama Staff</p>
                </div>
                <div className="bg-blue-400 text-white rounded-lg p-6 text-center">
                  <h5 className="font-medium mb-2">Staff Kesejahteraan</h5>
                  <p className="text-sm text-blue-50">Nama Staff</p>
                </div>
                <div className="bg-blue-400 text-white rounded-lg p-6 text-center">
                  <h5 className="font-medium mb-2">Staff Pelayanan</h5>
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
