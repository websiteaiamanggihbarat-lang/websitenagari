"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type BeritaType = {
  id: string | number;
  judul: string;
  konten: string;
  created_at?: string | null;
  foto_url?: string | null;
};

export default function BeritaDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [berita, setBerita] = useState<BeritaType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("berita")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Gagal mengambil detail berita:", error);
        setError(error.message || "Gagal memuat detail berita");
        setBerita(null);
      } else {
        setBerita(data as BeritaType);
      }

      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/berita"
              className="inline-flex items-center text-sm text-gray-600 hover:text-[#2c1b01] mb-4"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Kembali ke Berita
            </Link>

            {loading && (
              <p className="text-gray-500 text-sm">Memuat detail berita...</p>
            )}

            {error && !loading && (
              <p className="text-red-600 text-sm mb-3">
                {error} (id: {String(id)})
              </p>
            )}

            {berita && !loading && (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                  {berita.judul}
                </h1>

                {berita.created_at && (
                  <p className="text-sm text-gray-500">
                    {new Date(berita.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {berita.foto_url ? (
                  <div className="aspect-video mb-8 rounded-2xl overflow-hidden bg-gray-100 mt-6">
                    <img
                      src={berita.foto_url}
                      alt={berita.judul}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4a3210] via-[#2c1b01] to-[#1a1200] flex items-center justify-center mt-6">
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

                <article className="prose max-w-none prose-p:text-gray-700 prose-headings:text-gray-900 mt-6">
                  <p style={{ whiteSpace: "pre-line" }}>{berita.konten}</p>
                </article>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

