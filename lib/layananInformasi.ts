import { supabase } from "@/lib/supabase"

export const LAYANAN_SURAT_TABLE = "layanan_surat"
export const PERSYARATAN_LAYANAN_SURAT_TABLE = "persyaratan_layanan_surat"
export const PENGATURAN_LAYANAN_INFORMASI_TABLE = "pengaturan_layanan_informasi"
export const JADWAL_PELAYANAN_INFORMASI_TABLE = "jadwal_pelayanan_informasi"

export type HariPelayananKey =
  | "senin"
  | "selasa"
  | "rabu"
  | "kamis"
  | "jumat"
  | "sabtu"
  | "minggu"

export type LayananSurat = {
  id: string
  nama_layanan: string
  deskripsi: string | null
  estimasi_pembuatan: string
  biaya: string
  form_pendataan_url: string
  is_active: boolean
  urutan: number
  created_at: string
  updated_at: string
}

export type PersyaratanLayananSurat = {
  id: string
  layanan_surat_id: string
  isi_persyaratan: string
  urutan: number
  created_at: string
  updated_at: string
}

export type PengaturanLayananInformasi = {
  id: string
  slot_key: "utama"
  // Legacy compatibility.
  // Jadwal baru menggunakan jadwal_pelayanan_informasi.
  jadwal_pelayanan: string
  whatsapp_pelayanan: string | null
  email_pelayanan: string | null
  telepon_pelayanan: string | null
  telepon_pelayanan_alternatif: string | null
  alamat_pelayanan: string | null
  google_maps_url: string | null
  whatsapp_pengaduan: string | null
  form_pengaduan_url: string | null
  created_at: string
  updated_at: string
}

export type JadwalPelayananInformasi = {
  id: string
  hari_key: HariPelayananKey
  is_tutup: boolean
  jam_buka: string | null
  jam_tutup: string | null
  urutan: number
  created_at: string
  updated_at: string
}

export const HARI_PELAYANAN_LABEL: Record<
  HariPelayananKey,
  string
> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
}

export type GrupJadwalPelayanan = {
  hari_mulai: HariPelayananKey
  hari_selesai: HariPelayananKey
  label_hari: string
  is_tutup: boolean
  jam_buka: string | null
  jam_tutup: string | null
  label_waktu: string
}

export type LayananSuratDenganPersyaratan = LayananSurat & {
  persyaratan: PersyaratanLayananSurat[]
}

export type DataLayananInformasiPublik = {
  layanan: LayananSuratDenganPersyaratan[]
  pengaturan: PengaturanLayananInformasi | null
  jadwal: JadwalPelayananInformasi[]
}

export type DataLayananInformasiAdmin = {
  layanan: LayananSuratDenganPersyaratan[]
  pengaturan: PengaturanLayananInformasi | null
  jadwal: JadwalPelayananInformasi[]
}

const SELECT_LAYANAN_SURAT = [
  "id",
  "nama_layanan",
  "deskripsi",
  "estimasi_pembuatan",
  "biaya",
  "form_pendataan_url",
  "is_active",
  "urutan",
  "created_at",
  "updated_at",
].join(",")

const SELECT_PERSYARATAN_LAYANAN_SURAT = [
  "id",
  "layanan_surat_id",
  "isi_persyaratan",
  "urutan",
  "created_at",
  "updated_at",
].join(",")

const SELECT_PENGATURAN_LAYANAN_INFORMASI = [
  "id",
  "slot_key",
  "jadwal_pelayanan",
  "whatsapp_pelayanan",
  "email_pelayanan",
  "telepon_pelayanan",
  "telepon_pelayanan_alternatif",
  "alamat_pelayanan",
  "google_maps_url",
  "whatsapp_pengaduan",
  "form_pengaduan_url",
  "created_at",
  "updated_at",
].join(",")

const SELECT_JADWAL_PELAYANAN_INFORMASI = [
  "id",
  "hari_key",
  "is_tutup",
  "jam_buka",
  "jam_tutup",
  "urutan",
  "created_at",
  "updated_at",
].join(",")

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidLayananSuratId(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    return false
  }
  return REGEX_UUID.test(value)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const HARI_KEY_SET: Set<string> = new Set([
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
])

function isHariPelayananKey(value: unknown): value is HariPelayananKey {
  return typeof value === "string" && HARI_KEY_SET.has(value)
}

function parseJadwalPelayananInformasi(row: unknown): JadwalPelayananInformasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data jadwal pelayanan informasi tidak valid.")
  }

  const r = row
  if (typeof r.id !== "string" || r.id.trim() === "") {
    throw new Error("ID jadwal pelayanan informasi tidak valid.")
  }
  if (!isHariPelayananKey(r.hari_key)) {
    throw new Error(`Hari key '${String(r.hari_key)}' tidak valid.`)
  }
  if (typeof r.is_tutup !== "boolean") {
    throw new Error(`Status is_tutup untuk hari ${String(r.hari_key)} harus berjenis boolean.`)
  }
  if (
    typeof r.urutan !== "number" ||
    !Number.isInteger(r.urutan) ||
    r.urutan < 1 ||
    r.urutan > 7
  ) {
    throw new Error(`Urutan untuk hari ${String(r.hari_key)} harus berupa integer antara 1 sampai 7.`)
  }

  if (r.jam_buka !== null && typeof r.jam_buka !== "string") {
    throw new Error(`Jam_buka untuk hari ${String(r.hari_key)} harus berupa string atau null.`)
  }
  if (r.jam_tutup !== null && typeof r.jam_tutup !== "string") {
    throw new Error(`Jam_tutup untuk hari ${String(r.hari_key)} harus berupa string atau null.`)
  }

  if (typeof r.created_at !== "string" || r.created_at.trim() === "") {
    throw new Error(`Created_at untuk hari ${String(r.hari_key)} tidak valid.`)
  }
  if (typeof r.updated_at !== "string" || r.updated_at.trim() === "") {
    throw new Error(`Updated_at untuk hari ${String(r.hari_key)} tidak valid.`)
  }

  return {
    id: r.id,
    hari_key: r.hari_key,
    is_tutup: r.is_tutup,
    jam_buka: r.jam_buka,
    jam_tutup: r.jam_tutup,
    urutan: r.urutan,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function parsePengaturanLayananInformasi(row: unknown): PengaturanLayananInformasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data pengaturan layanan informasi tidak valid.")
  }

  const r = row
  if (typeof r.id !== "string" || r.id.trim() === "") {
    throw new Error("ID pengaturan layanan informasi tidak valid.")
  }
  if (r.slot_key !== "utama") {
    throw new Error("Slot key pengaturan layanan informasi harus 'utama'.")
  }
  if (typeof r.jadwal_pelayanan !== "string" || r.jadwal_pelayanan.trim() === "") {
    throw new Error("Jadwal pelayanan tidak valid.")
  }

  return {
    id: r.id,
    slot_key: "utama",
    jadwal_pelayanan: r.jadwal_pelayanan,
    whatsapp_pelayanan:
      typeof r.whatsapp_pelayanan === "string" && r.whatsapp_pelayanan.trim() !== ""
        ? r.whatsapp_pelayanan
        : null,
    email_pelayanan:
      typeof r.email_pelayanan === "string" && r.email_pelayanan.trim() !== ""
        ? r.email_pelayanan
        : null,
    telepon_pelayanan:
      typeof r.telepon_pelayanan === "string" && r.telepon_pelayanan.trim() !== ""
        ? r.telepon_pelayanan
        : null,
    telepon_pelayanan_alternatif:
      typeof r.telepon_pelayanan_alternatif === "string" && r.telepon_pelayanan_alternatif.trim() !== ""
        ? r.telepon_pelayanan_alternatif
        : null,
    alamat_pelayanan:
      typeof r.alamat_pelayanan === "string" && r.alamat_pelayanan.trim() !== ""
        ? r.alamat_pelayanan
        : null,
    google_maps_url:
      typeof r.google_maps_url === "string" && r.google_maps_url.trim() !== ""
        ? r.google_maps_url
        : null,
    whatsapp_pengaduan:
      typeof r.whatsapp_pengaduan === "string" && r.whatsapp_pengaduan.trim() !== ""
        ? r.whatsapp_pengaduan
        : null,
    form_pengaduan_url:
      typeof r.form_pengaduan_url === "string" && r.form_pengaduan_url.trim() !== ""
        ? r.form_pengaduan_url
        : null,
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

function parseLayananSurat(row: unknown): LayananSurat {
  if (!isObjectRecord(row)) {
    throw new Error("Format data layanan surat tidak valid.")
  }

  const r = row
  if (!isValidLayananSuratId(r.id)) {
    throw new Error("ID layanan surat tidak valid.")
  }
  if (typeof r.nama_layanan !== "string" || r.nama_layanan.trim() === "") {
    throw new Error("Nama layanan surat tidak valid.")
  }
  if (typeof r.estimasi_pembuatan !== "string" || r.estimasi_pembuatan.trim() === "") {
    throw new Error("Estimasi pembuatan layanan surat tidak valid.")
  }
  if (typeof r.biaya !== "string" || r.biaya.trim() === "") {
    throw new Error("Biaya layanan surat tidak valid.")
  }
  if (typeof r.form_pendataan_url !== "string" || r.form_pendataan_url.trim() === "") {
    throw new Error("URL form pendataan layanan surat tidak valid.")
  }

  return {
    id: r.id,
    nama_layanan: r.nama_layanan,
    deskripsi:
      typeof r.deskripsi === "string" && r.deskripsi.trim() !== ""
        ? r.deskripsi
        : null,
    estimasi_pembuatan: r.estimasi_pembuatan,
    biaya: r.biaya.trim(),
    form_pendataan_url: r.form_pendataan_url,
    is_active: Boolean(r.is_active),
    urutan: typeof r.urutan === "number" ? r.urutan : 1,
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

function parsePersyaratan(row: unknown): PersyaratanLayananSurat {
  if (!isObjectRecord(row)) {
    throw new Error("Format data persyaratan tidak valid.")
  }

  const r = row
  if (!isValidLayananSuratId(r.id)) {
    throw new Error("ID persyaratan tidak valid.")
  }
  if (!isValidLayananSuratId(r.layanan_surat_id)) {
    throw new Error("ID parent persyaratan tidak valid.")
  }
  if (typeof r.isi_persyaratan !== "string" || r.isi_persyaratan.trim() === "") {
    throw new Error("Isi persyaratan tidak valid.")
  }

  return {
    id: r.id,
    layanan_surat_id: r.layanan_surat_id,
    isi_persyaratan: r.isi_persyaratan,
    urutan: typeof r.urutan === "number" ? r.urutan : 1,
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

function groupPersyaratanByParentId(
  childList: PersyaratanLayananSurat[]
): Map<string, PersyaratanLayananSurat[]> {
  const map = new Map<string, PersyaratanLayananSurat[]>()
  for (const item of childList) {
    const list = map.get(item.layanan_surat_id) || []
    list.push(item)
    map.set(item.layanan_surat_id, list)
  }
  return map
}

export async function fetchJadwalPelayananInformasi(): Promise<JadwalPelayananInformasi[]> {
  const { data, error } = await supabase
    .from(JADWAL_PELAYANAN_INFORMASI_TABLE)
    .select(SELECT_JADWAL_PELAYANAN_INFORMASI)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    throw new Error(`Gagal memuat jadwal pelayanan informasi: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map(parseJadwalPelayananInformasi)
}

export async function fetchPengaturanLayananInformasi(): Promise<PengaturanLayananInformasi | null> {
  const { data, error } = await supabase
    .from(PENGATURAN_LAYANAN_INFORMASI_TABLE)
    .select(SELECT_PENGATURAN_LAYANAN_INFORMASI)
    .eq("slot_key", "utama")
    .maybeSingle()

  if (error) {
    throw new Error(`Gagal memuat pengaturan layanan informasi: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return parsePengaturanLayananInformasi(data)
}

export async function fetchLayananSuratAdmin(): Promise<LayananSuratDenganPersyaratan[]> {
  const { data: parentRows, error: parentError } = await supabase
    .from(LAYANAN_SURAT_TABLE)
    .select(SELECT_LAYANAN_SURAT)
    .order("urutan", { ascending: true })
    .order("nama_layanan", { ascending: true })
    .order("id", { ascending: true })

  if (parentError) {
    throw new Error(`Gagal memuat daftar layanan surat admin: ${parentError.message}`)
  }

  if (!parentRows || parentRows.length === 0) {
    return []
  }

  const parentList = parentRows.map(parseLayananSurat)
  const parentIds = parentList.map((p) => p.id)

  const { data: childRows, error: childError } = await supabase
    .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
    .select(SELECT_PERSYARATAN_LAYANAN_SURAT)
    .in("layanan_surat_id", parentIds)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true })

  if (childError) {
    throw new Error(`Gagal memuat persyaratan layanan surat admin: ${childError.message}`)
  }

  const childList = (childRows || []).map(parsePersyaratan)
  const childMap = groupPersyaratanByParentId(childList)

  return parentList.map((parent) => ({
    ...parent,
    persyaratan: childMap.get(parent.id) || [],
  }))
}

export async function fetchLayananSuratByIdAdmin(
  id: string
): Promise<LayananSuratDenganPersyaratan | null> {
  if (!isValidLayananSuratId(id)) {
    return null
  }

  const { data: parentRow, error: parentError } = await supabase
    .from(LAYANAN_SURAT_TABLE)
    .select(SELECT_LAYANAN_SURAT)
    .eq("id", id)
    .maybeSingle()

  if (parentError) {
    throw new Error(`Gagal memuat rincian layanan surat admin: ${parentError.message}`)
  }

  if (!parentRow) {
    return null
  }

  const parent = parseLayananSurat(parentRow)

  const { data: childRows, error: childError } = await supabase
    .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
    .select(SELECT_PERSYARATAN_LAYANAN_SURAT)
    .eq("layanan_surat_id", parent.id)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true })

  if (childError) {
    throw new Error(`Gagal memuat persyaratan rincian layanan surat admin: ${childError.message}`)
  }

  const persyaratan = (childRows || []).map(parsePersyaratan)

  return {
    ...parent,
    persyaratan,
  }
}

export async function fetchLayananSuratPublik(): Promise<LayananSuratDenganPersyaratan[]> {
  const { data: parentRows, error: parentError } = await supabase
    .from(LAYANAN_SURAT_TABLE)
    .select(SELECT_LAYANAN_SURAT)
    .eq("is_active", true)
    .order("urutan", { ascending: true })
    .order("nama_layanan", { ascending: true })
    .order("id", { ascending: true })

  if (parentError) {
    throw new Error(`Gagal memuat daftar layanan surat publik: ${parentError.message}`)
  }

  if (!parentRows || parentRows.length === 0) {
    return []
  }

  const parentList = parentRows.map(parseLayananSurat)
  const parentIds = parentList.map((p) => p.id)

  const { data: childRows, error: childError } = await supabase
    .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
    .select(SELECT_PERSYARATAN_LAYANAN_SURAT)
    .in("layanan_surat_id", parentIds)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true })

  if (childError) {
    throw new Error(`Gagal memuat persyaratan layanan surat publik: ${childError.message}`)
  }

  const childList = (childRows || []).map(parsePersyaratan)
  const childMap = groupPersyaratanByParentId(childList)

  return parentList.map((parent) => ({
    ...parent,
    persyaratan: childMap.get(parent.id) || [],
  }))
}

export async function fetchDataLayananInformasiPublik(): Promise<DataLayananInformasiPublik> {
  const [layanan, pengaturan, jadwal] = await Promise.all([
    fetchLayananSuratPublik(),
    fetchPengaturanLayananInformasi(),
    fetchJadwalPelayananInformasi(),
  ])

  return {
    layanan,
    pengaturan,
    jadwal,
  }
}

export async function fetchDataLayananInformasiAdmin(): Promise<DataLayananInformasiAdmin> {
  const [layanan, pengaturan, jadwal] = await Promise.all([
    fetchLayananSuratAdmin(),
    fetchPengaturanLayananInformasi(),
    fetchJadwalPelayananInformasi(),
  ])

  return {
    layanan,
    pengaturan,
    jadwal,
  }
}

const REGEX_TIME = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/

export function formatJamPelayanan(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }

  const match = trimmed.match(REGEX_TIME)
  if (!match) {
    return null
  }

  const hh = match[1]
  const mm = match[2]
  return `${hh}.${mm}`
}

export function groupJadwalPelayanan(
  jadwal: JadwalPelayananInformasi[]
): GrupJadwalPelayanan[] {
  if (!Array.isArray(jadwal) || jadwal.length === 0) {
    return []
  }

  const sorted = [...jadwal].sort((a, b) => {
    if (a.urutan !== b.urutan) {
      return a.urutan - b.urutan
    }
    return a.id.localeCompare(b.id)
  })

  const groups: GrupJadwalPelayanan[] = []
  let currentGroupItems: JadwalPelayananInformasi[] = []

  function buildLabelWaktu(isTutup: boolean, jamBuka: string | null, jamTutup: string | null): string {
    if (isTutup) {
      return "Tutup"
    }
    const buka = formatJamPelayanan(jamBuka)
    const tutup = formatJamPelayanan(jamTutup)
    if (buka && tutup) {
      return `${buka} – ${tutup}`
    }
    return "Jadwal belum tersedia"
  }

  function canMerge(prev: JadwalPelayananInformasi, curr: JadwalPelayananInformasi): boolean {
    if (curr.urutan !== prev.urutan + 1) {
      return false
    }
    if (prev.is_tutup !== curr.is_tutup) {
      return false
    }
    if (prev.is_tutup) {
      return true
    }
    return prev.jam_buka === curr.jam_buka && prev.jam_tutup === curr.jam_tutup
  }

  for (const item of sorted) {
    if (currentGroupItems.length === 0) {
      currentGroupItems.push(item)
    } else {
      const prev = currentGroupItems[currentGroupItems.length - 1]
      if (canMerge(prev, item)) {
        currentGroupItems.push(item)
      } else {
        const first = currentGroupItems[0]
        const last = currentGroupItems[currentGroupItems.length - 1]
        const labelHari =
          first.hari_key === last.hari_key
            ? HARI_PELAYANAN_LABEL[first.hari_key]
            : `${HARI_PELAYANAN_LABEL[first.hari_key]} – ${HARI_PELAYANAN_LABEL[last.hari_key]}`

        groups.push({
          hari_mulai: first.hari_key,
          hari_selesai: last.hari_key,
          label_hari: labelHari,
          is_tutup: first.is_tutup,
          jam_buka: first.jam_buka,
          jam_tutup: first.jam_tutup,
          label_waktu: buildLabelWaktu(first.is_tutup, first.jam_buka, first.jam_tutup),
        })

        currentGroupItems = [item]
      }
    }
  }

  if (currentGroupItems.length > 0) {
    const first = currentGroupItems[0]
    const last = currentGroupItems[currentGroupItems.length - 1]
    const labelHari =
      first.hari_key === last.hari_key
        ? HARI_PELAYANAN_LABEL[first.hari_key]
        : `${HARI_PELAYANAN_LABEL[first.hari_key]} – ${HARI_PELAYANAN_LABEL[last.hari_key]}`

    groups.push({
      hari_mulai: first.hari_key,
      hari_selesai: last.hari_key,
      label_hari: labelHari,
      is_tutup: first.is_tutup,
      jam_buka: first.jam_buka,
      jam_tutup: first.jam_tutup,
      label_waktu: buildLabelWaktu(first.is_tutup, first.jam_buka, first.jam_tutup),
    })
  }

  return groups
}

export function normalizeIndonesianPhoneNumber(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }

  const digits = trimmed.replace(/\D/g, "")
  if (digits.length < 8 || digits.length > 15) {
    return null
  }

  if (digits.startsWith("0")) {
    return "62" + digits.slice(1)
  }
  if (digits.startsWith("8")) {
    return "62" + digits
  }
  if (digits.startsWith("62")) {
    return digits
  }

  return null
}

export function buildWhatsAppUrl(
  value: string | null | undefined
): string | null {
  const normalized = normalizeIndonesianPhoneNumber(value)
  if (!normalized) {
    return null
  }
  return `https://wa.me/${normalized}`
}

export function buildTelephoneUrl(
  value: string | null | undefined
): string | null {
  const normalized = normalizeIndonesianPhoneNumber(value)
  if (!normalized) {
    return null
  }
  return `tel:+${normalized}`
}

const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function buildGmailComposeUrl(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (trimmed === "" || !REGEX_EMAIL.test(trimmed)) {
    return null
  }

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(trimmed)}`
}

export function buildMailtoUrl(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (trimmed === "" || !REGEX_EMAIL.test(trimmed)) {
    return null
  }

  return `mailto:${trimmed}`
}

export function getSafeHttpsUrl(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "https:") {
      return null
    }
    return parsed.href
  } catch {
    return null
  }
}
