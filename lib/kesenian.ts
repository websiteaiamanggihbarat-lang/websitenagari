import { supabase } from "@/lib/supabase"

export const BUCKET_FOTO_KESENIAN = "foto-kesenian-tradisional"

export type KategoriKesenian =
  | "tari"
  | "musik"
  | "pertunjukan"
  | "kerajinan"
  | "lainnya"

export interface KategoriKesenianOption {
  readonly value: KategoriKesenian
  readonly label: string
}

export const PILIHAN_KATEGORI_KESENIAN = [
  { value: "tari", label: "Tari" },
  { value: "musik", label: "Musik" },
  { value: "pertunjukan", label: "Pertunjukan" },
  { value: "kerajinan", label: "Kerajinan" },
  { value: "lainnya", label: "Lainnya" },
] as const

export function getLabelKategoriKesenian(kategori: string): string {
  const opsi = PILIHAN_KATEGORI_KESENIAN.find((item) => item.value === kategori)
  return opsi ? opsi.label : kategori
}

export interface KesenianTradisional {
  id: string
  nama_kesenian: string
  kategori: KategoriKesenian
  deskripsi_singkat: string
  penjelasan_lengkap: string | null
  nama_kelompok_pengelola: string | null
  nama_ketua: string | null
  alamat: string | null
  nomor_kontak: string | null
  jadwal_latihan: string | null
  tautan_peta: string | null
  is_active: boolean
  urutan: number
  created_at: string | null
  updated_at: string | null
}

export interface GaleriKesenianTradisional {
  id: string
  kesenian_id: string
  foto_url: string
  storage_path: string
  caption: string | null
  teks_alt: string
  is_cover: boolean
  urutan: number
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface KesenianDenganCover extends KesenianTradisional {
  cover: GaleriKesenianTradisional | null
}

export interface DetailKesenianTradisional extends KesenianTradisional {
  galeri: GaleriKesenianTradisional[]
}

/**
 * Membaca daftar kesenian tradisional aktif yang MEMILIKI foto cover aktif.
 * Digunakan untuk komponen carousel beranda/publik.
 * Kesenian tanpa foto cover aktif TIDAK akan ditampilkan.
 */
export async function fetchKesenianAktifDenganCover(): Promise<KesenianDenganCover[]> {
  try {
    const { data: listKesenian, error: errKesenian } = await supabase
      .from("kesenian_tradisional")
      .select("*")
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("nama_kesenian", { ascending: true })

    if (errKesenian || !listKesenian) {
      if (errKesenian) {
        console.error("fetchKesenianAktifDenganCover errKesenian:", errKesenian)
      }
      return []
    }

    const kesenianIds = listKesenian.map((item) => item.id)
    if (kesenianIds.length === 0) {
      return []
    }

    const { data: listCover, error: errCover } = await supabase
      .from("galeri_kesenian_tradisional")
      .select("*")
      .in("kesenian_id", kesenianIds)
      .eq("is_active", true)
      .eq("is_cover", true)

    if (errCover) {
      console.error("fetchKesenianAktifDenganCover errCover:", errCover)
    }

    const coverMap = new Map<string, GaleriKesenianTradisional>()
    if (listCover) {
      for (const cover of listCover as GaleriKesenianTradisional[]) {
        if (!coverMap.has(cover.kesenian_id)) {
          coverMap.set(cover.kesenian_id, cover)
        }
      }
    }

    const hasil: KesenianDenganCover[] = []
    for (const k of listKesenian as KesenianTradisional[]) {
      const cover = coverMap.get(k.id) || null
      if (cover !== null) {
        hasil.push({
          ...k,
          cover,
        })
      }
    }

    return hasil
  } catch (error) {
    console.error("fetchKesenianAktifDenganCover catch error:", error)
    return []
  }
}

/**
 * Membaca seluruh daftar kesenian tradisional aktif beserta foto cover aktifnya (jika ada).
 * Digunakan untuk halaman daftar publik kesenian.
 */
export async function fetchDaftarKesenianAktif(): Promise<KesenianDenganCover[]> {
  try {
    const { data: listKesenian, error: errKesenian } = await supabase
      .from("kesenian_tradisional")
      .select("*")
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("nama_kesenian", { ascending: true })

    if (errKesenian || !listKesenian) {
      if (errKesenian) {
        console.error("fetchDaftarKesenianAktif errKesenian:", errKesenian)
      }
      return []
    }

    const kesenianIds = listKesenian.map((item) => item.id)
    if (kesenianIds.length === 0) {
      return []
    }

    const { data: listCover, error: errCover } = await supabase
      .from("galeri_kesenian_tradisional")
      .select("*")
      .in("kesenian_id", kesenianIds)
      .eq("is_active", true)
      .eq("is_cover", true)

    if (errCover) {
      console.error("fetchDaftarKesenianAktif errCover:", errCover)
    }

    const coverMap = new Map<string, GaleriKesenianTradisional>()
    if (listCover) {
      for (const cover of listCover as GaleriKesenianTradisional[]) {
        if (!coverMap.has(cover.kesenian_id)) {
          coverMap.set(cover.kesenian_id, cover)
        }
      }
    }

    return (listKesenian as KesenianTradisional[]).map((k) => ({
      ...k,
      cover: coverMap.get(k.id) || null,
    }))
  } catch (error) {
    console.error("fetchDaftarKesenianAktif catch error:", error)
    return []
  }
}

/**
 * Membaca detail satu kesenian tradisional aktif beserta seluruh foto galeri aktifnya.
 * Cover tampil paling awal, diikuti urutan ascending lalu created_at.
 */
export async function fetchDetailKesenianAktif(
  kesenianId: string
): Promise<DetailKesenianTradisional | null> {
  if (!kesenianId || !kesenianId.trim()) {
    return null
  }

  try {
    const { data: kesenian, error: errKesenian } = await supabase
      .from("kesenian_tradisional")
      .select("*")
      .eq("id", kesenianId)
      .eq("is_active", true)
      .maybeSingle()

    if (errKesenian || !kesenian) {
      if (errKesenian) {
        console.error("fetchDetailKesenianAktif errKesenian:", errKesenian)
      }
      return null
    }

    const { data: listGaleri, error: errGaleri } = await supabase
      .from("galeri_kesenian_tradisional")
      .select("*")
      .eq("kesenian_id", kesenianId)
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true })

    if (errGaleri) {
      console.error("fetchDetailKesenianAktif errGaleri:", errGaleri)
    }

    const galeri = (listGaleri as GaleriKesenianTradisional[]) || []

    const galeriUrut = [...galeri].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      if (a.urutan !== b.urutan) return a.urutan - b.urutan
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateA - dateB
    })

    return {
      ...(kesenian as KesenianTradisional),
      galeri: galeriUrut,
    }
  } catch (error) {
    console.error("fetchDetailKesenianAktif catch error:", error)
    return null
  }
}

/**
 * Membaca seluruh foto galeri aktif untuk satu kesenian aktif.
 * Cover berada di posisi paling awal.
 */
export async function fetchGaleriAktifByKesenianId(
  kesenianId: string
): Promise<GaleriKesenianTradisional[]> {
  if (!kesenianId || !kesenianId.trim()) {
    return []
  }

  try {
    const { data: kesenian, error: errKesenian } = await supabase
      .from("kesenian_tradisional")
      .select("id")
      .eq("id", kesenianId)
      .eq("is_active", true)
      .maybeSingle()

    if (errKesenian || !kesenian) {
      if (errKesenian) {
        console.error("fetchGaleriAktifByKesenianId errKesenian:", errKesenian)
      }
      return []
    }

    const { data: listGaleri, error: errGaleri } = await supabase
      .from("galeri_kesenian_tradisional")
      .select("*")
      .eq("kesenian_id", kesenianId)
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true })

    if (errGaleri || !listGaleri) {
      if (errGaleri) {
        console.error("fetchGaleriAktifByKesenianId errGaleri:", errGaleri)
      }
      return []
    }

    const galeri = listGaleri as GaleriKesenianTradisional[]

    return [...galeri].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      if (a.urutan !== b.urutan) return a.urutan - b.urutan
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateA - dateB
    })
  } catch (error) {
    console.error("fetchGaleriAktifByKesenianId catch error:", error)
    return []
  }
}

/**
 * Membaca satu foto cover aktif dari kesenian aktif.
 */
export async function fetchCoverAktifByKesenianId(
  kesenianId: string
): Promise<GaleriKesenianTradisional | null> {
  if (!kesenianId || !kesenianId.trim()) {
    return null
  }

  try {
    const { data: kesenian, error: errKesenian } = await supabase
      .from("kesenian_tradisional")
      .select("id")
      .eq("id", kesenianId)
      .eq("is_active", true)
      .maybeSingle()

    if (errKesenian || !kesenian) {
      if (errKesenian) {
        console.error("fetchCoverAktifByKesenianId errKesenian:", errKesenian)
      }
      return null
    }

    const { data: cover, error: errCover } = await supabase
      .from("galeri_kesenian_tradisional")
      .select("*")
      .eq("kesenian_id", kesenianId)
      .eq("is_cover", true)
      .eq("is_active", true)
      .maybeSingle()

    if (errCover) {
      console.error("fetchCoverAktifByKesenianId errCover:", errCover)
      return null
    }

    return (cover as GaleriKesenianTradisional) || null
  } catch (error) {
    console.error("fetchCoverAktifByKesenianId catch error:", error)
    return null
  }
}
