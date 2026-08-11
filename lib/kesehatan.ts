import { supabase } from "@/lib/supabase"

export const BUCKET_FOTO_KESEHATAN = "foto-sarana-kesehatan"

export type JenisSlugKesehatan =
  | "puskesmas"
  | "pustu"
  | "posyandu"
  | "praktik-bidan"
  | "polindes"
  | "lainnya"

export interface JenisSaranaOption {
  slug: JenisSlugKesehatan
  label: string
}

export const PILIHAN_JENIS_SARANA: JenisSaranaOption[] = [
  { slug: "puskesmas", label: "Puskesmas" },
  { slug: "pustu", label: "Pustu (Puskesmas Pembantu)" },
  { slug: "posyandu", label: "Posyandu" },
  { slug: "praktik-bidan", label: "Praktik Bidan" },
  { slug: "polindes", label: "Polindes" },
  { slug: "lainnya", label: "Sarana Kesehatan Lainnya" },
]

export function getLabelJenisSarana(slug: string): string {
  const opsi = PILIHAN_JENIS_SARANA.find((item) => item.slug === slug)
  return opsi ? opsi.label : slug
}

export interface PendataanKesehatan {
  id: string
  tahun_pendataan: number
  sumber_data: string
  wc_septic_tanah: number
  wc_tanpa_septic: number
  mck_sungai: number
  status_publikasi: "draft" | "dipublikasikan"
  is_active: boolean
  keterangan: string | null
  created_at: string
  updated_at: string
}

export interface SaranaKesehatan {
  id: string
  pendataan_id: string
  nama_sarana: string
  jenis_slug: JenisSlugKesehatan
  alamat: string
  status_operasional: "aktif" | "tidak_aktif" | "dalam_pembangunan" | "lainnya"
  nomor_kontak: string | null
  tautan_peta: string | null
  foto_url: string | null
  storage_path: string | null
  keterangan: string | null
  urutan: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FasilitasSaranaKesehatan {
  id: string
  sarana_kesehatan_id: string
  nama_fasilitas: string
  jumlah: number
  urutan: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TenagaKesehatanSarana {
  id: string
  sarana_kesehatan_id: string
  jenis_tenaga: string
  jumlah: number
  urutan: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IndikatorTambahanKesehatan {
  id: string
  sarana_kesehatan_id: string
  nama_indikator: string
  nilai_indikator: string
  satuan?: string | null
  keterangan?: string | null
  urutan: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Mengambil data pendataan kesehatan yang aktif dan dipublikasikan.
 */
export async function fetchPendataanKesehatanAktif(): Promise<PendataanKesehatan | null> {
  const { data, error } = await supabase
    .from("pendataan_kesehatan")
    .select("*")
    .eq("is_active", true)
    .eq("status_publikasi", "dipublikasikan")
    .maybeSingle()

  if (error) {
    console.error("fetchPendataanKesehatanAktif error:", error)
    return null
  }

  return data || null
}

/**
 * Mengambil daftar sarana kesehatan publik berdasarkan jenis_slug
 * pada periode pendataan aktif dan dipublikasikan.
 */
export async function fetchSaranaKesehatanByJenis(
  jenisSlug: string
): Promise<SaranaKesehatan[]> {
  const pendataanAktif = await fetchPendataanKesehatanAktif()
  if (!pendataanAktif) {
    return []
  }

  const { data, error } = await supabase
    .from("sarana_kesehatan")
    .select("*")
    .eq("pendataan_id", pendataanAktif.id)
    .eq("jenis_slug", jenisSlug)
    .eq("is_active", true)
    .order("urutan", { ascending: true })
    .order("nama_sarana", { ascending: true })

  if (error) {
    console.error("fetchSaranaKesehatanByJenis error:", error)
    return []
  }

  return data || []
}

/**
 * Mengambil detail satu sarana kesehatan publik berdasarkan saranaId.
 */
export async function fetchDetailSaranaKesehatan(
  saranaId: string
): Promise<SaranaKesehatan | null> {
  if (!saranaId) return null

  const pendataanAktif = await fetchPendataanKesehatanAktif()
  if (!pendataanAktif) {
    return null
  }

  const { data, error } = await supabase
    .from("sarana_kesehatan")
    .select("*")
    .eq("id", saranaId)
    .eq("pendataan_id", pendataanAktif.id)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    console.error("fetchDetailSaranaKesehatan error:", error)
    return null
  }

  return data || null
}

/**
 * Mengambil daftar fasilitas internal suatu sarana kesehatan publik.
 */
export async function fetchFasilitasKesehatanBySaranaId(
  saranaId: string
): Promise<FasilitasSaranaKesehatan[]> {
  if (!saranaId) return []

  const detailSarana = await fetchDetailSaranaKesehatan(saranaId)
  if (!detailSarana) return []

  const { data, error } = await supabase
    .from("fasilitas_sarana_kesehatan")
    .select("*")
    .eq("sarana_kesehatan_id", saranaId)
    .eq("is_active", true)
    .gte("jumlah", 1)
    .order("urutan", { ascending: true })
    .order("nama_fasilitas", { ascending: true })

  if (error) {
    console.error("fetchFasilitasKesehatanBySaranaId error:", error)
    return []
  }

  return data || []
}

/**
 * Mengambil rincian tenaga kesehatan suatu sarana kesehatan publik.
 */
export async function fetchTenagaKesehatanBySaranaId(
  saranaId: string
): Promise<TenagaKesehatanSarana[]> {
  if (!saranaId) return []

  const detailSarana = await fetchDetailSaranaKesehatan(saranaId)
  if (!detailSarana) return []

  const { data, error } = await supabase
    .from("tenaga_kesehatan_sarana")
    .select("*")
    .eq("sarana_kesehatan_id", saranaId)
    .eq("is_active", true)
    .gte("jumlah", 1)
    .order("urutan", { ascending: true })
    .order("jenis_tenaga", { ascending: true })

  if (error) {
    console.error("fetchTenagaKesehatanBySaranaId error:", error)
    return []
  }

  return data || []
}

/**
 * Mengambil daftar indikator tambahan suatu sarana kesehatan publik.
 */
export async function fetchIndikatorTambahanBySaranaId(
  saranaId: string
): Promise<IndikatorTambahanKesehatan[]> {
  if (!saranaId) return []

  const detailSarana = await fetchDetailSaranaKesehatan(saranaId)
  if (!detailSarana) return []

  const { data, error } = await supabase
    .from("indikator_tambahan_kesehatan")
    .select("*")
    .eq("sarana_kesehatan_id", saranaId)
    .eq("is_active", true)
    .order("urutan", { ascending: true })
    .order("nama_indikator", { ascending: true })

  if (error) {
    console.error("fetchIndikatorTambahanBySaranaId error:", error)
    return []
  }

  return data || []
}

/**
 * Menghitung total Kader Posyandu publik dengan filter ketat:
 * - lower(trim(jenis_tenaga)) = 'kader posyandu'
 * - tenaga_kesehatan_sarana.is_active = true
 * - sarana_kesehatan.is_active = true
 * - pendataan_kesehatan.is_active = true AND status_publikasi = 'dipublikasikan'
 */
export async function fetchHitungKaderPosyanduAktif(): Promise<number> {
  const pendataanAktif = await fetchPendataanKesehatanAktif()
  if (!pendataanAktif) {
    return 0
  }

  const { data: listSaranaAktif, error: errSarana } = await supabase
    .from("sarana_kesehatan")
    .select("id")
    .eq("pendataan_id", pendataanAktif.id)
    .eq("is_active", true)

  if (errSarana || !listSaranaAktif || listSaranaAktif.length === 0) {
    return 0
  }

  const saranaIds = listSaranaAktif.map((item) => item.id)

  const { data: listTenaga, error: errTenaga } = await supabase
    .from("tenaga_kesehatan_sarana")
    .select("jenis_tenaga, jumlah")
    .in("sarana_kesehatan_id", saranaIds)
    .eq("is_active", true)

  if (errTenaga || !listTenaga) {
    return 0
  }

  const totalKader = listTenaga
    .filter(
      (t) => (t.jenis_tenaga || "").trim().toLowerCase() === "kader posyandu"
    )
    .reduce((total, t) => total + (Number(t.jumlah) || 0), 0)

  return totalKader
}

export interface RingkasanKesehatanBeranda {
  pendataan: PendataanKesehatan | null
  jumlahPerJenis: Record<JenisSlugKesehatan, number>
  jumlahKaderPosyandu: number
  error: string | null
}

/**
 * Mengambil ringkasan data kesehatan publik yang aktif dan dipublikasikan satu kali
 * untuk ditampilkan di komponen beranda (KesehatanDinamis.tsx).
 */
export async function fetchRingkasanKesehatanAktif(): Promise<RingkasanKesehatanBeranda> {
  try {
    const pendataanAktif = await fetchPendataanKesehatanAktif()
    if (!pendataanAktif) {
      return {
        pendataan: null,
        jumlahPerJenis: {
          puskesmas: 0,
          pustu: 0,
          posyandu: 0,
          "praktik-bidan": 0,
          polindes: 0,
          lainnya: 0,
        },
        jumlahKaderPosyandu: 0,
        error: null,
      }
    }

    const { data: listSarana, error: errSarana } = await supabase
      .from("sarana_kesehatan")
      .select("id, jenis_slug")
      .eq("pendataan_id", pendataanAktif.id)
      .eq("is_active", true)

    if (errSarana) {
      console.error("fetchRingkasanKesehatanAktif errSarana:", errSarana)
      return {
        pendataan: pendataanAktif,
        jumlahPerJenis: {
          puskesmas: 0,
          pustu: 0,
          posyandu: 0,
          "praktik-bidan": 0,
          polindes: 0,
          lainnya: 0,
        },
        jumlahKaderPosyandu: 0,
        error: errSarana.message,
      }
    }

    const saranaList = listSarana || []
    const saranaIds = saranaList.map((item) => item.id)

    const jumlahPerJenis: Record<JenisSlugKesehatan, number> = {
      puskesmas: 0,
      pustu: 0,
      posyandu: 0,
      "praktik-bidan": 0,
      polindes: 0,
      lainnya: 0,
    }

    for (const item of saranaList) {
      const slug = item.jenis_slug as JenisSlugKesehatan
      if (slug in jumlahPerJenis) {
        jumlahPerJenis[slug] = (jumlahPerJenis[slug] || 0) + 1
      }
    }

    let jumlahKaderPosyandu = 0

    if (saranaIds.length > 0) {
      const { data: listTenaga, error: errTenaga } = await supabase
        .from("tenaga_kesehatan_sarana")
        .select("jenis_tenaga, jumlah")
        .in("sarana_kesehatan_id", saranaIds)
        .eq("is_active", true)

      if (!errTenaga && listTenaga) {
        jumlahKaderPosyandu = listTenaga
          .filter(
            (t) => (t.jenis_tenaga || "").trim().toLowerCase() === "kader posyandu"
          )
          .reduce((total, t) => total + (Number(t.jumlah) || 0), 0)
      }
    }

    return {
      pendataan: pendataanAktif,
      jumlahPerJenis,
      jumlahKaderPosyandu,
      error: null,
    }
  } catch (err: unknown) {
    console.error("fetchRingkasanKesehatanAktif catch error:", err)
    return {
      pendataan: null,
      jumlahPerJenis: {
        puskesmas: 0,
        pustu: 0,
        posyandu: 0,
        "praktik-bidan": 0,
        polindes: 0,
        lainnya: 0,
      },
      jumlahKaderPosyandu: 0,
      error: err instanceof Error ? err.message : String(err) || "Gagal membaca data kesehatan.",
    }
  }
}
