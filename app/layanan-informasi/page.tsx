import LayananInformasiDinamis from "@/components/LayananInformasiDinamis"

export const metadata = {
  title: "Layanan Informasi - Nagari Aia Manggih Barat",
  description: "Informasi layanan administrasi surat, persyaratan dokumen, jadwal pelayanan, kontak kantor nagari, dan saluran pengaduan masyarakat Nagari Aia Manggih Barat.",
}

export default function LayananInformasiPage() {
  return (
    <div className="min-h-screen bg-public-warm text-[#1F2937]">
      <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-14 scroll-slide-left">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#B6A587]/20 text-[#2C1B01] border border-[#B6A587]/30 mb-3">
              Pelayanan Publik
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Layanan Informasi
            </h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto mt-2">
              Informasi persyaratan dokumen administrasi, jadwal operasional kantor, serta saluran resmi pengaduan masyarakat Nagari Aia Manggih Barat
            </p>
            <div className="gonjong-line max-w-xs mx-auto mt-4"></div>
          </div>

          {/* Dynamic Component */}
          <LayananInformasiDinamis />
        </div>
      </div>
    </div>
  )
}
