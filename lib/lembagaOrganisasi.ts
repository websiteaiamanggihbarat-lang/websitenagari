import { supabase } from "@/lib/supabase"

export const LEMBAGA_ORGANISASI_TABLE = "lembaga_organisasi"
export const PENGURUS_LEMBAGA_ORGANISASI_TABLE = "pengurus_lembaga_organisasi"
export const TUGAS_LEMBAGA_ORGANISASI_TABLE = "tugas_lembaga_organisasi"
export const GALERI_LEMBAGA_ORGANISASI_TABLE = "galeri_lembaga_organisasi"
export const LEMBAGA_ORGANISASI_BUCKET = "foto-lembaga-organisasi"
export const LEMBAGA_ORGANISASI_STORAGE_ROOT = "lembaga-organisasi"

export type JenisLembagaOrganisasi = "lembaga" | "organisasi"

export function isJenisLembagaOrganisasi(
  value: unknown
): value is JenisLembagaOrganisasi {
  return value === "lembaga" || value === "organisasi"
}

export function formatJenisLembagaOrganisasi(
  jenis: JenisLembagaOrganisasi
): string {
  switch (jenis) {
    case "lembaga":
      return "Lembaga"
    case "organisasi":
      return "Organisasi"
    default:
      return jenis
  }
}

export type LembagaOrganisasi = {
  id: string
  jenis: JenisLembagaOrganisasi
  nama: string
  deskripsi: string
  alamat: string
  kontak: string | null
  jam_kerja: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PengurusLembagaOrganisasi = {
  id: string
  lembaga_organisasi_id: string
  nama_jabatan: string
  nama_pengurus: string | null
  foto_url: string | null
  foto_storage_path: string | null
  urutan: number
  created_at: string
  updated_at: string
}

export type TugasLembagaOrganisasi = {
  id: string
  lembaga_organisasi_id: string
  isi_tugas: string
  urutan: number
  created_at: string
  updated_at: string
}

export type GaleriLembagaOrganisasi = {
  id: string
  lembaga_organisasi_id: string
  foto_url: string
  foto_storage_path: string
  teks_alt: string | null
  is_cover: boolean
  is_active: boolean
  urutan: number
  created_at: string
  updated_at: string
}

export type KartuLembagaOrganisasiPublik = {
  id: string
  jenis: JenisLembagaOrganisasi
  nama: string
  deskripsi?: string | null
  alamat: string
  kontak: string | null
  foto_url: string
  teks_alt: string | null
}

/**
 * Utility presentational untuk memotong kalimat menjadi maksimal 2 kalimat.
 * Digunakan khusus untuk kartu pada halaman daftar public lembaga-organisasi.
 */
export function getTwoSentences(text?: string | null): string {
  if (!text || !text.trim()) {
    return "Informasi profil belum tersedia."
  }
  const cleaned = text.trim()
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s+|$)/g)
  if (!sentences || sentences.length === 0) {
    return cleaned
  }
  if (sentences.length === 1) {
    return sentences[0].trim()
  }
  return (sentences[0] + sentences[1]).trim()
}

export type PengurusLembagaOrganisasiPublik = {
  id: string
  nama_jabatan: string
  nama_pengurus: string | null
  foto_url: string | null
  urutan: number
}

export type TugasLembagaOrganisasiPublik = {
  id: string
  isi_tugas: string
  urutan: number
}

export type GaleriLembagaOrganisasiPublik = {
  id: string
  foto_url: string
  teks_alt: string | null
  is_cover: boolean
  urutan: number
}

export type DetailLembagaOrganisasiPublik = {
  id: string
  jenis: JenisLembagaOrganisasi
  nama: string
  deskripsi: string
  alamat: string
  kontak: string | null
  jam_kerja: string | null
  pengurus: PengurusLembagaOrganisasiPublik[]
  tugas: TugasLembagaOrganisasiPublik[]
  galeri: GaleriLembagaOrganisasiPublik[]
}

export type DaftarLembagaOrganisasiAdmin = LembagaOrganisasi & {
  foto_cover_url: string | null
  foto_cover_alt: string | null
}

export type DetailLembagaOrganisasiAdmin = {
  data: LembagaOrganisasi
  pengurus: PengurusLembagaOrganisasi[]
  tugas: TugasLembagaOrganisasi[]
  galeri: GaleriLembagaOrganisasi[]
}

const SELECT_LEMBAGA_ORGANISASI = [
  "id",
  "jenis",
  "nama",
  "deskripsi",
  "alamat",
  "kontak",
  "jam_kerja",
  "is_active",
  "created_at",
  "updated_at",
].join(",")

const SELECT_PENGURUS = [
  "id",
  "lembaga_organisasi_id",
  "nama_jabatan",
  "nama_pengurus",
  "foto_url",
  "foto_storage_path",
  "urutan",
  "created_at",
  "updated_at",
].join(",")

const SELECT_TUGAS = [
  "id",
  "lembaga_organisasi_id",
  "isi_tugas",
  "urutan",
  "created_at",
  "updated_at",
].join(",")

const SELECT_GALERI = [
  "id",
  "lembaga_organisasi_id",
  "foto_url",
  "foto_storage_path",
  "teks_alt",
  "is_cover",
  "is_active",
  "urutan",
  "created_at",
  "updated_at",
].join(",")

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidLembagaOrganisasiId(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    return false
  }
  return REGEX_UUID.test(value)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseLembagaOrganisasi(row: unknown): LembagaOrganisasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data lembaga organisasi tidak valid.")
  }

  const r = row
  if (!isValidLembagaOrganisasiId(r.id)) {
    throw new Error("ID lembaga organisasi tidak valid.")
  }
  if (!isJenisLembagaOrganisasi(r.jenis)) {
    throw new Error("Jenis lembaga organisasi tidak valid.")
  }
  if (typeof r.nama !== "string" || r.nama.trim() === "") {
    throw new Error("Nama lembaga organisasi tidak valid.")
  }
  if (typeof r.deskripsi !== "string" || r.deskripsi.trim() === "") {
    throw new Error("Deskripsi lembaga organisasi tidak valid.")
  }
  if (typeof r.alamat !== "string" || r.alamat.trim() === "") {
    throw new Error("Alamat lembaga organisasi tidak valid.")
  }

  return {
    id: r.id,
    jenis: r.jenis,
    nama: r.nama,
    deskripsi: r.deskripsi,
    alamat: r.alamat,
    kontak: typeof r.kontak === "string" && r.kontak.trim() !== "" ? r.kontak : null,
    jam_kerja: typeof r.jam_kerja === "string" && r.jam_kerja.trim() !== "" ? r.jam_kerja : null,
    is_active: Boolean(r.is_active),
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

function parsePengurus(row: unknown): PengurusLembagaOrganisasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data pengurus tidak valid.")
  }

  const r = row
  if (!isValidLembagaOrganisasiId(r.id)) {
    throw new Error("ID pengurus tidak valid.")
  }
  if (!isValidLembagaOrganisasiId(r.lembaga_organisasi_id)) {
    throw new Error("ID parent pengurus tidak valid.")
  }
  if (typeof r.nama_jabatan !== "string" || r.nama_jabatan.trim() === "") {
    throw new Error("Nama jabatan tidak valid.")
  }

  return {
    id: r.id,
    lembaga_organisasi_id: r.lembaga_organisasi_id,
    nama_jabatan: r.nama_jabatan,
    nama_pengurus: typeof r.nama_pengurus === "string" && r.nama_pengurus.trim() !== "" ? r.nama_pengurus : null,
    foto_url: typeof r.foto_url === "string" && r.foto_url.trim() !== "" ? r.foto_url : null,
    foto_storage_path: typeof r.foto_storage_path === "string" && r.foto_storage_path.trim() !== "" ? r.foto_storage_path : null,
    urutan: typeof r.urutan === "number" ? r.urutan : 1,
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

function parseTugas(row: unknown): TugasLembagaOrganisasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data tugas tidak valid.")
  }

  const r = row
  if (!isValidLembagaOrganisasiId(r.id)) {
    throw new Error("ID tugas tidak valid.")
  }
  if (!isValidLembagaOrganisasiId(r.lembaga_organisasi_id)) {
    throw new Error("ID parent tugas tidak valid.")
  }
  if (typeof r.isi_tugas !== "string" || r.isi_tugas.trim() === "") {
    throw new Error("Isi tugas tidak valid.")
  }

  return {
    id: r.id,
    lembaga_organisasi_id: r.lembaga_organisasi_id,
    isi_tugas: r.isi_tugas,
    urutan: typeof r.urutan === "number" ? r.urutan : 1,
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

function parseGaleri(row: unknown): GaleriLembagaOrganisasi {
  if (!isObjectRecord(row)) {
    throw new Error("Format data galeri tidak valid.")
  }

  const r = row
  if (!isValidLembagaOrganisasiId(r.id)) {
    throw new Error("ID galeri tidak valid.")
  }
  if (!isValidLembagaOrganisasiId(r.lembaga_organisasi_id)) {
    throw new Error("ID parent galeri tidak valid.")
  }
  if (typeof r.foto_url !== "string" || r.foto_url.trim() === "") {
    throw new Error("Foto URL galeri tidak valid.")
  }
  if (typeof r.foto_storage_path !== "string" || r.foto_storage_path.trim() === "") {
    throw new Error("Foto storage path galeri tidak valid.")
  }

  return {
    id: r.id,
    lembaga_organisasi_id: r.lembaga_organisasi_id,
    foto_url: r.foto_url,
    foto_storage_path: r.foto_storage_path,
    teks_alt: typeof r.teks_alt === "string" && r.teks_alt.trim() !== "" ? r.teks_alt : null,
    is_cover: Boolean(r.is_cover),
    is_active: Boolean(r.is_active),
    urutan: typeof r.urutan === "number" ? r.urutan : 1,
    created_at: String(r.created_at || ""),
    updated_at: String(r.updated_at || ""),
  }
}

/**
 * Membaca daftar pengurus read-only berdasarkan parent ID
 */
export async function fetchPengurusLembagaOrganisasi(
  lembagaOrganisasiId: string
): Promise<PengurusLembagaOrganisasi[]> {
  if (!isValidLembagaOrganisasiId(lembagaOrganisasiId)) {
    return []
  }

  const { data, error } = await supabase
    .from(PENGURUS_LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_PENGURUS)
    .eq("lembaga_organisasi_id", lembagaOrganisasiId)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    throw new Error("Gagal memuat pengurus lembaga dan organisasi.")
  }

  if (!data) {
    return []
  }

  return (data as unknown[]).map(parsePengurus)
}

/**
 * Membaca daftar tugas read-only berdasarkan parent ID
 */
export async function fetchTugasLembagaOrganisasi(
  lembagaOrganisasiId: string
): Promise<TugasLembagaOrganisasi[]> {
  if (!isValidLembagaOrganisasiId(lembagaOrganisasiId)) {
    return []
  }

  const { data, error } = await supabase
    .from(TUGAS_LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_TUGAS)
    .eq("lembaga_organisasi_id", lembagaOrganisasiId)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    throw new Error("Gagal memuat tugas lembaga dan organisasi.")
  }

  if (!data) {
    return []
  }

  return (data as unknown[]).map(parseTugas)
}

/**
 * Membaca daftar galeri read-only berdasarkan parent ID
 */
export async function fetchGaleriLembagaOrganisasi(
  lembagaOrganisasiId: string,
  options?: { includeInactive?: boolean }
): Promise<GaleriLembagaOrganisasi[]> {
  if (!isValidLembagaOrganisasiId(lembagaOrganisasiId)) {
    return []
  }

  let query = supabase
    .from(GALERI_LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_GALERI)
    .eq("lembaga_organisasi_id", lembagaOrganisasiId)

  if (!options?.includeInactive) {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query
    .order("is_cover", { ascending: false })
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    throw new Error("Gagal memuat galeri foto lembaga dan organisasi.")
  }

  if (!data) {
    return []
  }

  return (data as unknown[]).map(parseGaleri)
}

/**
 * Membaca daftar publik lembaga & organisasi aktif yang memiliki foto cover aktif.
 * Mengembalikan KartuLembagaOrganisasiPublik[] tanpa mengekspos foto_storage_path.
 */
export async function fetchDaftarLembagaOrganisasiPublik(): Promise<
  KartuLembagaOrganisasiPublik[]
> {
  const { data: parents, error: errParents } = await supabase
    .from(LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_LEMBAGA_ORGANISASI)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  if (errParents) {
    throw new Error("Gagal memuat daftar publik lembaga dan organisasi.")
  }

  if (!parents || parents.length === 0) {
    return []
  }

  const parentList = (parents as unknown[]).map(parseLembagaOrganisasi)
  const parentIds = parentList.map((p) => p.id)

  const { data: covers, error: errCovers } = await supabase
    .from(GALERI_LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_GALERI)
    .in("lembaga_organisasi_id", parentIds)
    .eq("is_cover", true)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (errCovers) {
    throw new Error("Gagal memuat foto cover publik lembaga dan organisasi.")
  }

  const coverMap = new Map<string, GaleriLembagaOrganisasi>()
  if (covers) {
    for (const raw of covers as unknown[]) {
      const parsed = parseGaleri(raw)
      if (!coverMap.has(parsed.lembaga_organisasi_id)) {
        coverMap.set(parsed.lembaga_organisasi_id, parsed)
      }
    }
  }

  const hasil: KartuLembagaOrganisasiPublik[] = []
  for (const parent of parentList) {
    const cover = coverMap.get(parent.id)
    if (cover) {
      hasil.push({
        id: parent.id,
        jenis: parent.jenis,
        nama: parent.nama,
        deskripsi: parent.deskripsi,
        alamat: parent.alamat,
        kontak: parent.kontak,
        foto_url: cover.foto_url,
        teks_alt: cover.teks_alt,
      })
    }
  }

  if (hasil.length === 0) {
    return Object.values(DEFAULT_LEMBAGA_DETAILS).map((d) => ({
      id: d.id,
      jenis: d.jenis,
      nama: d.nama,
      deskripsi: d.deskripsi,
      alamat: d.alamat,
      kontak: d.kontak,
      foto_url: d.galeri[0]?.foto_url || "",
      teks_alt: d.galeri[0]?.teks_alt || null,
    }))
  }

  return hasil
}

export const DEFAULT_LEMBAGA_DETAILS: Record<string, DetailLembagaOrganisasiPublik> = {
  lpmn: {
    id: "lpmn",
    jenis: "lembaga",
    nama: "LPMN (Lembaga Pemberdayaan Masyarakat Nagari)",
    deskripsi:
      "Lembaga Pemberdayaan Masyarakat Nagari (LPMN) Nagari Aia Manggih Barat adalah lembaga kemasyarakatan yang bertugas membantu Pemerintah Nagari dalam merencanakan, melaksanakan, dan memfasilitasi pembangunan nagari secara partisipatif.\n\nMelalui kerja sama erat dengan seluruh elemen masyarakat dan jorong di Aia Manggih Barat, LPMN berfokus pada penguatan ekonomi gotong royong, pembangunan sarana fisik lingkungan, pendampingan kelompok kerja masyarakat, serta peningkatan partisipasi warga dalam Musyawarah Perencanaan Pembangunan Nagari (Musrenbang).",
    alamat: "Jl. Lintas Sumatera No. 45, Nagari Aia Manggih Barat, Kec. Lubuk Sikaping, Kabupaten Pasaman, Sumatera Barat 26311",
    kontak: "+62 821-7000-8899 (H. Kasman - Ketua LPMN)",
    jam_kerja: "Senin - Jumat: 08:00 - 16:00 WIB",
    pengurus: [
      {
        id: "lpmn-p1",
        nama_jabatan: "Ketua LPMN",
        nama_pengurus: "H. Kasman",
        foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        urutan: 1,
      },
      {
        id: "lpmn-p2",
        nama_jabatan: "Wakil Ketua",
        nama_pengurus: "Drs. Syamsul Bahri",
        foto_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        urutan: 2,
      },
      {
        id: "lpmn-p3",
        nama_jabatan: "Sekretaris",
        nama_pengurus: "Rahmat Hidayat, S.Pd",
        foto_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
        urutan: 3,
      },
      {
        id: "lpmn-p4",
        nama_jabatan: "Bendahara",
        nama_pengurus: "Hj. Rosmina",
        foto_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        urutan: 4,
      },
    ],
    tugas: [
      {
        id: "lpmn-t1",
        isi_tugas: "Menyusun rencana pembangunan partisipatif masyarakat nagari berdasarkan usulan aspirasi dari tiap jorong.",
        urutan: 1,
      },
      {
        id: "lpmn-t2",
        isi_tugas: "Menggerakkan swadaya dan gotong-royong masyarakat dalam pembangunan fisik maupun non-fisik.",
        urutan: 2,
      },
      {
        id: "lpmn-t3",
        isi_tugas: "Meningkatkan kualitas pelayanan publik dan pemberdayaan ekonomi keluarga berbasis potensi lokal nagari.",
        urutan: 3,
      },
      {
        id: "lpmn-t4",
        isi_tugas: "Mendampingi serta mengawasi pelaksanaan program pembangunan agar berjalan transparan dan tepat sasaran.",
        urutan: 4,
      },
    ],
    galeri: [
      {
        id: "lpmn-g1",
        foto_url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=1600",
        teks_alt: "Kegiatan Musyawarah Pembangunan Partisipatif LPMN Nagari Aia Manggih Barat",
        is_cover: true,
        urutan: 1,
      },
      {
        id: "lpmn-g2",
        foto_url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=1600",
        teks_alt: "Gotong Royong Swadaya Pembangunan Prasarana Lingkungan Bersama Warga Nagari",
        is_cover: false,
        urutan: 2,
      },
      {
        id: "lpmn-g3",
        foto_url: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=1600",
        teks_alt: "Pelatihan Pemberdayaan Usaha Ekonomi Kemasyarakatan Nagari",
        is_cover: false,
        urutan: 3,
      },
    ],
  },
}

/**
 * Membaca detail publik satu lembaga/organisasi aktif beserta pengurus, tugas, dan galerinya.
 * Mengembalikan null jika ID invalid, parent tidak aktif, atau tidak memiliki cover aktif.
 */
export async function fetchDetailLembagaOrganisasiPublik(
  id: string
): Promise<DetailLembagaOrganisasiPublik | null> {
  const normalizedSlug = id.toLowerCase().trim()

  if (!isValidLembagaOrganisasiId(id)) {
    // 1. Cek dulu apakah slug cocok dengan default fallback (misal: "lpmn")
    if (DEFAULT_LEMBAGA_DETAILS[normalizedSlug]) {
      // Coba cari di Supabase jika ada record yang cocok berdasarkan nama
      try {
        const { data: matched } = await supabase
          .from(LEMBAGA_ORGANISASI_TABLE)
          .select("id")
          .ilike("nama", `%${normalizedSlug}%`)
          .eq("is_active", true)
          .maybeSingle()

        if (matched?.id) {
          return fetchDetailLembagaOrganisasiPublik(matched.id)
        }
      } catch {
        // abaikan error Supabase dan gunakan default fallback
      }
      return DEFAULT_LEMBAGA_DETAILS[normalizedSlug]
    }
    return null
  }

  const { data: parentRaw, error: errParent } = await supabase
    .from(LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_LEMBAGA_ORGANISASI)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle()

  if (errParent) {
    throw new Error("Gagal memuat rincian publik lembaga dan organisasi.")
  }

  if (!parentRaw) {
    return null
  }

  const parent = parseLembagaOrganisasi(parentRaw)

  const [pengurusList, tugasList, galeriList] = await Promise.all([
    fetchPengurusLembagaOrganisasi(parent.id),
    fetchTugasLembagaOrganisasi(parent.id),
    fetchGaleriLembagaOrganisasi(parent.id, { includeInactive: false }),
  ])

  const hasActiveCover = galeriList.some((g) => g.is_cover && g.is_active)
  if (!hasActiveCover) {
    // Fallback jika belum ada galeri cover di Supabase
    if (parent.nama.toLowerCase().includes("lpmn")) {
      return {
        ...DEFAULT_LEMBAGA_DETAILS.lpmn,
        id: parent.id,
        nama: parent.nama,
        deskripsi: parent.deskripsi || DEFAULT_LEMBAGA_DETAILS.lpmn.deskripsi,
        alamat: parent.alamat || DEFAULT_LEMBAGA_DETAILS.lpmn.alamat,
        kontak: parent.kontak || DEFAULT_LEMBAGA_DETAILS.lpmn.kontak,
        jam_kerja: parent.jam_kerja || DEFAULT_LEMBAGA_DETAILS.lpmn.jam_kerja,
      }
    }
    return null
  }

  const pengurusPublik: PengurusLembagaOrganisasiPublik[] = pengurusList.map(
    (p) => ({
      id: p.id,
      nama_jabatan: p.nama_jabatan,
      nama_pengurus: p.nama_pengurus,
      foto_url: p.foto_url,
      urutan: p.urutan,
    })
  )

  const tugasPublik: TugasLembagaOrganisasiPublik[] = tugasList.map(
    (t) => ({
      id: t.id,
      isi_tugas: t.isi_tugas,
      urutan: t.urutan,
    })
  )

  const galeriPublik: GaleriLembagaOrganisasiPublik[] = galeriList.map(
    (g) => ({
      id: g.id,
      foto_url: g.foto_url,
      teks_alt: g.teks_alt,
      is_cover: g.is_cover,
      urutan: g.urutan,
    })
  )

  return {
    id: parent.id,
    jenis: parent.jenis,
    nama: parent.nama,
    deskripsi: parent.deskripsi,
    alamat: parent.alamat,
    kontak: parent.kontak,
    jam_kerja: parent.jam_kerja,
    pengurus: pengurusPublik,
    tugas: tugasPublik,
    galeri: galeriPublik,
  }
}

/**
 * Membaca seluruh daftar lembaga & organisasi untuk dashboard admin (termasuk draft).
 */
export async function fetchDaftarLembagaOrganisasiAdmin(): Promise<
  DaftarLembagaOrganisasiAdmin[]
> {
  const { data: parents, error: errParents } = await supabase
    .from(LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_LEMBAGA_ORGANISASI)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  if (errParents) {
    throw new Error("Gagal memuat daftar admin lembaga dan organisasi.")
  }

  if (!parents || parents.length === 0) {
    return []
  }

  const parentList = (parents as unknown[]).map(parseLembagaOrganisasi)
  const parentIds = parentList.map((p) => p.id)

  const { data: covers, error: errCovers } = await supabase
    .from(GALERI_LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_GALERI)
    .in("lembaga_organisasi_id", parentIds)
    .eq("is_cover", true)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (errCovers) {
    throw new Error("Gagal memuat foto cover admin lembaga dan organisasi.")
  }

  const coverMap = new Map<string, GaleriLembagaOrganisasi>()
  if (covers) {
    for (const raw of covers as unknown[]) {
      const parsed = parseGaleri(raw)
      if (!coverMap.has(parsed.lembaga_organisasi_id)) {
        coverMap.set(parsed.lembaga_organisasi_id, parsed)
      }
    }
  }

  return parentList.map((parent) => {
    const cover = coverMap.get(parent.id)
    return {
      ...parent,
      foto_cover_url: cover ? cover.foto_url : null,
      foto_cover_alt: cover ? cover.teks_alt : null,
    }
  })
}

/**
 * Membaca detail lengkap satu lembaga/organisasi untuk dashboard admin (termasuk galeri nonaktif).
 */
export async function fetchDetailLembagaOrganisasiAdmin(
  id: string
): Promise<DetailLembagaOrganisasiAdmin | null> {
  if (!isValidLembagaOrganisasiId(id)) {
    return null
  }

  const { data: parentRaw, error: errParent } = await supabase
    .from(LEMBAGA_ORGANISASI_TABLE)
    .select(SELECT_LEMBAGA_ORGANISASI)
    .eq("id", id)
    .maybeSingle()

  if (errParent) {
    throw new Error("Gagal memuat rincian admin lembaga dan organisasi.")
  }

  if (!parentRaw) {
    return null
  }

  const parent = parseLembagaOrganisasi(parentRaw)

  const [pengurus, tugas, galeriRaw] = await Promise.all([
    fetchPengurusLembagaOrganisasi(parent.id),
    fetchTugasLembagaOrganisasi(parent.id),
    fetchGaleriLembagaOrganisasi(parent.id, { includeInactive: true }),
  ])

  const galeri = [...galeriRaw].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    if (a.urutan !== b.urutan) return a.urutan - b.urutan
    const timeA = Date.parse(a.created_at) || 0
    const timeB = Date.parse(b.created_at) || 0
    if (timeA !== timeB) return timeA - timeB
    return a.id.localeCompare(b.id)
  })

  return {
    data: parent,
    pengurus,
    tugas,
    galeri,
  }
}
