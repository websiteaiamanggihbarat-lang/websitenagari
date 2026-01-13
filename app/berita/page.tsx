export default function Berita() {
  // Placeholder untuk berita
  const beritaList = [
    {
      id: 1,
      title: "Judul Berita Pertama",
      date: "15 Januari 2024",
      excerpt: "Ringkasan berita pertama akan ditampilkan di sini...",
      category: "Umum",
    },
    {
      id: 2,
      title: "Judul Berita Kedua",
      date: "10 Januari 2024",
      excerpt: "Ringkasan berita kedua akan ditampilkan di sini...",
      category: "Pemerintahan",
    },
    {
      id: 3,
      title: "Judul Berita Ketiga",
      date: "5 Januari 2024",
      excerpt: "Ringkasan berita ketiga akan ditampilkan di sini...",
      category: "Kegiatan",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Berita Nagari
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Informasi dan berita terkini dari Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Filter Categories */}
          <div className="flex flex-wrap gap-3 mb-16 justify-center">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-medium">
              Semua
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              Umum
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              Pemerintahan
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              Kegiatan
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              Pengumuman
            </button>
          </div>

          {/* Berita List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {beritaList.map((berita) => (
              <article
                key={berita.id}
                className="group cursor-pointer"
              >
                {/* Image Placeholder */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-6 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <svg
                      className="w-12 h-12 text-white opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    {berita.category}
                  </span>
                  <span className="text-xs text-gray-500">{berita.date}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors tracking-tight">
                  {berita.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {berita.excerpt}
                </p>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center group/link"
                >
                  Baca Selengkapnya
                  <svg
                    className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </article>
            ))}
          </div>

          {/* Empty State Message */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              Berita akan ditampilkan di sini setelah konten tersedia.
            </p>
          </div>

          {/* Pagination */}
          <div className="mt-16 flex justify-center">
            <nav className="flex space-x-2">
              <button className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                Sebelumnya
              </button>
              <button className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                1
              </button>
              <button className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
                2
              </button>
              <button className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
                3
              </button>
              <button className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
                Selanjutnya
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
