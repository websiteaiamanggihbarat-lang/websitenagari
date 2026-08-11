"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type BeritaType = {
  id: string | number
  judul: string
  konten: string
  created_at?: string | null
  foto_url?: string | null
}

export default function BeritaDetail() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [berita, setBerita] = useState<BeritaType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchDetail = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("berita")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Gagal mengambil detail berita:", error)
        setError(error.message || "Gagal memuat detail berita")
        setBerita(null)
      } else {
        setBerita(data as BeritaType)
      }

      setLoading(false)
    }

    fetchDetail()
  }, [id])

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="py-24 text-center" aria-live="polite" role="status">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#2C1B01] border-r-transparent"></div>
              <p className="mt-4 text-base font-semibold text-gray-700">
                Memuat detail berita...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="public-card p-8 text-center bg-red-50/50 border-red-200 shadow-sm my-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
                <svg
                  className="h-6 w-6"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-[#1F2937]">
                Gagal Memuat Detail Berita
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {error} (ID: {String(id)})
              </p>
            </div>
          )}

          {/* News Detail Content */}
          {berita && !loading && (
            <article className="public-card p-6 sm:p-10 bg-white scroll-slide-left">
              {/* Header Artikel */}
              <div className="mb-8 pb-6 border-b border-[#E6DDCF]">
                <span className="inline-block rounded-full bg-[#B6A587]/20 border border-[#B6A587]/30 px-3.5 py-1 text-xs font-extrabold text-[#2C1B01] mb-4 uppercase tracking-wider">
                  Berita Nagari
                </span>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1F2937] tracking-tight leading-snug mb-4">
                  {berita.judul}
                </h1>

                {berita.created_at && (
                  <div className="flex items-center text-xs sm:text-sm text-[#5A3B0D] font-semibold gap-2">
                    <svg
                      className="w-4 h-4 text-[#B6A587] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(berita.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Image */}
              {berita.foto_url ? (
                <div className="aspect-[16/9] mb-10 rounded-2xl overflow-hidden bg-[#F0E8DB]/60 border border-[#E6DDCF] shadow-md">
                  <img
                    src={berita.foto_url}
                    alt={berita.judul}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2C1B01] via-[#3D2605] to-[#1A1200] flex items-center justify-center border border-[#B6A587]/30 shadow-md">
                  <svg
                    className="w-16 h-16 text-[#B6A587]/40"
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

              {/* Isi Berita */}
              <div className="text-gray-700 leading-relaxed text-base sm:text-lg space-y-6 text-justify whitespace-pre-line">
                {berita.konten}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
