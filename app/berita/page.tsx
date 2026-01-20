import Link from "next/link";
import { supabase } from "@/lib/supabase";

type BeritaType = {
  id: string | number;
  judul: string;
  konten: string;
  created_at?: string | null;
};

const PER_PAGE = 6;

async function getBerita(page: number) {
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from("berita")
    .select("*", { count: "exact" })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Gagal mengambil berita:", error);
    return { data: [] as BeritaType[], count: 0 };
  }

  return { data: (data || []) as BeritaType[], count: count || 0 };
}

export default async function Berita({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Math.max(Number(searchParams?.page) || 1, 1);
  const { data: beritaList, count } = await getBerita(page);
  const totalPages = Math.max(Math.ceil(count / PER_PAGE), 1);

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 scroll-slide-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Berita Nagari
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 font-normal">
              Informasi dan berita terkini dari Nagari Aia Manggih Barat
            </p>
          </div>

          {/* Berita List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beritaList.map((berita, index) => (
                <article
                  key={berita.id}
                  className={`group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-2xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 ${
                    index % 3 === 0 ? "scroll-slide-left" : index % 3 === 1 ? "scroll-slide-bottom" : "scroll-slide-right"
                  }`}
                >
                {/* Image Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg
                      className="w-16 h-16 text-white/40"
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
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 font-medium">
                      {berita.created_at
                        ? new Date(berita.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#2c1b01] transition-colors tracking-tight leading-tight">
                    {berita.judul}
                  </h2>
                  <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
                    {berita.konten.length > 150
                      ? berita.konten.slice(0, 150) + "…"
                      : berita.konten}
                  </p>
                  <Link
                    href={`/berita/${berita.id}`}
                    className="text-[#2c1b01] hover:text-[#4a3210] font-semibold text-sm inline-flex items-center group/link"
                  >
                    Baca Selengkapnya
                    <svg
                      className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform"
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
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-16 flex justify-center scroll-fade">
            <nav className="flex space-x-2">
              <Link
                href={`/berita?page=${page - 1}`}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                  page <= 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                Sebelumnya
              </Link>

              <span className="px-5 py-2 bg-[#2c1b01] text-white rounded-full text-sm font-medium">
                {page} / {totalPages}
              </span>

              <Link
                href={`/berita?page=${page + 1}`}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                  page >= totalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                Selanjutnya
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
