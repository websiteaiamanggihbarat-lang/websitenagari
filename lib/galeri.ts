import { supabase } from "@/lib/supabase"

export const GALERI_FOTO_TABLE = "galeri_foto"

export const GALERI_FOTO_BUCKET = "foto-galeri-nagari"

export const GALERI_FOTO_STORAGE_ROOT = "galeri"

export const GALERI_FOTO_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const GALERI_FOTO_PERFORMANCE_WARNING_BYTES = 2 * 1024 * 1024

export const GALERI_FOTO_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type GaleriFotoMimeType =
  (typeof GALERI_FOTO_ALLOWED_MIME_TYPES)[number]

export type GaleriFoto = {
  id: string
  foto_url: string
  foto_storage_path: string
  teks_alt: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GaleriFotoPublik = Pick<
  GaleriFoto,
  "id" | "foto_url" | "teks_alt" | "created_at"
>

function isObjectRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isNonEmptyTrimmedString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length > 0
  )
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || /\s/.test(value)) {
    return false
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:"
  } catch {
    return false
  }
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    return false
  }
  return !isNaN(Date.parse(value))
}

function isValidAltText(value: unknown): value is string {
  if (!isNonEmptyTrimmedString(value)) {
    return false
  }
  return value.length <= 300
}

function isValidStoragePath(value: unknown, recordId: string): value is string {
  if (!isNonEmptyTrimmedString(value)) {
    return false
  }
  const expectedPrefix = `${GALERI_FOTO_STORAGE_ROOT}/${recordId}/foto/`
  if (!value.startsWith(expectedPrefix)) {
    return false
  }
  const fileName = value.slice(expectedPrefix.length)
  if (
    !fileName ||
    fileName.includes("/") ||
    fileName.includes("..") ||
    fileName === "." ||
    fileName === ".."
  ) {
    return false
  }
  return /^[A-Za-z0-9._-]+$/.test(fileName)
}

function parseGaleriFotoPublik(row: unknown): GaleriFotoPublik {
  if (!isObjectRecord(row)) {
    throw new Error("Format data galeri publik dari database tidak valid.")
  }

  const r = row

  if (!isUuid(r.id)) {
    throw new Error("Kolom id galeri foto wajib berupa UUID string yang valid.")
  }
  if (!isHttpsUrl(r.foto_url)) {
    throw new Error(`Kolom foto_url galeri foto invalid (ID: ${r.id}).`)
  }
  if (!isValidAltText(r.teks_alt)) {
    throw new Error(`Kolom teks_alt galeri foto invalid (ID: ${r.id}).`)
  }
  if (!isValidTimestamp(r.created_at)) {
    throw new Error(`Kolom created_at galeri foto invalid (ID: ${r.id}).`)
  }

  return {
    id: r.id,
    foto_url: r.foto_url,
    teks_alt: r.teks_alt,
    created_at: r.created_at,
  }
}

function parseGaleriFoto(row: unknown): GaleriFoto {
  if (!isObjectRecord(row)) {
    throw new Error("Format data galeri admin dari database tidak valid.")
  }

  const r = row

  if (!isUuid(r.id)) {
    throw new Error("Kolom id galeri foto wajib berupa UUID string yang valid.")
  }
  if (!isHttpsUrl(r.foto_url)) {
    throw new Error(`Kolom foto_url galeri foto invalid (ID: ${r.id}).`)
  }
  if (!isValidStoragePath(r.foto_storage_path, r.id)) {
    throw new Error(`Kolom foto_storage_path galeri foto invalid (ID: ${r.id}).`)
  }
  if (!isValidAltText(r.teks_alt)) {
    throw new Error(`Kolom teks_alt galeri foto invalid (ID: ${r.id}).`)
  }
  if (typeof r.is_active !== "boolean") {
    throw new Error(`Kolom is_active galeri foto wajib berupa boolean (ID: ${r.id}).`)
  }
  if (!isValidTimestamp(r.created_at)) {
    throw new Error(`Kolom created_at galeri foto invalid (ID: ${r.id}).`)
  }
  if (!isValidTimestamp(r.updated_at)) {
    throw new Error(`Kolom updated_at galeri foto invalid (ID: ${r.id}).`)
  }

  return {
    id: r.id,
    foto_url: r.foto_url,
    foto_storage_path: r.foto_storage_path,
    teks_alt: r.teks_alt,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

/**
 * Membaca daftar foto galeri aktif untuk halaman publik.
 * Diurutkan secara otomatis berdasarkan foto terbaru (created_at DESC, id DESC).
 */
export async function fetchGaleriFotoAktif(): Promise<GaleriFotoPublik[]> {
  try {
    const { data, error } = await supabase
      .from(GALERI_FOTO_TABLE)
      .select("id, foto_url, teks_alt, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    if (error) {
      throw new Error("Gagal memuat foto galeri aktif.")
    }

    if (!data) {
      return []
    }

    const rawData: unknown = data
    if (!Array.isArray(rawData)) {
      throw new Error("Format data galeri tidak valid.")
    }

    return rawData.map(parseGaleriFotoPublik)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Gagal memuat foto galeri aktif.")
  }
}

/**
 * Membaca seluruh data foto galeri (aktif dan nonaktif) untuk dashboard admin.
 * Memerlukan konteks tersambung session authenticated dan route admin yang terproteksi.
 * Diurutkan secara otomatis berdasarkan foto terbaru (created_at DESC, id DESC).
 */
export async function fetchSemuaGaleriFotoAdmin(): Promise<GaleriFoto[]> {
  try {
    const { data, error } = await supabase
      .from(GALERI_FOTO_TABLE)
      .select(
        "id, foto_url, foto_storage_path, teks_alt, is_active, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    if (error) {
      throw new Error("Gagal memuat seluruh data galeri.")
    }

    if (!data) {
      return []
    }

    const rawData: unknown = data
    if (!Array.isArray(rawData)) {
      throw new Error("Format data galeri tidak valid.")
    }

    return rawData.map(parseGaleriFoto)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Gagal memuat seluruh data galeri.")
  }
}
