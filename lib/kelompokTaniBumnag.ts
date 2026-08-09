import { supabase } from "@/lib/supabase"

export const BUCKET_KELOMPOK_TANI_BUMNAG = "foto-kelompok-tani-bumnag"

export type JenisEntitasKelompokTaniBumnag = "kelompok_tani" | "bumnag"

export type JenisItemProdukUsaha =
  | "produk_hasil"
  | "unit_usaha"
  | "jasa"
  | "lainnya"

export interface JenisEntitasOption {
  readonly value: JenisEntitasKelompokTaniBumnag
  readonly label: string
}

export interface JenisItemOption {
  readonly value: JenisItemProdukUsaha
  readonly label: string
}

export const PILIHAN_JENIS_ENTITAS = [
  { value: "kelompok_tani", label: "Kelompok Tani" },
  { value: "bumnag", label: "BUMNag" },
] as const

export const PILIHAN_JENIS_PRODUK_USAHA = [
  { value: "produk_hasil", label: "Produk / Hasil Panen" },
  { value: "unit_usaha", label: "Unit Usaha" },
  { value: "jasa", label: "Jasa / Layanan" },
  { value: "lainnya", label: "Lainnya" },
] as const

export function getLabelJenisEntitas(jenis: string): string {
  const opsi = PILIHAN_JENIS_ENTITAS.find((item) => item.value === jenis)
  return opsi ? opsi.label : jenis
}

export function getLabelPimpinan(jenis: string): string {
  if (jenis === "kelompok_tani") return "Ketua"
  if (jenis === "bumnag") return "Direktur / Pengelola"
  return "Pimpinan"
}

export function getLabelBidang(jenis: string): string {
  if (jenis === "kelompok_tani") return "Bidang Kegiatan"
  if (jenis === "bumnag") return "Bidang Usaha"
  return "Bidang Utama"
}

export function getLabelJenisItem(jenisItem: string): string {
  const opsi = PILIHAN_JENIS_PRODUK_USAHA.find((item) => item.value === jenisItem)
  return opsi ? opsi.label : jenisItem
}

export interface KelompokTaniBumnag {
  id: string
  nama_entitas: string
  jenis_entitas: JenisEntitasKelompokTaniBumnag
  bidang_utama: string
  deskripsi: string
  nama_pimpinan: string | null
  tahun_berdiri: number | null
  jumlah_anggota: number | null
  alamat: string | null
  wilayah_kegiatan: string | null
  nomor_kontak: string | null
  tautan_peta: string | null
  is_active: boolean
  urutan: number
  created_at: string | null
  updated_at: string | null
}

export interface GaleriKelompokTaniBumnag {
  id: string
  kelompok_tani_bumnag_id: string
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

export interface ProdukUsahaKelompokTaniBumnag {
  id: string
  kelompok_tani_bumnag_id: string
  nama_produk_usaha: string
  jenis_item: JenisItemProdukUsaha
  deskripsi: string | null
  urutan: number
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface KelompokTaniBumnagDenganCover extends KelompokTaniBumnag {
  cover: GaleriKelompokTaniBumnag | null
}

export interface DetailKelompokTaniBumnagAktif extends KelompokTaniBumnag {
  cover: GaleriKelompokTaniBumnag | null
  galeri: GaleriKelompokTaniBumnag[]
  produk_usaha: ProdukUsahaKelompokTaniBumnag[]
}

/**
 * 1. getKelompokTaniBumnagBeranda(limit)
 * Reads active entities (is_active = true) for Beranda display.
 * Ordered by urutan ASC, created_at DESC.
 * Attaches active cover photo if available.
 * Does NOT display drafts (is_active = false).
 */
export async function getKelompokTaniBumnagBeranda(
  limit = 6
): Promise<KelompokTaniBumnagDenganCover[]> {
  try {
    const { data: listEntitas, error: errEntitas } = await supabase
      .from("kelompok_tani_bumnag")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit)

    if (errEntitas || !listEntitas || listEntitas.length === 0) {
      if (errEntitas) {
        console.error("getKelompokTaniBumnagBeranda errEntitas:", errEntitas)
      }
      return []
    }

    const entitasIds = listEntitas.map((item) => item.id)

    const { data: listCover, error: errCover } = await supabase
      .from("galeri_kelompok_tani_bumnag")
      .select("*")
      .in("kelompok_tani_bumnag_id", entitasIds)
      .eq("is_active", true)
      .eq("is_cover", true)

    if (errCover) {
      console.error("getKelompokTaniBumnagBeranda errCover:", errCover)
    }

    const coverMap = new Map<string, GaleriKelompokTaniBumnag>()
    if (listCover) {
      for (const cover of listCover as GaleriKelompokTaniBumnag[]) {
        if (!coverMap.has(cover.kelompok_tani_bumnag_id)) {
          coverMap.set(cover.kelompok_tani_bumnag_id, cover)
        }
      }
    }

    return (listEntitas as KelompokTaniBumnag[]).map((e) => ({
      ...e,
      cover: coverMap.get(e.id) || null,
    }))
  } catch (error) {
    console.error("getKelompokTaniBumnagBeranda catch error:", error)
    return []
  }
}

/**
 * 2. getDaftarKelompokTaniBumnagAktif(jenisEntitas?)
 * Reads all active entities with optional jenisEntitas filter.
 * Ordered by created_at DESC.
 * Attaches active cover photo if available.
 */
export async function getDaftarKelompokTaniBumnagAktif(
  jenisEntitas?: JenisEntitasKelompokTaniBumnag
): Promise<KelompokTaniBumnagDenganCover[]> {
  try {
    let query = supabase
      .from("kelompok_tani_bumnag")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    if (jenisEntitas) {
      query = query.eq("jenis_entitas", jenisEntitas)
    }

    const { data: listEntitas, error: errEntitas } = await query

    if (errEntitas || !listEntitas || listEntitas.length === 0) {
      if (errEntitas) {
        console.error("getDaftarKelompokTaniBumnagAktif errEntitas:", errEntitas)
      }
      return []
    }

    const entitasIds = listEntitas.map((item) => item.id)

    const { data: listCover, error: errCover } = await supabase
      .from("galeri_kelompok_tani_bumnag")
      .select("*")
      .in("kelompok_tani_bumnag_id", entitasIds)
      .eq("is_active", true)
      .eq("is_cover", true)

    if (errCover) {
      console.error("getDaftarKelompokTaniBumnagAktif errCover:", errCover)
    }

    const coverMap = new Map<string, GaleriKelompokTaniBumnag>()
    if (listCover) {
      for (const cover of listCover as GaleriKelompokTaniBumnag[]) {
        if (!coverMap.has(cover.kelompok_tani_bumnag_id)) {
          coverMap.set(cover.kelompok_tani_bumnag_id, cover)
        }
      }
    }

    return (listEntitas as KelompokTaniBumnag[]).map((e) => ({
      ...e,
      cover: coverMap.get(e.id) || null,
    }))
  } catch (error) {
    console.error("getDaftarKelompokTaniBumnagAktif catch error:", error)
    return []
  }
}

/**
 * 3. getDetailKelompokTaniBumnagAktif(dataId)
 * Reads single active entity with active galeri, active produk_usaha, and cover.
 * Returns null if dataId is empty, not found, or is draft (is_active = false).
 */
export async function getDetailKelompokTaniBumnagAktif(
  dataId: string
): Promise<DetailKelompokTaniBumnagAktif | null> {
  if (!dataId || !dataId.trim()) {
    return null
  }

  try {
    const { data: entitas, error: errEntitas } = await supabase
      .from("kelompok_tani_bumnag")
      .select("*")
      .eq("id", dataId)
      .eq("is_active", true)
      .maybeSingle()

    if (errEntitas || !entitas) {
      if (errEntitas) {
        console.error("getDetailKelompokTaniBumnagAktif errEntitas:", errEntitas)
      }
      return null
    }

    const galeri = await getGaleriKelompokTaniBumnagAktif(dataId)
    const produk_usaha = await getProdukUsahaKelompokTaniBumnagAktif(dataId)
    const cover = galeri.find((g) => g.is_cover) || null

    return {
      ...(entitas as KelompokTaniBumnag),
      cover,
      galeri,
      produk_usaha,
    }
  } catch (error) {
    console.error("getDetailKelompokTaniBumnagAktif catch error:", error)
    return null
  }
}

/**
 * 4. getGaleriKelompokTaniBumnagAktif(dataId)
 * Reads active gallery photos for an active entity.
 * Cover first (is_cover = true), then urutan ASC, created_at ASC.
 */
export async function getGaleriKelompokTaniBumnagAktif(
  dataId: string
): Promise<GaleriKelompokTaniBumnag[]> {
  if (!dataId || !dataId.trim()) {
    return []
  }

  try {
    const { data: listGaleri, error: errGaleri } = await supabase
      .from("galeri_kelompok_tani_bumnag")
      .select("*")
      .eq("kelompok_tani_bumnag_id", dataId)
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true })

    if (errGaleri || !listGaleri) {
      if (errGaleri) {
        console.error("getGaleriKelompokTaniBumnagAktif errGaleri:", errGaleri)
      }
      return []
    }

    const galeri = listGaleri as GaleriKelompokTaniBumnag[]

    return [...galeri].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      if (a.urutan !== b.urutan) return a.urutan - b.urutan
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateA - dateB
    })
  } catch (error) {
    console.error("getGaleriKelompokTaniBumnagAktif catch error:", error)
    return []
  }
}

/**
 * 5. getProdukUsahaKelompokTaniBumnagAktif(dataId)
 * Reads active products/unit items for an active entity.
 * Ordered by urutan ASC, created_at ASC.
 */
export async function getProdukUsahaKelompokTaniBumnagAktif(
  dataId: string
): Promise<ProdukUsahaKelompokTaniBumnag[]> {
  if (!dataId || !dataId.trim()) {
    return []
  }

  try {
    const { data: listProduk, error: errProduk } = await supabase
      .from("produk_usaha_kelompok_tani_bumnag")
      .select("*")
      .eq("kelompok_tani_bumnag_id", dataId)
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true })

    if (errProduk || !listProduk) {
      if (errProduk) {
        console.error("getProdukUsahaKelompokTaniBumnagAktif errProduk:", errProduk)
      }
      return []
    }

    return listProduk as ProdukUsahaKelompokTaniBumnag[]
  } catch (error) {
    console.error("getProdukUsahaKelompokTaniBumnagAktif catch error:", error)
    return []
  }
}
