import { supabase } from "@/lib/supabase"

export type JenisPeta = "administrasi" | "kebencanaan" | "lainnya"

export type PetaNagari = {
  id: string
  judul_peta: string
  jenis_peta: JenisPeta
  deskripsi: string | null
  tahun_peta: number
  sumber_peta: string
  gambar_url: string
  gambar_storage_path: string
  file_url: string | null
  file_storage_path: string | null
  teks_alt: string
  is_active: boolean
  urutan: number
  created_at: string
  updated_at: string
}

export type PilihanJenisPeta = {
  value: JenisPeta
  label: string
}

export const BUCKET_GAMBAR_PETA_NAGARI = "gambar-peta-nagari"
export const BUCKET_DOKUMEN_PETA_NAGARI = "dokumen-peta-nagari"

export const PILIHAN_JENIS_PETA = [
  {
    value: "administrasi",
    label: "Peta Administrasi / Nagari",
  },
  {
    value: "kebencanaan",
    label: "Peta Kebencanaan",
  },
  {
    value: "lainnya",
    label: "Peta Tematik Lainnya",
  },
] as const satisfies ReadonlyArray<{
  value: JenisPeta
  label: string
}>

export const MAKS_UKURAN_GAMBAR_PETA = 15 * 1024 * 1024 // 15728640 bytes (15 MB)
export const MAKS_UKURAN_DOKUMEN_PETA = 30 * 1024 * 1024 // 31457280 bytes (30 MB)

export const MIME_GAMBAR_PETA = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const MIME_DOKUMEN_PETA = [
  "application/pdf",
] as const

export function isJenisPeta(value: string): value is JenisPeta {
  return (
    value === "administrasi" ||
    value === "kebencanaan" ||
    value === "lainnya"
  )
}

export function getLabelJenisPeta(jenis: JenisPeta): string {
  const opsi = PILIHAN_JENIS_PETA.find((item) => item.value === jenis)
  return opsi ? opsi.label : jenis
}

const KOLOM_PETA_NAGARI = `
  id,
  judul_peta,
  jenis_peta,
  deskripsi,
  tahun_peta,
  sumber_peta,
  gambar_url,
  gambar_storage_path,
  file_url,
  file_storage_path,
  teks_alt,
  is_active,
  urutan,
  created_at,
  updated_at
`

type PetaNagariRow = Omit<PetaNagari, "jenis_peta"> & {
  jenis_peta: string
}

function normalisasiPetaNagari(row: PetaNagariRow): PetaNagari {
  if (!isJenisPeta(row.jenis_peta)) {
    throw new Error(
      `Nilai jenis_peta '${row.jenis_peta}' tidak dikenal pada data peta (ID: ${row.id})`
    )
  }

  return {
    ...row,
    jenis_peta: row.jenis_peta,
  }
}

/**
 * Membaca seluruh data peta nagari aktif untuk tampilan slider publik.
 */
export async function fetchPetaNagariAktif(): Promise<PetaNagari[]> {
  try {
    const { data, error } = await supabase
      .from("peta_nagari")
      .select(KOLOM_PETA_NAGARI)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    if (error) {
      throw new Error(`Gagal mengambil peta nagari aktif: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    return (data as unknown as PetaNagariRow[]).map(normalisasiPetaNagari)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Gagal mengambil peta nagari aktif: ${String(error)}`)
  }
}

/**
 * Membaca seluruh data peta nagari (aktif dan nonaktif) untuk dashboard admin.
 */
export async function fetchSemuaPetaNagariAdmin(): Promise<PetaNagari[]> {
  try {
    const { data, error } = await supabase
      .from("peta_nagari")
      .select(KOLOM_PETA_NAGARI)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    if (error) {
      throw new Error(`Gagal mengambil seluruh data peta nagari: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    return (data as unknown as PetaNagariRow[]).map(normalisasiPetaNagari)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Gagal mengambil seluruh data peta nagari: ${String(error)}`)
  }
}
