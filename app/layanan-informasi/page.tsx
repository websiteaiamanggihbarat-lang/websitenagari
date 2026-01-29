export default function LayananInformasi() {
  const dokumenList = [
    {
      nama: "SK Miskin",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Kurang Mampu",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "NA",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Surat izin kawin dari Ninik Mamak"],
      waktu: "2 Hari",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "Surat Tanah",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Surat Jual Beli/Hibah"],
      waktu: "2 Hari",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "Surat Domisili",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Minimal Berdomisili Selama 6 Bulan"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Domisili Partai Politik",
      persyaratan: ["Identitas Partai Politik", "Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Domisili Perusahaan",
      persyaratan: ["Identitas Perusahaan", "Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Domisili kantor",
      persyaratan: ["Identitas Kantor", "Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "30 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Usaha",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "20 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Berperilaku Baik",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "20 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Ahli Waris",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Identitas Ahli Waris"],
      waktu: "30 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Meninggal",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Keterangan Meninggal (Tempat & Waktu Pemakaman)"],
      waktu: "20 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Janda/Duda",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Buku Nikah", "Surat Keterangan Meninggal Suami/Istri"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "Surat Pengantar IMB",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Fotocopy Sertifikat Tanah"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Memiliki Rumah",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Fotocopy Sertifikat Tanah", "Identitas Rumah"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "Surat Pengantar Izin Keramaian",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB", "Permohonan 7 Rekomendasi dari Ninik Mamak", "Susunan Kepanitiaan", "Surat Izin Pemakaian Tempat", "Diajukan 4 Hari Sebelum Acara"],
      waktu: "2 Hari",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Lain-Lain",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "Pengantar KTP",
      persyaratan: ["Fotocopy KK", "SK Domisili", "Bukti Lunas PBB"],
      waktu: "20 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "Pengantar KK",
      persyaratan: ["Fotocopy Buku Nikah", "Ijazah Terakhir", "Fotocopy KTP", "Bukti Lunas PBB"],
      waktu: "30 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Belum Menikah",
      persyaratan: ["Fotocopy KK/KTP", "Bukti Lunas PBB"],
      waktu: "25 Menit",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    },
    {
      nama: "SK Kelompok Masyarakat",
      persyaratan: ["Data Kelompok yang Telah Disahkan", "Berita Acara Pembentukkan Kelompok", "Struktur Kepengurusan Kelompok"],
      waktu: "2 Hari",
      biaya: "Gratis",
      sifat: "Final di Nagari"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Layanan Informasi
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Informasi layanan dan persyaratan dokumen di Nagari Aia Manggih
              Barat
            </p>
          </div>

          <div className="space-y-16">
            {/* Kontak Pelayanan & Waktu Pelayanan */}
            <section id="kontak-pelayanan" className="scroll-slide-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 tracking-tight">
                Kontak Pelayanan & Waktu Pelayanan
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Kontak Pelayanan */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 shadow-lg scroll-slide-left">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Kontak Pelayanan
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start group/item">
                      <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                        <svg
                          className="w-5 h-5 text-[#2c1b01]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Telepon</p>
                        <p className="text-gray-600">082268789740 – 082172235321</p>
                      </div>
                    </div>
                    <div className="flex items-start group/item">
                      <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                        <svg
                          className="w-5 h-5 text-[#2c1b01]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1">WhatsApp</p>
                        <p className="text-gray-600">+62 823-1586-3113</p>
                      </div>
                    </div>
                    <div className="flex items-start group/item">
                      <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                        <svg
                          className="w-5 h-5 text-[#2c1b01]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Gmail</p>
                        <p className="text-gray-600">
                          aiamanggihbarat02@gmail.com
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start group/item">
                      <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                        <svg
                          className="w-5 h-5 text-[#2c1b01]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1">Alamat</p>
                        <p className="text-gray-600">
                          Kantor Wali Nagari Aia Manggih Barat
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Waktu Pelayanan */}
                <div className="bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-8 border border-[#d1c2a0] shadow-lg scroll-slide-right">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Waktu Pelayanan
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <div className="pb-5 border-b border-gray-200 last:border-0">
                      <p className="font-bold text-gray-900 mb-1">Senin - Kamis</p>
                      <p className="text-gray-600">08.00 - 16.00</p>
                    </div>
                    <div className="pb-5 border-b border-gray-200 last:border-0">
                      <p className="font-bold text-gray-900 mb-1">Jum'at</p>
                      <p className="text-gray-600">08.00 - 16.30</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Sabtu - Minggu</p>
                      <p className="text-gray-600">Tutup</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Persyaratan Dokumen */}
            <section id="persyaratan-dokumen" className="scroll-slide-right">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                Persyaratan Dokumen
              </h2>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Berikut adalah daftar dokumen administrasi yang dilayani di Nagari Aia
                Manggih Barat beserta persyaratan, waktu penyelesaian, biaya, dan sifat
                pelayanannya. <br />Sebagian format dokumen telah disiapkan dalam bentuk template Word dan
                disimpan pada Google Drive Pemerintah Nagari sebagai acuan pelayanan.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {dokumenList.map((dokumen, index) => (
                  <div
                    key={index}
                    className={`group bg-white border border-gray-200/50 rounded-xl p-6 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 ${
                      index % 2 === 0 ? "scroll-slide-left" : "scroll-slide-right"
                    }`}
                  >
                    <div className="flex items-start mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#e6ddcf] to-[#f0e8db] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:from-[#d1c2a0] group-hover:to-[#e6ddcf] transition-colors">
                        <span className="text-[#2c1b01] font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg pt-1.5">
                        {dokumen.nama}
                      </h3>
                    </div>
                    <div className="ml-14 space-y-3">
                      <div>
                        <p className="font-semibold text-gray-900 mb-2 text-sm">Persyaratan:</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {dokumen.persyaratan.map((item, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-[#2c1b01] mr-2 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-900 text-xs mb-1">Waktu</p>
                          <p className="text-sm text-gray-600">{dokumen.waktu}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs mb-1">Biaya</p>
                          <p className="text-sm text-gray-600">{dokumen.biaya}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="font-semibold text-gray-900 text-xs mb-1">Sifat</p>
                        <p className="text-sm text-gray-600">{dokumen.sifat}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pelayanan Administrasi Online */}
            <section
              id="pelayanan-administrasi-online"
              className="scroll-slide-left bg-gradient-to-br from-[#f7f1e6] via-white to-white border border-[#e0d3be] rounded-2xl p-8 md:p-10 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                    Pelayanan Administrasi Secara Online
                  </h2>
                  <p className="text-sm uppercase tracking-[0.25em] text-[#5a3b0d] mb-4">
                    Formulir Pelayanan Administrasi Nagari
                  </p>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Untuk mempermudah masyarakat dalam mengajukan layanan administrasi
                    tanpa harus selalu datang ke kantor nagari, Pemerintah Nagari Aia
                    Manggih Barat menyediakan formulir pelayanan administrasi secara
                    online. Permohonan yang masuk akan diverifikasi oleh petugas dan
                    diproses sesuai standar pelayanan yang berlaku.
                  </p>
                </div>
                <div className="flex md:flex-col gap-3 md:items-end">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSeySCRg8dkswLi9DZKlDOJL5w8iu8kYYxtMCfWVaEIZ4Quivw/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white text-sm font-semibold shadow-md shadow-[rgba(44,27,1,0.25)] hover:shadow-lg hover:shadow-[rgba(44,27,1,0.35)] hover:from-[#3a2604] hover:to-[#100b00] transition-all duration-200"
                  >
                    Buka Formulir Pelayanan Administrasi
                  </a>
                </div>
              </div>
            </section>

            {/* Informasi Pengaduan */}
            <section id="pengaduan" className="scroll-slide-bottom">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
                Informasi Pengaduan
              </h2>
              <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                Masyarakat dapat menyampaikan pengaduan melalui beberapa saluran
                berikut:
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                {/* WhatsApp */}
                <div className="group bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300 scroll-slide-left">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 mr-4 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      WhatsApp
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Kirim pengaduan melalui WhatsApp ke nomor berikut:
                  </p>
                  <a
                    href="https://wa.me/6282315863113"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-semibold shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Hubungi via WhatsApp
                  </a>
                </div>

                {/* Google Form */}
                <div className="group bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-8 border border-[#d1c2a0] hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-right">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Formulir Pengaduan Online
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Isi formulir pengaduan melalui Google Form:
                  </p>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfgd5c-xQ4WCc0k1dtOcaESdmc0g_UkRfKUdEefnPS63bkt0A/viewform?usp=publish-editor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white rounded-full hover:from-[#3a2604] hover:to-[#100b00] transition-all duration-200 text-sm font-semibold shadow-lg shadow-[rgba(44,27,1,0.25)] hover:shadow-xl hover:shadow-[rgba(44,27,1,0.35)]"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Buka Formulir Pengaduan
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
