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
            <div className="w-full flex items-center justify-center">
              <img
                src="/image/struktur-nagari.png"
                alt="Struktur Organisasi Nagari Aia Manggih Barat"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
