import { supabase } from "@/lib/supabase"

export const STRUKTUR_ORGANISASI_TABLE = "struktur_organisasi"

export const STRUKTUR_ORGANISASI_BUCKET = "foto-struktur-organisasi"

export const STRUKTUR_ORGANISASI_STORAGE_ROOT = "struktur-organisasi"

export const STRUKTUR_ORGANISASI_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export const STRUKTUR_ORGANISASI_PERFORMANCE_WARNING_BYTES = 2 * 1024 * 1024

export const STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type StrukturOrganisasiMimeType =
  (typeof STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES)[number]

export const STRUKTUR_ORGANISASI_SLOT_KEYS = [
  "wali_nagari",
  "sekretaris_nagari",
  "kasi_pemerintahan",
  "staf_pemerintahan",
  "petugas_data",
  "kasi_kesra_pelayanan",
  "staf_kesra_pelayanan",
  "petugas_keagamaan",
  "kaur_umum",
  "staf_kaur_umum",
  "staf_kebersihan",
  "staf_keamanan",
  "kaur_keuangan",
  "staf_kaur_keuangan",
  "ka_jorong_padang_sarai",
  "ka_jorong_kp_padang_paraman_dareh",
] as const

export type StrukturOrganisasiSlotKey =
  (typeof STRUKTUR_ORGANISASI_SLOT_KEYS)[number]

export const STRUKTUR_ORGANISASI_KELOMPOK_LAYOUT = [
  "pimpinan",
  "sekretariat",
  "kasi_pemerintahan",
  "kasi_kesra",
  "kaur_umum",
  "kaur_keuangan",
  "wilayah_jorong",
] as const

export type StrukturOrganisasiKelompokLayout =
  (typeof STRUKTUR_ORGANISASI_KELOMPOK_LAYOUT)[number]

export type StrukturOrganisasiSlotMetadata = {
  nama_jabatan: string
  parent_slot_key: StrukturOrganisasiSlotKey | null
  kelompok_layout: StrukturOrganisasiKelompokLayout
  urutan: number
}

export const STRUKTUR_ORGANISASI_SLOT_METADATA = {
  wali_nagari: {
    nama_jabatan: "Wali Nagari",
    parent_slot_key: null,
    kelompok_layout: "pimpinan",
    urutan: 1,
  },
  sekretaris_nagari: {
    nama_jabatan: "Sekretaris Nagari",
    parent_slot_key: "wali_nagari",
    kelompok_layout: "sekretariat",
    urutan: 2,
  },
  kasi_pemerintahan: {
    nama_jabatan: "Kasi Pemerintahan",
    parent_slot_key: "wali_nagari",
    kelompok_layout: "kasi_pemerintahan",
    urutan: 3,
  },
  staf_pemerintahan: {
    nama_jabatan: "Staf Pemerintahan",
    parent_slot_key: "kasi_pemerintahan",
    kelompok_layout: "kasi_pemerintahan",
    urutan: 4,
  },
  petugas_data: {
    nama_jabatan: "Petugas Data",
    parent_slot_key: "staf_pemerintahan",
    kelompok_layout: "kasi_pemerintahan",
    urutan: 5,
  },
  kasi_kesra_pelayanan: {
    nama_jabatan: "Kasi Kesra dan Pelayanan",
    parent_slot_key: "wali_nagari",
    kelompok_layout: "kasi_kesra",
    urutan: 6,
  },
  staf_kesra_pelayanan: {
    nama_jabatan: "Staf Kesra dan Pelayanan",
    parent_slot_key: "kasi_kesra_pelayanan",
    kelompok_layout: "kasi_kesra",
    urutan: 7,
  },
  petugas_keagamaan: {
    nama_jabatan: "Petugas Keagamaan",
    parent_slot_key: "staf_kesra_pelayanan",
    kelompok_layout: "kasi_kesra",
    urutan: 8,
  },
  kaur_umum: {
    nama_jabatan: "Kaur Umum",
    parent_slot_key: "sekretaris_nagari",
    kelompok_layout: "kaur_umum",
    urutan: 9,
  },
  staf_kaur_umum: {
    nama_jabatan: "Staf",
    parent_slot_key: "kaur_umum",
    kelompok_layout: "kaur_umum",
    urutan: 10,
  },
  staf_kebersihan: {
    nama_jabatan: "Staf Kebersihan",
    parent_slot_key: "staf_kaur_umum",
    kelompok_layout: "kaur_umum",
    urutan: 11,
  },
  staf_keamanan: {
    nama_jabatan: "Staf Keamanan",
    parent_slot_key: "staf_kaur_umum",
    kelompok_layout: "kaur_umum",
    urutan: 12,
  },
  kaur_keuangan: {
    nama_jabatan: "Kaur Keuangan",
    parent_slot_key: "sekretaris_nagari",
    kelompok_layout: "kaur_keuangan",
    urutan: 13,
  },
  staf_kaur_keuangan: {
    nama_jabatan: "Staf",
    parent_slot_key: "kaur_keuangan",
    kelompok_layout: "kaur_keuangan",
    urutan: 14,
  },
  ka_jorong_padang_sarai: {
    nama_jabatan: "Ka. Jorong Padang Sarai",
    parent_slot_key: "wali_nagari",
    kelompok_layout: "wilayah_jorong",
    urutan: 15,
  },
  ka_jorong_kp_padang_paraman_dareh: {
    nama_jabatan: "Ka. Jorong Kampung Padang Paraman Dareh",
    parent_slot_key: "wali_nagari",
    kelompok_layout: "wilayah_jorong",
    urutan: 16,
  },
} as const satisfies Record<
  StrukturOrganisasiSlotKey,
  StrukturOrganisasiSlotMetadata
>

export type StrukturOrganisasi = {
  slot_key: StrukturOrganisasiSlotKey
  nama_jabatan: string
  nama_pejabat: string | null
  foto_url: string | null
  foto_storage_path: string | null
  parent_slot_key: StrukturOrganisasiSlotKey | null
  kelompok_layout: StrukturOrganisasiKelompokLayout
  urutan: number
  created_at: string
  updated_at: string
}

export type StrukturOrganisasiPublik = Pick<
  StrukturOrganisasi,
  | "slot_key"
  | "nama_jabatan"
  | "nama_pejabat"
  | "foto_url"
  | "parent_slot_key"
  | "kelompok_layout"
  | "urutan"
>

function isObjectRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStrukturOrganisasiSlotKey(
  value: unknown
): value is StrukturOrganisasiSlotKey {
  return (
    typeof value === "string" &&
    STRUKTUR_ORGANISASI_SLOT_KEYS.includes(value as StrukturOrganisasiSlotKey)
  )
}

function isStrukturOrganisasiKelompokLayout(
  value: unknown
): value is StrukturOrganisasiKelompokLayout {
  return (
    typeof value === "string" &&
    STRUKTUR_ORGANISASI_KELOMPOK_LAYOUT.includes(
      value as StrukturOrganisasiKelompokLayout
    )
  )
}

function isValidNamaJabatan(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length >= 1 &&
    value.length <= 150
  )
}

function isValidNamaPejabat(value: unknown): value is string | null {
  if (value === null) {
    return true
  }
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length >= 1 &&
    value.length <= 200
  )
}

function isValidHttpsUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    /\s/.test(value) ||
    value.length === 0
  ) {
    return false
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:"
  } catch {
    return false
  }
}

function isValidStoragePath(
  value: unknown,
  slotKey: StrukturOrganisasiSlotKey
): value is string {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0
  ) {
    return false
  }
  const expectedPrefix = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto/`
  if (!value.startsWith(expectedPrefix)) {
    return false
  }
  const filename = value.slice(expectedPrefix.length)
  if (
    !filename ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename === "." ||
    filename === ".."
  ) {
    return false
  }
  return /^[A-Za-z0-9._-]+$/.test(filename)
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    return false
  }
  return !isNaN(Date.parse(value))
}

function parseStrukturOrganisasi(row: unknown): StrukturOrganisasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data struktur organisasi dari database tidak valid.")
  }

  const r = row

  if (!isStrukturOrganisasiSlotKey(r.slot_key)) {
    throw new Error(`Kolom slot_key '${String(r.slot_key)}' tidak valid.`)
  }

  const slotKey = r.slot_key
  const meta = STRUKTUR_ORGANISASI_SLOT_METADATA[slotKey]

  if (!isValidNamaJabatan(r.nama_jabatan) || r.nama_jabatan !== meta.nama_jabatan) {
    throw new Error(`Kolom nama_jabatan untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (!isValidNamaPejabat(r.nama_pejabat)) {
    throw new Error(`Kolom nama_pejabat untuk slot '${slotKey}' tidak valid.`)
  }

  if (r.parent_slot_key !== meta.parent_slot_key) {
    throw new Error(`Kolom parent_slot_key untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (
    !isStrukturOrganisasiKelompokLayout(r.kelompok_layout) ||
    r.kelompok_layout !== meta.kelompok_layout
  ) {
    throw new Error(`Kolom kelompok_layout untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (
    typeof r.urutan !== "number" ||
    !Number.isInteger(r.urutan) ||
    r.urutan < 1 ||
    r.urutan > 16 ||
    r.urutan !== meta.urutan
  ) {
    throw new Error(`Kolom urutan untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  const hasFotoUrl = r.foto_url !== null
  const hasStoragePath = r.foto_storage_path !== null

  if (hasFotoUrl !== hasStoragePath) {
    throw new Error(`Pasangan foto_url dan foto_storage_path untuk slot '${slotKey}' tidak konsisten.`)
  }

  if (hasFotoUrl) {
    if (!isValidHttpsUrl(r.foto_url)) {
      throw new Error(`Kolom foto_url untuk slot '${slotKey}' invalid.`)
    }
    if (r.foto_storage_path === null || !isValidStoragePath(r.foto_storage_path, slotKey)) {
      throw new Error(`Kolom foto_storage_path untuk slot '${slotKey}' invalid.`)
    }
  }

  if (!isValidTimestamp(r.created_at)) {
    throw new Error(`Kolom created_at untuk slot '${slotKey}' invalid.`)
  }

  if (!isValidTimestamp(r.updated_at)) {
    throw new Error(`Kolom updated_at untuk slot '${slotKey}' invalid.`)
  }

  return {
    slot_key: slotKey,
    nama_jabatan: meta.nama_jabatan,
    nama_pejabat: r.nama_pejabat,
    foto_url: r.foto_url as string | null,
    foto_storage_path: r.foto_storage_path as string | null,
    parent_slot_key: meta.parent_slot_key,
    kelompok_layout: meta.kelompok_layout,
    urutan: meta.urutan,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function parseStrukturOrganisasiPublik(row: unknown): StrukturOrganisasiPublik {
  if (!isObjectRecord(row)) {
    throw new Error("Format data struktur organisasi publik dari database tidak valid.")
  }

  const r = row

  if (!isStrukturOrganisasiSlotKey(r.slot_key)) {
    throw new Error(`Kolom slot_key '${String(r.slot_key)}' tidak valid.`)
  }

  const slotKey = r.slot_key
  const meta = STRUKTUR_ORGANISASI_SLOT_METADATA[slotKey]

  if (!isValidNamaJabatan(r.nama_jabatan) || r.nama_jabatan !== meta.nama_jabatan) {
    throw new Error(`Kolom nama_jabatan untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (!isValidNamaPejabat(r.nama_pejabat)) {
    throw new Error(`Kolom nama_pejabat untuk slot '${slotKey}' tidak valid.`)
  }

  if (r.parent_slot_key !== meta.parent_slot_key) {
    throw new Error(`Kolom parent_slot_key untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (
    !isStrukturOrganisasiKelompokLayout(r.kelompok_layout) ||
    r.kelompok_layout !== meta.kelompok_layout
  ) {
    throw new Error(`Kolom kelompok_layout untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (
    typeof r.urutan !== "number" ||
    !Number.isInteger(r.urutan) ||
    r.urutan < 1 ||
    r.urutan > 16 ||
    r.urutan !== meta.urutan
  ) {
    throw new Error(`Kolom urutan untuk slot '${slotKey}' tidak sesuai metadata.`)
  }

  if (r.foto_url !== null && !isValidHttpsUrl(r.foto_url)) {
    throw new Error(`Kolom foto_url untuk slot '${slotKey}' invalid.`)
  }

  return {
    slot_key: slotKey,
    nama_jabatan: meta.nama_jabatan,
    nama_pejabat: r.nama_pejabat,
    foto_url: r.foto_url as string | null,
    parent_slot_key: meta.parent_slot_key,
    kelompok_layout: meta.kelompok_layout,
    urutan: meta.urutan,
  }
}

function validateAndParseAdminArray(data: unknown): StrukturOrganisasi[] {
  if (!Array.isArray(data) || data.length !== 16) {
    throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
  }

  const seenSlots = new Set<StrukturOrganisasiSlotKey>()
  const seenUrutan = new Set<number>()
  const parsedList: StrukturOrganisasi[] = []

  for (let i = 0; i < 16; i++) {
    const expectedSlotKey = STRUKTUR_ORGANISASI_SLOT_KEYS[i]
    const expectedUrutan = i + 1

    let parsed: StrukturOrganisasi
    try {
      parsed = parseStrukturOrganisasi(data[i])
    } catch {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }

    if (parsed.slot_key !== expectedSlotKey || parsed.urutan !== expectedUrutan) {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }

    if (seenSlots.has(parsed.slot_key) || seenUrutan.has(parsed.urutan)) {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }

    seenSlots.add(parsed.slot_key)
    seenUrutan.add(parsed.urutan)

    parsedList.push(parsed)
  }

  for (const item of parsedList) {
    if (item.parent_slot_key !== null && !seenSlots.has(item.parent_slot_key)) {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }
  }

  return parsedList
}

function validateAndParsePublikArray(data: unknown): StrukturOrganisasiPublik[] {
  if (!Array.isArray(data) || data.length !== 16) {
    throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
  }

  const seenSlots = new Set<StrukturOrganisasiSlotKey>()
  const seenUrutan = new Set<number>()
  const parsedList: StrukturOrganisasiPublik[] = []

  for (let i = 0; i < 16; i++) {
    const expectedSlotKey = STRUKTUR_ORGANISASI_SLOT_KEYS[i]
    const expectedUrutan = i + 1

    let parsed: StrukturOrganisasiPublik
    try {
      parsed = parseStrukturOrganisasiPublik(data[i])
    } catch {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }

    if (parsed.slot_key !== expectedSlotKey || parsed.urutan !== expectedUrutan) {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }

    if (seenSlots.has(parsed.slot_key) || seenUrutan.has(parsed.urutan)) {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }

    seenSlots.add(parsed.slot_key)
    seenUrutan.add(parsed.urutan)

    parsedList.push(parsed)
  }

  for (const item of parsedList) {
    if (item.parent_slot_key !== null && !seenSlots.has(item.parent_slot_key)) {
      throw new Error("Data struktur organisasi tidak lengkap atau tidak valid.")
    }
  }

  return parsedList
}

/**
 * Membaca 16 slot publik struktur organisasi.
 * Urutan struktur 1-16, memvalidasi metadata tetap.
 */
export async function fetchStrukturOrganisasiPublik(): Promise<
  StrukturOrganisasiPublik[]
> {
  try {
    const { data, error } = await supabase
      .from(STRUKTUR_ORGANISASI_TABLE)
      .select(
        "slot_key, nama_jabatan, nama_pejabat, foto_url, parent_slot_key, kelompok_layout, urutan"
      )
      .order("urutan", { ascending: true })

    if (error) {
      throw new Error("Gagal memuat struktur organisasi.")
    }

    return validateAndParsePublikArray(data)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Gagal memuat struktur organisasi.")
  }
}

/**
 * Membaca seluruh 10 kolom dari 16 slot struktur organisasi.
 * Digunakan dalam route admin authenticated. Tidak melakukan write.
 */
export async function fetchSemuaStrukturOrganisasiAdmin(): Promise<
  StrukturOrganisasi[]
> {
  try {
    const { data, error } = await supabase
      .from(STRUKTUR_ORGANISASI_TABLE)
      .select(
        "slot_key, nama_jabatan, nama_pejabat, foto_url, foto_storage_path, parent_slot_key, kelompok_layout, urutan, created_at, updated_at"
      )
      .order("urutan", { ascending: true })

    if (error) {
      throw new Error("Gagal memuat seluruh data struktur organisasi.")
    }

    return validateAndParseAdminArray(data)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Gagal memuat seluruh data struktur organisasi.")
  }
}
