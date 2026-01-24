export default function StrukturOrganisasi() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Struktur Organisasi
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Struktur organisasi Pemerintahan Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Organizational Structure */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 lg:p-16 mb-12 border border-gray-200/50 shadow-xl scroll-scale">
            <div className="relative flex flex-col items-center w-full min-h-[900px] py-8">
              
              {/* Level 1: WALI NAGARI - Top Center */}
              <div className="relative z-20 mb-16 scroll-slide-bottom">
                <div className="bg-gradient-to-br from-[#2c1b01] to-[#1a1200] text-white rounded-2xl p-8 w-[320px] text-center shadow-2xl shadow-[rgba(44,27,1,0.3)] hover:shadow-3xl hover:shadow-[rgba(44,27,1,0.4)] transition-all duration-300 hover:scale-105">
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">WALI NAGARI</h3>
                  <p className="text-[#e6ddcf] font-medium">Afdel Haq, S.Pd.I</p>
                </div>
              </div>

              {/* Main vertical line from WALI NAGARI down to branch point */}
              <div className="absolute top-[11.5rem] left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-gray-400 z-10"></div>

              {/* Horizontal branch line at middle level */}
              <div className="absolute top-[13.5rem] left-1/2 transform -translate-x-1/2 w-96 h-0.5 bg-gray-400 z-10 hidden lg:block"></div>

              {/* Level 2: Container for KASI and SEKRETARIS */}
              <div className="relative z-20 w-full max-w-6xl flex flex-col lg:flex-row justify-center items-start gap-16 mt-8 mb-32">
                
                {/* Left Branch: KASI Sections */}
                <div className="flex-1 flex flex-col items-center lg:items-end relative">
                  {/* Vertical connector from horizontal branch to first KASI */}
                  <div className="absolute top-[-2rem] left-1/2 lg:left-auto lg:right-[140px] transform -translate-x-1/2 lg:translate-x-0 w-0.5 h-8 bg-gray-400 z-10 hidden lg:block"></div>

                  {/* KASI Kesejahteraan dan Pelayanan */}
                  <div className="w-full max-w-[280px] mb-6 scroll-slide-left relative">
                    <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                      <h4 className="font-bold mb-2 text-sm leading-tight">KASI KESEJAHTERAAN DAN PELAYANAN</h4>
                      <p className="text-xs text-[#f0e8db] mb-3">Hengki Pratama Effendi, SH</p>
                      {/* Vertical line to STAF */}
                      <div className="w-0.5 h-4 bg-gray-300 mx-auto mb-2"></div>
                      <div className="border-t border-white/20 pt-2 mt-2">
                        <p className="text-xs text-[#e6ddcf] mb-1">STAF</p>
                        <p className="text-xs text-[#f0e8db]">Muhammad Yefri, S.Pd</p>
                      </div>
                    </div>
                  </div>

                  {/* Vertical connector between KASI */}
                  <div className="w-0.5 h-6 bg-gray-400 mb-6 mx-auto lg:mx-0 lg:mr-[140px]"></div>

                  {/* KASI Pemerintahan */}
                  <div className="w-full max-w-[280px] scroll-slide-left relative">
                    {/* Vertical connector line */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-400"></div>
                    <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                      <h4 className="font-bold mb-2 text-sm">KASI PEMERINTAHAN</h4>
                      <p className="text-xs text-[#f0e8db] mb-3">Mahyeli Irawan</p>
                      {/* Vertical line to STAF */}
                      <div className="w-0.5 h-4 bg-gray-300 mx-auto mb-2"></div>
                      <div className="border-t border-white/20 pt-2 mt-2">
                        <p className="text-xs text-[#e6ddcf] mb-1">STAF</p>
                        <p className="text-xs text-[#f0e8db]">Hasmaini, S.Pd</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Branch: SEKRETARIS with KAUR */}
                <div className="flex-1 flex flex-col items-center lg:items-start relative">
                  {/* Vertical connector from horizontal branch to SEKRETARIS */}
                  <div className="absolute top-[-2rem] left-1/2 lg:left-[140px] transform -translate-x-1/2 lg:translate-x-0 w-0.5 h-16 bg-gray-400 z-10 hidden lg:block"></div>

                  {/* SEKRETARIS NAGARI */}
                  <div className="w-full max-w-[280px] mb-6 scroll-slide-right relative">
                    <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                      <h4 className="font-bold mb-2 text-sm">SEKRETARIS NAGARI</h4>
                      <p className="text-xs text-[#f0e8db]">Riko Julhasra, S.Hum</p>
                    </div>
                  </div>

                  {/* Vertical connector from SEKRETARIS to KAUR horizontal line */}
                  <div className="w-0.5 h-6 bg-gray-400 mb-6 mx-auto lg:mx-0 lg:ml-[140px]"></div>

                  {/* Horizontal line for KAUR branches */}
                  <div className="relative w-full flex flex-col md:flex-row gap-4 justify-center lg:justify-start">
                    {/* Horizontal connector line above KAUR */}
                    <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gray-400"></div>

                    {/* KAUR Keuangan (Left) */}
                    <div className="w-full md:w-[240px] relative scroll-slide-left">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-400"></div>
                      <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-5 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                        <h4 className="font-bold mb-2 text-xs">KAUR KEUANGAN</h4>
                        <p className="text-xs text-[#f0e8db] mb-3">Westi Mega Sari, S.Pd.I</p>
                        {/* Vertical line to STAF */}
                        <div className="w-0.5 h-3 bg-gray-300 mx-auto mb-2"></div>
                        <div className="border-t border-white/20 pt-2 mt-2">
                          <p className="text-xs text-[#e6ddcf] mb-1">STAF</p>
                          <p className="text-xs text-[#f0e8db]">Rini, S.Pd</p>
                        </div>
                      </div>
                    </div>

                    {/* KAUR Umum dan Perencanaan (Right) */}
                    <div className="w-full md:w-[240px] relative scroll-slide-right">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-400"></div>
                      <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-5 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                        <h4 className="font-bold mb-2 text-xs leading-tight">KAUR UMUM DAN PERENCANAAN</h4>
                        <p className="text-xs text-[#f0e8db] mb-3">Syafrida</p>
                        {/* Vertical line to STAF */}
                        <div className="w-0.5 h-3 bg-gray-300 mx-auto mb-2"></div>
                        <div className="border-t border-white/20 pt-2 mt-2">
                          <p className="text-xs text-[#e6ddcf] mb-1">STAF</p>
                          <p className="text-xs text-[#f0e8db]">Dian Rahmanita</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Long vertical line from middle section down to JORONG level */}
              <div className="absolute top-[13.5rem] left-1/2 transform -translate-x-1/2 w-0.5 h-[calc(100%-13.5rem-10rem)] bg-gray-400 z-10"></div>

              {/* Horizontal line above JORONG */}
              <div className="absolute bottom-[10rem] left-1/2 transform -translate-x-1/2 w-80 h-0.5 bg-gray-400 z-10 hidden lg:block"></div>

              {/* Level 3: JORONG Positions (Bottom) */}
              <div className="relative z-20 w-full max-w-4xl flex flex-col lg:flex-row justify-center items-center gap-8 mt-auto pt-8">
                {/* KA. JORONG PADANG SARAI (Left) */}
                <div className="w-full lg:w-[300px] relative scroll-slide-left">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400 hidden lg:block"></div>
                  <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                    <h4 className="font-bold mb-2 text-sm">KA. JORONG PADANG SARAI</h4>
                    <p className="text-xs text-[#f0e8db]">Lahmizal Netri</p>
                  </div>
                </div>

                {/* KA. JORONG KP. PADANG PR. DAREH (Right) */}
                <div className="w-full lg:w-[300px] relative scroll-slide-right">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400 hidden lg:block"></div>
                  <div className="bg-gradient-to-br from-[#4a3210] to-[#2c1b01] text-white rounded-xl p-6 text-center shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)] transition-all duration-300 hover:scale-105">
                    <h4 className="font-bold mb-2 text-sm leading-tight">KA. JORONG KP. PADANG PR. DAREH</h4>
                    <p className="text-xs text-[#f0e8db]">Israhayu, SE</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Petugas */}
            <div className="relative z-20 w-full mt-16 pt-8 border-t border-gray-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center scroll-slide-bottom">Petugas</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-[#c0ae86] transition-all duration-300 scroll-slide-left">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">Petugas Data</h4>
                  <p className="text-gray-700 text-sm">Khairil Amri S.M</p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-[#c0ae86] transition-all duration-300 scroll-slide-right">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">Petugas Keamanan</h4>
                  <p className="text-gray-700 text-sm">Herlina</p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-[#c0ae86] transition-all duration-300 scroll-slide-left">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">Petugas Keamanan</h4>
                  <p className="text-gray-700 text-sm">Nugraha Candra M.F, S.Pt</p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-[#c0ae86] transition-all duration-300 scroll-slide-right">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">Petugas Keamanan</h4>
                  <p className="text-gray-700 text-sm">Meri Oktavia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
