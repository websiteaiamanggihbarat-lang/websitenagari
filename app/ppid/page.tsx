export default function PPID() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              PPID Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Pejabat Pengelola Informasi dan Dokumentasi Nagari Aia Manggih
              Barat
            </p>
          </div>

          {/* Main Info Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-10 border border-gray-200/50 shadow-xl mb-12 scroll-slide-bottom">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Informasi PPID
              </h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Informasi tentang PPID Nagari akan ditampilkan di sini.
            </p>
          </div>

          {/* PPID Structure */}
          <div className="mb-12 scroll-slide-right">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">
              Struktur PPID
            </h3>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border-l-4 border-[#2c1b01] shadow-md hover:shadow-lg transition-shadow scroll-slide-left">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">
                  Pejabat Pengelola Informasi dan Dokumentasi
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Nama dan kontak akan ditampilkan di sini
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-l-4 border-[#4a3210] shadow-md hover:shadow-lg transition-shadow scroll-slide-right">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">
                  Staf PPID
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Nama dan kontak akan ditampilkan di sini
                </p>
              </div>
            </div>
          </div>

          {/* Information Request */}
          <div className="bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-10 border border-[#d1c2a0] shadow-xl mb-12 scroll-slide-bottom">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                Permintaan Informasi Publik
              </h3>
            </div>
            <p className="text-gray-700 mb-8 leading-relaxed text-lg">
              Masyarakat dapat mengajukan permintaan informasi publik melalui:
            </p>
            <ul className="space-y-4">
              <li className="flex items-start group">
                <div className="w-8 h-8 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#d1c2a0] transition-colors">
                  <span className="text-[#2c1b01] font-bold">1</span>
                </div>
                <span className="text-gray-700 leading-relaxed pt-1.5">
                  Formulir permintaan informasi (akan ditampilkan di sini)
                </span>
              </li>
              <li className="flex items-start group">
                <div className="w-8 h-8 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#d1c2a0] transition-colors">
                  <span className="text-[#2c1b01] font-bold">2</span>
                </div>
                <span className="text-gray-700 leading-relaxed pt-1.5">Email: ppid@aiamanggihbarat.go.id</span>
              </li>
              <li className="flex items-start group">
                <div className="w-8 h-8 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#d1c2a0] transition-colors">
                  <span className="text-[#2c1b01] font-bold">3</span>
                </div>
                <span className="text-gray-700 leading-relaxed pt-1.5">Kantor Nagari Aia Manggih Barat</span>
              </li>
            </ul>
          </div>

          {/* Note */}
          <div className="bg-gradient-to-br from-[#f0e8db] to-white border-l-4 border-[#2c1b01] p-6 rounded-xl shadow-md scroll-fade">
            <p className="text-gray-700 leading-relaxed">
              <strong className="font-bold">Catatan:</strong> Halaman ini
              akan diisi dengan informasi lengkap tentang PPID Nagari setelah
              data tersedia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
