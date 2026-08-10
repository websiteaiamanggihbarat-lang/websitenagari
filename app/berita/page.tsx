import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { unstable_noStore as noStore } from "next/cache"

// Force dynamic rendering untuk memastikan data selalu fresh - tidak ada cache sama sekali
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

type BeritaType = {
  id: string | number
  judul: string
  konten: string
  created_at?: string | null
  foto_url?: string | null
}

const PER_PAGE = 6

async function getBerita(page: number) {
  // Pastikan tidak ada cache
  noStore()

  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  // Query selalu fetch data terbaru dari Supabase
  const { data, error, count } = await supabase
    .from("berita")
    .select("*", { count: "exact" })
    .order("id", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("Gagal mengambil berita:", error)
    return { data: [] as BeritaType[], count: 0 }
  }

  return { data: (data || []) as BeritaType[], count: count || 0 }
}

export default async function Berita({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams

  const pageValue = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page

  const page = Math.max(Number(pageValue) || 1, 1)

  const { data: beritaList, count } = await getBerita(page)
  const totalPages = Math.max(Math.ceil(count / PER_PAGE), 1)

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Berita Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Informasi dan berita terkini dari Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Tampilan Kosong jika belum ada berita */}
          {beritaList.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/70 p-12 text-center max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 bg-[#f0e8db] text-[#2c1b01] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Belum Ada Berita
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Saat ini belum ada artikel berita yang dipublikasikan. Silakan kembali lagi nanti.
              </p>
            </div>
          ) : (
            /* Grid Card Berita */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {beritaList.map((berita, index) => {
                const formattedDate = berita.created_at
                  ? new Date(berita.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : ""

                const excerpt =
                  berita.konten.length > 140
                    ? berita.konten.slice(0, 140) + "…"
                    : berita.konten

                return (
                  <Link
                    key={berita.id}
                    href={`/berita/${berita.id}`}
                    aria-label={`Baca berita: ${berita.judul}`}
                    className={`group block bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-[#c0ae86] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4b1d] cursor-pointer flex flex-col h-full ${
                      index % 3 === 0
                        ? "scroll-slide-left"
                        : index % 3 === 1
                        ? "scroll-slide-bottom"
                        : "scroll-slide-right"
                    }`}
                  >
                    {/* Foto Berita */}
                    <div className="aspect-[16/9] relative overflow-hidden bg-gray-100 flex-shrink-0">
                      {berita.foto_url ? (
                        <img
                          src={berita.foto_url}
                          alt={berita.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <svg
                            className="w-14 h-14 text-white/40"
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
                      )}
                    </div>

                    {/* Body Card Berita */}
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {formattedDate && (
                          <span className="text-xs text-gray-500 font-medium block mb-2">
                            {formattedDate}
                          </span>
                        )}

                        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#6b4b1d] transition-colors tracking-tight leading-tight line-clamp-2">
                          {berita.judul}
                        </h2>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed text-justify">
                          {excerpt}
                        </p>
                      </div>

                      {/* Action Element Visual (Non-Link) */}
                      <span className="text-[#6b4b1d] group-hover:text-[#2c1b01] font-semibold text-sm inline-flex items-center mt-auto pt-2 transition-colors">
                        <span>Baca Selengkapnya</span>
                        <svg
                          className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center scroll-fade">
              <nav className="flex items-center space-x-2">
                <Link
                  href={`/berita?page=${page - 1}`}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    page <= 1
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-[#f7f2e8] hover:border-[#b6a587] shadow-xs"
                  }`}
                >
                  &larr; Sebelumnya
                </Link>

                <span className="px-5 py-2.5 bg-[#2c1b01] text-white rounded-xl text-sm font-semibold shadow-xs">
                  {page} / {totalPages}
                </span>

                <Link
                  href={`/berita?page=${page + 1}`}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    page >= totalPages
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-[#f7f2e8] hover:border-[#b6a587] shadow-xs"
                  }`}
                >
                  Selanjutnya &rarr;
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
