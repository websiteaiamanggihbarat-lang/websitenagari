import LayananInformasiDinamis from "@/components/LayananInformasiDinamis"

export const metadata = {
  title: "Layanan Informasi - Nagari Aia Manggih Barat",
  description: "Informasi layanan administrasi surat, persyaratan dokumen, jadwal pelayanan, kontak kantor nagari, dan saluran pengaduan masyarakat Nagari Aia Manggih Barat.",
}

export default function LayananInformasiPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Layanan Informasi
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Informasi layanan dan persyaratan dokumen di Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Dynamic Component */}
          <LayananInformasiDinamis />
        </div>
      </div>
    </div>
  )
}
