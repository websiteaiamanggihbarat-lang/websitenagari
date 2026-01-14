export default function StrukturOrganisasi() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Struktur Organisasi
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Struktur organisasi Pemerintahan Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Organizational Chart Placeholder */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-12 lg:p-16 mb-12 border border-gray-200/50 shadow-xl">
            <div className="flex flex-col items-center">
              {/* Top Level - Wali Nagari */}
              <div className="bg-gradient-to-br from-[#2c1b01] to-[#1a1200] text-white rounded-2xl p-8 mb-12 min-w-[300px] text-center shadow-2xl shadow-[rgba(44,27,1,0.3)] hover:shadow-3xl hover:shadow-[rgba(44,27,1,0.4)] transition-all duration-300 hover:scale-105">
                <h3 className="text-2xl font-bold mb-2 tracking-tight">
                  Wali Nagari
                </h3>
                <p className="text-[#e6ddcf] font-medium">Nama Wali Nagari</p>
              </div>

              {/* Second Level - Sekretaris & Kasi */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">Sekretaris</h4>
                  <p className="text-sm text-[#f0e8db]">Nama Sekretaris</p>
                </div>
                <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">
                    Kasi Pemerintahan
                  </h4>
                  <p className="text-sm text-[#f0e8db]">Nama Kasi</p>
                </div>
                <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">
                    Kasi Kesejahteraan
                  </h4>
                  <p className="text-sm text-[#f0e8db]">Nama Kasi</p>
                </div>
                <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 min-w-[240px] text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                  <h4 className="font-bold mb-2 text-lg">Kasi Pelayanan</h4>
                  <p className="text-sm text-[#f0e8db]">Nama Kasi</p>
                </div>
              </div>

              {/* Third Level - Staff */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                <div className="bg-gradient-to-br from-[#8a6a3a] to-[#4a3210] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(138,106,58,0.2)] hover:shadow-xl hover:shadow-[rgba(138,106,58,0.3)] transition-all duration-300 hover:scale-105">
                  <h5 className="font-semibold mb-2">Staff Pemerintahan</h5>
                  <p className="text-sm text-[#f0e8db]">Nama Staff</p>
                </div>
                <div className="bg-gradient-to-br from-[#8a6a3a] to-[#4a3210] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(138,106,58,0.2)] hover:shadow-xl hover:shadow-[rgba(138,106,58,0.3)] transition-all duration-300 hover:scale-105">
                  <h5 className="font-semibold mb-2">Staff Kesejahteraan</h5>
                  <p className="text-sm text-[#f0e8db]">Nama Staff</p>
                </div>
                <div className="bg-gradient-to-br from-[#8a6a3a] to-[#4a3210] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(138,106,58,0.2)] hover:shadow-xl hover:shadow-[rgba(138,106,58,0.3)] transition-all duration-300 hover:scale-105">
                  <h5 className="font-semibold mb-2">Staff Pelayanan</h5>
                  <p className="text-sm text-[#f0e8db]">Nama Staff</p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Note */}
          <div className="bg-gray-50 border-l-4 border-[#2c1b01] p-6 rounded-lg">
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
