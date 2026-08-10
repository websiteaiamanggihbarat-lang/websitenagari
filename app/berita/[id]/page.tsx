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
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="py-24 text-center" aria-live="polite" role="status">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#2c1b01] border-r-transparent"></div>
              <p className="mt-4 text-base font-semibold text-gray-700">
                Memuat detail berita...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm my-8">
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
              <h3 className="text-lg font-bold text-gray-900">
                Gagal Memuat Detail Berita
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {error} (ID: {String(id)})
              </p>
            </div>
          )}

          {/* News Detail Content */}
          {berita && !loading && (
            <article className="scroll-slide-left">
              {/* Header Artikel */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <span className="inline-block rounded-lg bg-[#f0e8db] px-3.5 py-1.5 text-xs font-bold text-[#2c1b01] mb-4">
                  Berita Nagari
                </span>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                  {berita.judul}
                </h1>

                {berita.created_at && (
                  <div className="flex items-center text-sm text-gray-500 font-medium gap-2">
                    <svg
                      className="w-4 h-4 text-[#6b4b1d] flex-shrink-0"
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
                <div className="aspect-[16/9] mb-10 rounded-2xl overflow-hidden bg-gray-100 shadow-md">
                  <img
                    src={berita.foto_url}
                    alt={berita.judul}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] flex items-center justify-center shadow-md">
                  <svg
                    className="w-20 h-20 text-white/40"
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
              <div className="text-gray-700 leading-relaxed text-base md:text-lg space-y-6 text-justify whitespace-pre-line">
                {berita.konten}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
