import { createClient } from "@supabase/supabase-js"

export type PendataanSaranaPendidikan = {
  id: string
  tahun_pendataan: number
  sumber_data: string
  keterangan: string | null
  updated_at: string | null
}

export type SaranaPendidikan = {
  id: string
  pendataan_id: string
  nama_sarana: string
  tingkat_pendidikan: string
  jenis_pengelolaan: string | null
  alamat: string
  jumlah_siswa: number
  jumlah_guru: number
  jumlah_staf: number
  status_operasional: string
  nomor_kontak: string | null
  lokasi_peta: string | null
  foto_url: string | null
  keterangan: string | null
  urutan: number
  is_active: boolean
}

export type FasilitasSaranaPendidikan = {
  id: string
  sarana_pendidikan_id: string
  nama_fasilitas: string
  jumlah: number
  urutan: number
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type TingkatPendidikanItem = {
  slug: string
  label: string
  dbValue: string
  deskripsi: string
}

export const LIST_TINGKAT_PENDIDIKAN: TingkatPendidikanItem[] = [
  { slug: "paud", label: "PAUD", dbValue: "PAUD", deskripsi: "Pendidikan Anak Usia Dini" },
  { slug: "tk", label: "TK / RA", dbValue: "TK", deskripsi: "Taman Kanak-Kanak / Raudhatul Athfal" },
  { slug: "sd", label: "SD / MI", dbValue: "SD", deskripsi: "Sekolah Dasar / Madrasah Ibtidaiyah" },
  { slug: "smp", label: "SMP / MTs", dbValue: "SMP", deskripsi: "Sekolah Menengah Pertama / Madrasah Tsanawiyah" },
  { slug: "sma", label: "SMA / MA", dbValue: "SMA", deskripsi: "Sekolah Menengah Atas / Madrasah Aliyah" },
  { slug: "smk", label: "SMK", dbValue: "SMK", deskripsi: "Sekolah Menengah Kejuruan" },
  { slug: "slb", label: "SLB", dbValue: "SLB", deskripsi: "Sekolah Luar Biasa" },
  { slug: "lainnya", label: "Lainnya", dbValue: "Lainnya", deskripsi: "Sarana Pendidikan Lainnya" },
]

export function getTingkatBySlug(slug: string): TingkatPendidikanItem | undefined {
  if (!slug) return undefined
  const normalizedSlug = slug.toLowerCase().trim()
  return LIST_TINGKAT_PENDIDIKAN.find((item) => item.slug === normalizedSlug)
}

export function getSlugByTingkat(dbValue: string): string {
  if (!dbValue) return "lainnya"
  const item = LIST_TINGKAT_PENDIDIKAN.find((t) => t.dbValue.toLowerCase() === dbValue.toLowerCase())
  return item ? item.slug : dbValue.toLowerCase().trim()
}

export function formatAngka(nilai: number | null | undefined): string {
  return Number(nilai || 0).toLocaleString("id-ID")
}

export function formatStatusOperasional(nilai: string): string {
  const daftarStatus: Record<string, string> = {
    aktif: "Aktif",
    tidak_aktif: "Tidak Aktif",
    dalam_pembangunan: "Dalam Pembangunan",
    lainnya: "Lainnya",
  }
  return daftarStatus[nilai] || nilai
}

export function kelasStatusOperasional(nilai: string): string {
  if (nilai === "aktif") {
    return "bg-green-100 text-green-700 border border-green-200"
  }
  if (nilai === "dalam_pembangunan") {
    return "bg-yellow-100 text-yellow-700 border border-yellow-200"
  }
  if (nilai === "tidak_aktif") {
    return "bg-red-100 text-red-700 border border-red-200"
  }
  return "bg-gray-100 text-gray-700 border border-gray-200"
}

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  })
}

export async function getAktifPendataanDanSarana(): Promise<{
  pendataan: PendataanSaranaPendidikan | null
  sarana: SaranaPendidikan[]
  error: string | null
}> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return {
      pendataan: null,
      sarana: [],
      error: "Konfigurasi Supabase belum tersedia.",
    }
  }

  try {
    const { data: dataPendataan, error: pendataanError } = await supabase
      .from("pendataan_sarana_pendidikan")
      .select("id, tahun_pendataan, sumber_data, keterangan, updated_at")
      .eq("status_publikasi", "dipublikasikan")
      .eq("is_active", true)
      .order("tahun_pendataan", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendataanError) {
      console.error("Gagal mengambil pendataan sarana pendidikan:", pendataanError)
      return { pendataan: null, sarana: [], error: pendataanError.message }
    }

    if (!dataPendataan) {
      return { pendataan: null, sarana: [], error: null }
    }

    const pendataan = dataPendataan as PendataanSaranaPendidikan

    const { data: dataSarana, error: saranaError } = await supabase
      .from("sarana_pendidikan")
      .select(`
        id,
        pendataan_id,
        nama_sarana,
        tingkat_pendidikan,
        jenis_pengelolaan,
        alamat,
        jumlah_siswa,
        jumlah_guru,
        jumlah_staf,
        status_operasional,
        nomor_kontak,
        lokasi_peta,
        foto_url,
        keterangan,
        urutan,
        is_active
      `)
      .eq("pendataan_id", pendataan.id)
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .order("nama_sarana", { ascending: true })

    if (saranaError) {
      console.error("Gagal mengambil daftar sarana pendidikan:", saranaError)
      return { pendataan, sarana: [], error: saranaError.message }
    }

    const saranaMapped = ((dataSarana || []) as SaranaPendidikan[]).map((item) => ({
      ...item,
      jumlah_siswa: Number(item.jumlah_siswa || 0),
      jumlah_guru: Number(item.jumlah_guru || 0),
      jumlah_staf: Number(item.jumlah_staf || 0),
    })) as SaranaPendidikan[]

    return {
      pendataan,
      sarana: saranaMapped,
      error: null,
    }
  } catch (err: unknown) {
    console.error("Kesalahan membaca data sarana pendidikan:", err)
    return {
      pendataan: null,
      sarana: [],
      error: "Terjadi kesalahan saat membaca data sarana pendidikan.",
    }
  }
}

export async function getFasilitasBySaranaId(
  saranaId: string
): Promise<{
  fasilitas: FasilitasSaranaPendidikan[]
  error: string | null
}> {
  if (!saranaId) {
    return { fasilitas: [], error: null }
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return {
      fasilitas: [],
      error: "Konfigurasi Supabase belum tersedia.",
    }
  }

  try {
    const { data, error } = await supabase
      .from("fasilitas_sarana_pendidikan")
      .select(`
        id,
        sarana_pendidikan_id,
        nama_fasilitas,
        jumlah,
        urutan,
        is_active,
        created_at,
        updated_at
      `)
      .eq("sarana_pendidikan_id", saranaId)
      .eq("is_active", true)
      .gte("jumlah", 1)
      .order("urutan", { ascending: true })
      .order("nama_fasilitas", { ascending: true })

    if (error) {
      console.error("Gagal mengambil fasilitas sarana pendidikan:", error)
      return { fasilitas: [], error: error.message }
    }

    return {
      fasilitas: (data as FasilitasSaranaPendidikan[]) || [],
      error: null,
    }
  } catch (err: unknown) {
    console.error("Kesalahan membaca data fasilitas sarana pendidikan:", err)
    return {
      fasilitas: [],
      error: "Terjadi kesalahan saat membaca data fasilitas.",
    }
  }
}
