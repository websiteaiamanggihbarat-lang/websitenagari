import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://aiamanggihbarat.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/profil`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/layanan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kontak`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/berita`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/struktur-organisasi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/lembaga-organisasi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/layanan-informasi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/galeri`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  let beritaRoutes: MetadataRoute.Sitemap = [];

  try {
    const { data: beritaList } = await supabase
      .from("berita")
      .select("id, created_at")
      .order("id", { ascending: false });

    if (beritaList && beritaList.length > 0) {
      beritaRoutes = beritaList.map((item) => ({
        url: `${BASE_URL}/berita/${item.id}`,
        lastModified: item.created_at ? new Date(item.created_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Jika Supabase gagal (env tidak ada atau jaringan), sitemap tetap berisi rute statis
  }

  return [...staticRoutes, ...beritaRoutes];
}
