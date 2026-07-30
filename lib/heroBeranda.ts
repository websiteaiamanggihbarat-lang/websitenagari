import { supabase } from "@/lib/supabase"

export type PosisiGambarHero =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"

export type HeroBeranda = {
  id: string
  nama_internal: string
  gambar_url: string
  gambar_storage_path: string
  teks_alt: string
  posisi_gambar: PosisiGambarHero
  is_active: boolean
  urutan: number
  created_at: string
  updated_at: string
}

export const BUCKET_GAMBAR_HERO_BERANDA = "gambar-hero-beranda"

export const MAKS_UKURAN_GAMBAR_HERO = 10 * 1024 * 1024 // 10 MB (10485760 bytes)

export const MIME_GAMBAR_HERO = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type MimeGambarHero = (typeof MIME_GAMBAR_HERO)[number]

export const PILIHAN_POSISI_GAMBAR_HERO = [
  {
    value: "center",
    label: "Tengah",
  },
  {
    value: "top",
    label: "Atas",
  },
  {
    value: "bottom",
    label: "Bawah",
  },
  {
    value: "left",
    label: "Kiri",
  },
  {
    value: "right",
    label: "Kanan",
  },
] as const satisfies ReadonlyArray<{
  value: PosisiGambarHero
  label: string
}>

export function isPosisiGambarHero(value: unknown): value is PosisiGambarHero {
  return (
    value === "center" ||
    value === "top" ||
    value === "bottom" ||
    value === "left" ||
    value === "right"
  )
}

export function getLabelPosisiGambarHero(
  posisi: PosisiGambarHero
): string {
  const opsi = PILIHAN_POSISI_GAMBAR_HERO.find((item) => item.value === posisi)
  return opsi ? opsi.label : posisi
}

export function getObjectPositionHero(
  posisi: PosisiGambarHero
): string {
  switch (posisi) {
    case "top":
      return "center top"
    case "bottom":
      return "center bottom"
    case "left":
      return "left center"
    case "right":
      return "right center"
    case "center":
    default:
      return "center center"
  }
}

const KOLOM_HERO_BERANDA = `
  id,
  nama_internal,
  gambar_url,
  gambar_storage_path,
  teks_alt,
  posisi_gambar,
  is_active,
  urutan,
  created_at,
  updated_at
`

function parseHeroBerandaRow(row: unknown): HeroBeranda {
  if (typeof row !== "object" || row === null) {
    throw new Error("Format data hero beranda dari database tidak valid.")
  }

  const r = row as Record<string, unknown>

  if (typeof r.id !== "string" || !r.id) {
    throw new Error("Kolom id hero beranda wajib berupa string.")
  }
  if (typeof r.nama_internal !== "string") {
    throw new Error(`Kolom nama_internal hero beranda invalid (ID: ${r.id}).`)
  }
  if (typeof r.gambar_url !== "string") {
    throw new Error(`Kolom gambar_url hero beranda invalid (ID: ${r.id}).`)
  }
  if (typeof r.gambar_storage_path !== "string") {
    throw new Error(`Kolom gambar_storage_path hero beranda invalid (ID: ${r.id}).`)
  }
  if (typeof r.teks_alt !== "string") {
    throw new Error(`Kolom teks_alt hero beranda invalid (ID: ${r.id}).`)
  }
  if (!isPosisiGambarHero(r.posisi_gambar)) {
    throw new Error(
      `Nilai posisi_gambar '${String(r.posisi_gambar)}' tidak dikenal pada data hero beranda (ID: ${r.id}).`
    )
  }
  if (typeof r.is_active !== "boolean") {
    throw new Error(`Kolom is_active hero beranda wajib berupa boolean (ID: ${r.id}).`)
  }
  if (typeof r.urutan !== "number" || isNaN(r.urutan) || r.urutan < 0) {
    throw new Error(`Kolom urutan hero beranda invalid (ID: ${r.id}).`)
  }
  if (typeof r.created_at !== "string") {
    throw new Error(`Kolom created_at hero beranda invalid (ID: ${r.id}).`)
  }
  if (typeof r.updated_at !== "string") {
    throw new Error(`Kolom updated_at hero beranda invalid (ID: ${r.id}).`)
  }

  return {
    id: r.id,
    nama_internal: r.nama_internal,
    gambar_url: r.gambar_url,
    gambar_storage_path: r.gambar_storage_path,
    teks_alt: r.teks_alt,
    posisi_gambar: r.posisi_gambar,
    is_active: r.is_active,
    urutan: r.urutan,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

/**
 * Membaca seluruh data gambar hero beranda aktif untuk slider beranda publik.
 */
export async function fetchHeroBerandaAktif(): Promise<HeroBeranda[]> {
  try {
    const { data, error } = await supabase
      .from("hero_beranda")
      .select(KOLOM_HERO_BERANDA)
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    if (error) {
      throw new Error(`Gagal memuat gambar hero beranda aktif: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map(parseHeroBerandaRow)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Gagal memuat gambar hero beranda aktif: ${String(error)}`)
  }
}

/**
 * Membaca seluruh data gambar hero beranda (aktif dan nonaktif) untuk dashboard admin.
 */
export async function fetchSemuaHeroBerandaAdmin(): Promise<HeroBeranda[]> {
  try {
    const { data, error } = await supabase
      .from("hero_beranda")
      .select(KOLOM_HERO_BERANDA)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    if (error) {
      throw new Error(`Gagal memuat seluruh data hero beranda: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map(parseHeroBerandaRow)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Gagal memuat seluruh data hero beranda: ${String(error)}`)
  }
}
