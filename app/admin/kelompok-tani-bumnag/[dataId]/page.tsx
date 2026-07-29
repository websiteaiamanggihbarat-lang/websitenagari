"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_KELOMPOK_TANI_BUMNAG,
  GaleriKelompokTaniBumnag,
  JenisItemProdukUsaha,
  KelompokTaniBumnag,
  PILIHAN_JENIS_PRODUK_USAHA,
  ProdukUsahaKelompokTaniBumnag,
  getLabelBidang,
  getLabelJenisEntitas,
  getLabelJenisItem,
  getLabelPimpinan,
} from "@/lib/kelompokTaniBumnag"

interface PageProps {
  params: Promise<{ dataId: string }>
}

interface UploadQueueItem {
  id: string
  file: File
  previewUrl: string
  teks_alt: string
  caption: string
  urutan: number
  errorValidation?: string
}

interface UploadReportItem {
  fileName: string
  status: "sukses" | "gagal"
  alasan?: string
  rollbackStorage?: "berhasil" | "gagal" | "tidak_perlu"
}

interface FormProdukState {
  nama_produk_usaha: string
  jenis_item: JenisItemProdukUsaha
  deskripsi: string
  urutan: string
}

const FORM_PRODUK_AWAL: FormProdukState = {
  nama_produk_usaha: "",
  jenis_item: "produk_hasil",
  deskripsi: "",
  urutan: "0",
}

interface SupabaseErrorLike {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

function formatSupabaseError(
  err: SupabaseErrorLike | null | undefined,
  defaultMsg: string
): string {
  if (!err) return defaultMsg

  const code = err.code || "UNKNOWN"
  const msg = err.message || defaultMsg
  const details = err.details
  const hint = err.hint

  let specificAdvice = ""
  if (code === "23505") {
    specificAdvice =
      " Terjadi duplikasi data (misal: nama produk duplikat dalam satu entitas, path galeri duplikat, atau terdapat dua cover aktif)."
  } else if (code === "23514") {
    specificAdvice =
      " Data melanggar aturan validasi database (check constraint). Pastikan bidang wajib diisi, urutan >= 0, teks alt diisi, dan aktivasi sudah memiliki cover."
  } else if (code === "23503") {
    specificAdvice = " Data utama tidak ditemukan atau foreign key tidak valid."
  } else if (code === "42501") {
    specificAdvice =
      " Akses ditolak oleh Row Level Security (RLS) atau kebijakan hak akses Supabase."
  } else if (code === "PGRST204" || code === "42703") {
    specificAdvice = " Terjadi ketidaksesuaian nama kolom database."
  } else if (code === "42P01") {
    specificAdvice =
      " Tabel belum dibuat atau belum tersedia di Supabase Development."
  }

  let formatted = `${defaultMsg}: ${msg}${specificAdvice}`
  formatted += ` (Code: ${code}`
  if (details) formatted += ` | Details: ${details}`
  if (hint) formatted += ` | Hint: ${hint}`
  formatted += `)`

  return formatted
}

function buatNamaFileAman(namaFile: string): string {
  const parts = (namaFile || "foto").split(".")
  const ext = parts.length > 1 ? parts.pop() : ""
  const baseName = parts.join(".")

  const namaClean = baseName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")

  const extClean = ext ? ext.toLowerCase().replace(/[^a-z0-9]/g, "") : ""
  return extClean ? `${namaClean}.${extClean}` : namaClean
}

export default function AdminDetailKelompokTaniBumnagPage({ params }: PageProps) {
  const routeParams = useParams()
  const unwrappedParams = typeof use === "function" && params ? use(params) : null
  const dataId =
    unwrappedParams?.dataId ||
    (Array.isArray(routeParams?.dataId)
      ? routeParams.dataId[0]
      : routeParams?.dataId) ||
    ""

  const [entitas, setEntitas] = useState<KelompokTaniBumnag | null>(null)
  const [galeriList, setGaleriList] = useState<GaleriKelompokTaniBumnag[]>([])
  const [produkList, setProdukList] = useState<ProdukUsahaKelompokTaniBumnag[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  // Multi-upload queue & report state
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [uploadReports, setUploadReports] = useState<UploadReportItem[]>([])

  // Editing state for existing photo metadata
  const [editingPhotoState, setEditingPhotoState] = useState<
    Record<string, { caption: string; teks_alt: string; urutan: number }>
  >({})

  // Form state for produk/unit usaha
  const [isFormProdukOpen, setIsFormProdukOpen] = useState(false)
  const [editingProdukId, setEditingProdukId] = useState<string | null>(null)
  const [formProdukData, setFormProdukData] = useState<FormProdukState>(FORM_PRODUK_AWAL)
  const [loadingProdukForm, setLoadingProdukForm] = useState(false)

  const periksaUserAuth = async (): Promise<boolean> => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setPesanError("Sesi login Anda telah berakhir atau belum terautentikasi. Silakan login kembali.")
      return false
    }
    return true
  }

  const fetchEntitasDetail = async () => {
    if (!dataId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const valid = await periksaUserAuth()
    if (!valid) {
      setLoading(false)
      return
    }

    try {
      // 1. Baca data utama entitas
      const { data: dataEntitas, error: errEntitas } = await supabase
        .from("kelompok_tani_bumnag")
        .select("*")
        .eq("id", dataId)
        .maybeSingle()

      if (errEntitas || !dataEntitas) {
        if (errEntitas) {
          setPesanError(formatSupabaseError(errEntitas, "Gagal membaca data utama entitas"))
        }
        setEntitas(null)
        setLoading(false)
        return
      }

      setEntitas(dataEntitas as KelompokTaniBumnag)

      // 2. Baca seluruh galeri foto (termasuk nonaktif)
      const { data: dataGaleri, error: errGaleri } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .select("*")
        .eq("kelompok_tani_bumnag_id", dataId)

      if (errGaleri) {
        setPesanError(formatSupabaseError(errGaleri, "Gagal membaca galeri foto"))
      } else {
        const listRaw = (dataGaleri as GaleriKelompokTaniBumnag[]) || []
        // Urutkan: is_cover DESC -> urutan ASC -> created_at DESC
        const listSorted = [...listRaw].sort((a, b) => {
          if (a.is_cover && !b.is_cover) return -1
          if (!a.is_cover && b.is_cover) return 1
          if (a.urutan !== b.urutan) return a.urutan - b.urutan
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA
        })
        setGaleriList(listSorted)

        // Inisialisasi state edit metadata per foto
        const stateMap: Record<string, { caption: string; teks_alt: string; urutan: number }> = {}
        for (const item of listSorted) {
          stateMap[item.id] = {
            caption: item.caption || "",
            teks_alt: item.teks_alt || "",
            urutan: item.urutan ?? 0,
          }
        }
        setEditingPhotoState(stateMap)
      }

      // 3. Baca seluruh produk/unit usaha (termasuk nonaktif)
      const { data: dataProduk, error: errProduk } = await supabase
        .from("produk_usaha_kelompok_tani_bumnag")
        .select("*")
        .eq("kelompok_tani_bumnag_id", dataId)
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: false })

      if (errProduk) {
        setPesanError(formatSupabaseError(errProduk, "Gagal membaca produk/unit usaha"))
      } else {
        setProdukList((dataProduk as ProdukUsahaKelompokTaniBumnag[]) || [])
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan memuat detail entitas"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntitasDetail()
  }, [dataId])

  // --- Multi-Upload Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const newQueue: UploadQueueItem[] = []

    Array.from(selectedFiles).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const previewUrl = URL.createObjectURL(file)
      let errorValidation: string | undefined

      // Validasi MIME type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        errorValidation = `Format file ${file.name} tidak didukung. Hanya JPEG, PNG, dan WebP yang diperbolehkan.`
      }

      // Validasi Ukuran File (Maksimal 2 MB = 2097152 bytes)
      if (file.size > 2097152) {
        errorValidation = `Ukuran file ${file.name} ( ${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas 2 MB.`
      }

      const defaultAlt = file.name.split(".")[0].replace(/[-_]/g, " ")

      newQueue.push({
        id,
        file,
        previewUrl,
        teks_alt: defaultAlt,
        caption: "",
        urutan: galeriList.length + newQueue.length,
        errorValidation,
      })
    })

    setUploadQueue((prev) => [...prev, ...newQueue])
    if (e.target) {
      e.target.value = ""
    }
  }

  const handleQueueChange = (
    id: string,
    field: "teks_alt" | "caption" | "urutan",
    value: string | number
  ) => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === "urutan" ? Math.max(0, parseInt(String(value || "0"), 10) || 0) : String(value),
          }
        }
        return item
      })
    )
  }

  const handleRemoveQueue = (id: string) => {
    setUploadQueue((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleProcessUploadQueue = async () => {
    if (uploadQueue.length === 0 || isUploading) return

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    // Validasi input queue: teks_alt wajib
    const hasEmptyAlt = uploadQueue.some((item) => !item.teks_alt.trim())
    if (hasEmptyAlt) {
      setPesanError("Teks alternatif (alt) wajib diisi untuk seluruh foto yang akan diunggah.")
      return
    }

    const validItems = uploadQueue.filter((item) => !item.errorValidation)
    if (validItems.length === 0) {
      setPesanError("Tidak ada file valid yang dapat diunggah.")
      return
    }

    setIsUploading(true)
    setPesanSukses(null)
    setPesanError(null)
    setUploadReports([])

    const reports: UploadReportItem[] = []

    for (const item of validItems) {
      const namaAman = buatNamaFileAman(item.file.name)
      const timestamp = Date.now()
      const randomId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      const storagePath = `kelompok-tani-bumnag/${dataId}/${timestamp}-${randomId}-${namaAman}`

      // Step 1: Upload ke Storage
      const { error: errUpload } = await supabase.storage
        .from(BUCKET_KELOMPOK_TANI_BUMNAG)
        .upload(storagePath, item.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: item.file.type || "image/jpeg",
        })

      if (errUpload) {
        console.warn("Gagal unggah Storage:", errUpload)
        reports.push({
          fileName: item.file.name,
          status: "gagal",
          alasan: formatSupabaseError(errUpload, "Gagal unggah Storage"),
          rollbackStorage: "tidak_perlu",
        })
        continue
      }

      // Step 2: Ambil Public URL
      const { data: publicData } = supabase.storage
        .from(BUCKET_KELOMPOK_TANI_BUMNAG)
        .getPublicUrl(storagePath)

      const fotoUrl = publicData?.publicUrl || ""

      // Step 3: Insert record ke database galeri_kelompok_tani_bumnag
      const { error: errInsert } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .insert({
          kelompok_tani_bumnag_id: dataId,
          foto_url: fotoUrl,
          storage_path: storagePath,
          caption: item.caption.trim() || null,
          teks_alt: item.teks_alt.trim(),
          is_cover: false,
          is_active: true,
          urutan: Math.max(0, item.urutan || 0),
        })

      if (errInsert) {
        console.warn("Gagal simpan DB galeri, melakukan rollback storage:", errInsert)
        // Rollback Hapus file Storage agar tidak terjadi file yatim
        const { error: errRollback } = await supabase.storage
          .from(BUCKET_KELOMPOK_TANI_BUMNAG)
          .remove([storagePath])

        reports.push({
          fileName: item.file.name,
          status: "gagal",
          alasan: formatSupabaseError(errInsert, "Gagal simpan database"),
          rollbackStorage: errRollback ? "gagal" : "berhasil",
        })
      } else {
        reports.push({
          fileName: item.file.name,
          status: "sukses",
          rollbackStorage: "tidak_perlu",
        })
      }
    }

    setUploadReports(reports)
    setUploadQueue([])
    setIsUploading(false)
    await fetchEntitasDetail()
  }

  // --- Handlers Metadata Foto Galeri ---
  const handlePhotoStateChange = (
    id: string,
    field: "caption" | "teks_alt" | "urutan",
    value: string | number
  ) => {
    setEditingPhotoState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "urutan" ? Math.max(0, parseInt(String(value || "0"), 10) || 0) : String(value),
      },
    }))
  }

  const handleSimpanMetadataPhoto = async (item: GaleriKelompokTaniBumnag) => {
    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    const currentState = editingPhotoState[item.id]
    if (!currentState) return

    const altClean = currentState.teks_alt.trim()
    if (!altClean) {
      setPesanError("Teks alternatif (alt) wajib diisi.")
      return
    }

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      const { error: errUpdate } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({
          caption: currentState.caption.trim() || null,
          teks_alt: altClean,
          urutan: Math.max(0, currentState.urutan || 0),
        })
        .eq("id", item.id)

      if (errUpdate) {
        setPesanError(formatSupabaseError(errUpdate, "Gagal memperbarui metadata foto"))
      } else {
        setPesanSukses("Metadata foto berhasil diperbarui.")
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan memperbarui metadata"))
    } finally {
      setActionLoadingId(null)
    }
  }

  // --- Handlers Status Cover & Aktif Galeri ---
  const handleSetCover = async (item: GaleriKelompokTaniBumnag) => {
    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      // 1. Nonaktifkan status is_cover dari cover lama terlebih dahulu untuk mencegah 2 cover aktif
      await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({ is_cover: false })
        .eq("kelompok_tani_bumnag_id", dataId)
        .eq("is_cover", true)

      // 2. Tetapkan foto baru sebagai is_cover = true & is_active = true
      const { error: errSet } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({
          is_cover: true,
          is_active: true,
        })
        .eq("id", item.id)

      if (errSet) {
        setPesanError(formatSupabaseError(errSet, "Gagal menetapkan foto cover utama"))
      } else {
        setPesanSukses("Foto cover utama berhasil diperbarui. Anda sekarang dapat mengaktifkan data utama entitas.")
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan menetapkan cover"))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleAktifGaleri = async (item: GaleriKelompokTaniBumnag) => {
    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      const targetIsActive = !item.is_active

      // Keamanan Cover Aktif Terakhir:
      // Jika mencoba menonaktifkan foto cover yang sedang aktif, dan entitas utama sedang aktif
      if (!targetIsActive && item.is_cover && entitas?.is_active) {
        const otherActiveCovers = galeriList.filter(
          (g) => g.id !== item.id && g.is_cover && g.is_active
        )

        if (otherActiveCovers.length === 0) {
          // Nonaktifkan entitas utama terlebih dahulu
          const { error: errParent } = await supabase
            .from("kelompok_tani_bumnag")
            .update({ is_active: false })
            .eq("id", dataId)

          if (errParent) {
            setPesanError(
              formatSupabaseError(
                errParent,
                "Gagal menonaktifkan entitas induk sebelum menonaktifkan foto cover terakhir"
              )
            )
            setActionLoadingId(null)
            return
          }
        }
      }

      const { error: errUpdate } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({ is_active: targetIsActive })
        .eq("id", item.id)

      if (errUpdate) {
        setPesanError(formatSupabaseError(errUpdate, "Gagal mengubah status foto galeri"))
      } else {
        setPesanSukses(`Status foto galeri berhasil diubah menjadi ${targetIsActive ? "Aktif" : "Nonaktif"}.`)
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan ubah status foto"))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleHapusGaleri = async (item: GaleriKelompokTaniBumnag) => {
    const konfirmasi = window.confirm("Apakah Anda yakin ingin menghapus foto ini dari galeri dan Storage?")
    if (!konfirmasi) return

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      // Keamanan Cover Aktif Terakhir:
      if (item.is_cover && item.is_active && entitas?.is_active) {
        const otherActiveCovers = galeriList.filter(
          (g) => g.id !== item.id && g.is_cover && g.is_active
        )

        if (otherActiveCovers.length === 0) {
          // Nonaktifkan entitas utama terlebih dahulu
          const { error: errParent } = await supabase
            .from("kelompok_tani_bumnag")
            .update({ is_active: false })
            .eq("id", dataId)

          if (errParent) {
            setPesanError(
              formatSupabaseError(
                errParent,
                "Gagal menonaktifkan entitas induk sebelum menghapus foto cover terakhir"
              )
            )
            setActionLoadingId(null)
            return
          }
        }
      }

      // Step 1: Hapus file dari Storage berdasarkan storage_path
      if (item.storage_path) {
        const { error: errStorage } = await supabase.storage
          .from(BUCKET_KELOMPOK_TANI_BUMNAG)
          .remove([item.storage_path])

        if (errStorage) {
          setPesanError(
            formatSupabaseError(
              errStorage,
              "Gagal menghapus file dari Storage. Record galeri database tidak dihapus demi menjaga konsistensi."
            )
          )
          setActionLoadingId(null)
          return
        }
      }

      // Step 2: Hapus record dari database galeri_kelompok_tani_bumnag
      const { error: errDeleteDB } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .delete()
        .eq("id", item.id)

      if (errDeleteDB) {
        setPesanError(
          formatSupabaseError(
            errDeleteDB,
            "PERINGATAN KONSISTENSI: File gambar di Storage telah terhapus, namun gagal menghapus record database galeri."
          )
        )
      } else {
        setPesanSukses("Foto galeri berhasil dihapus dari database dan Storage.")
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan hapus foto"))
    } finally {
      setActionLoadingId(null)
    }
  }

  // --- Handlers Form Produk / Unit Usaha ---
  const handleOpenTambahProduk = () => {
    setEditingProdukId(null)
    setFormProdukData(FORM_PRODUK_AWAL)
    setIsFormProdukOpen(true)
    setPesanSukses(null)
    setPesanError(null)
  }

  const handleOpenEditProduk = (item: ProdukUsahaKelompokTaniBumnag) => {
    setEditingProdukId(item.id)
    setFormProdukData({
      nama_produk_usaha: item.nama_produk_usaha || "",
      jenis_item: item.jenis_item || "produk_hasil",
      deskripsi: item.deskripsi || "",
      urutan: (item.urutan ?? 0).toString(),
    })
    setIsFormProdukOpen(true)
    setPesanSukses(null)
    setPesanError(null)
  }

  const handleProdukFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingProdukForm) return

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setPesanSukses(null)
    setPesanError(null)

    const namaClean = formProdukData.nama_produk_usaha.trim()
    if (!namaClean) {
      setPesanError("Nama produk / unit usaha / jasa wajib diisi.")
      return
    }

    const numUrutan = Math.max(0, parseInt(formProdukData.urutan || "0", 10) || 0)

    const payload = {
      kelompok_tani_bumnag_id: dataId,
      nama_produk_usaha: namaClean,
      jenis_item: formProdukData.jenis_item,
      deskripsi: formProdukData.deskripsi.trim() || null,
      urutan: numUrutan,
    }

    setLoadingProdukForm(true)

    try {
      if (editingProdukId) {
        const { error: errUpdate } = await supabase
          .from("produk_usaha_kelompok_tani_bumnag")
          .update(payload)
          .eq("id", editingProdukId)

        if (errUpdate) {
          setPesanError(formatSupabaseError(errUpdate, "Gagal memperbarui produk/unit usaha"))
          setLoadingProdukForm(false)
          return
        }

        setPesanSukses(`Produk/unit usaha "${namaClean}" berhasil diperbarui.`)
        setIsFormProdukOpen(false)
        setEditingProdukId(null)
        setFormProdukData(FORM_PRODUK_AWAL)
        await fetchEntitasDetail()
      } else {
        const { error: errInsert } = await supabase
          .from("produk_usaha_kelompok_tani_bumnag")
          .insert({
            ...payload,
            is_active: true,
          })

        if (errInsert) {
          setPesanError(formatSupabaseError(errInsert, "Gagal menambahkan produk/unit usaha"))
          setLoadingProdukForm(false)
          return
        }

        setPesanSukses(`Produk/unit usaha "${namaClean}" berhasil ditambahkan.`)
        setIsFormProdukOpen(false)
        setFormProdukData(FORM_PRODUK_AWAL)
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan simpan produk"))
    } finally {
      setLoadingProdukForm(false)
    }
  }

  const handleToggleAktifProduk = async (item: ProdukUsahaKelompokTaniBumnag) => {
    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      const targetIsActive = !item.is_active
      const { error: errUpdate } = await supabase
        .from("produk_usaha_kelompok_tani_bumnag")
        .update({ is_active: targetIsActive })
        .eq("id", item.id)

      if (errUpdate) {
        setPesanError(formatSupabaseError(errUpdate, "Gagal mengubah status produk"))
      } else {
        setPesanSukses(`Status produk "${item.nama_produk_usaha}" berhasil diubah menjadi ${targetIsActive ? "Aktif" : "Nonaktif"}.`)
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan ubah status produk"))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleHapusProduk = async (item: ProdukUsahaKelompokTaniBumnag) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus produk/unit usaha "${item.nama_produk_usaha}"?`)
    if (!konfirmasi) return

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      const { error: errDelete } = await supabase
        .from("produk_usaha_kelompok_tani_bumnag")
        .delete()
        .eq("id", item.id)

      if (errDelete) {
        setPesanError(formatSupabaseError(errDelete, "Gagal menghapus produk"))
      } else {
        setPesanSukses(`Produk/unit usaha "${item.nama_produk_usaha}" berhasil dihapus.`)
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan hapus produk"))
    } finally {
      setActionLoadingId(null)
    }
  }

  // --- Condition Data Not Found ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-600">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium">Memuat detail entitas, galeri, dan produk...</p>
        </div>
      </div>
    )
  }

  if (!entitas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-800">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
          <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-sm text-gray-600 mb-6">
            Data Kelompok Tani atau BUMNag dengan ID <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{dataId}</span> tidak ditemukan di database.
          </p>
          <Link
            href="/admin/kelompok-tani-bumnag"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#2c1b01] text-white font-semibold text-sm hover:bg-[#1a1200] transition-colors"
          >
            ← Kembali ke Kelola Kelompok Tani & BUMNag
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Top Header Navigation */}
      <div className="bg-[#2c1b01] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/kelompok-tani-bumnag"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Kelola Kelompok Tani & BUMNag"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    entitas.jenis_entitas === "kelompok_tani"
                      ? "bg-emerald-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {getLabelJenisEntitas(entitas.jenis_entitas)}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    entitas.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {entitas.is_active ? "Aktif" : "Draft (Nonaktif)"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                {entitas.nama_entitas}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Toast Notifikasi Sukses */}
        {pesanSukses && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium">{pesanSukses}</p>
            </div>
            <button
              type="button"
              onClick={() => setPesanSukses(null)}
              className="text-emerald-500 hover:text-emerald-700 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Toast Notifikasi Error */}
        {pesanError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium whitespace-pre-wrap">{pesanError}</p>
            </div>
            <button
              type="button"
              onClick={() => setPesanError(null)}
              className="text-red-500 hover:text-red-700 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* SECTION 1: Informasi Entitas Ringkas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
            Informasi Ringkas Entitas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {getLabelBidang(entitas.jenis_entitas)}
              </p>
              <p className="font-medium text-gray-900 mt-0.5">{entitas.bidang_utama}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {getLabelPimpinan(entitas.jenis_entitas)}
              </p>
              <p className="font-medium text-gray-900 mt-0.5">{entitas.nama_pimpinan || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Wilayah / Alamat</p>
              <p className="font-medium text-gray-900 mt-0.5">
                {entitas.wilayah_kegiatan || entitas.alamat || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Anggota</p>
              <p className="font-medium text-gray-900 mt-0.5">
                {entitas.jumlah_anggota !== null ? `${entitas.jumlah_anggota} Orang` : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Kelola Galeri Foto & Cover */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Galeri Foto & Cover Utama</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Unggah foto galeri dan tentukan satu foto cover utama (Maksimal 2 MB per file, JPEG/PNG/WebP).
              </p>
            </div>

            <label className="inline-flex items-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm shadow-sm cursor-pointer transition-all">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Pilih Foto Galeri
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Upload Queue Section */}
          {uploadQueue.length > 0 && (
            <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-950">
                  Antrean Unggah ({uploadQueue.length} Foto Siap Diunggah)
                </h3>
                <button
                  type="button"
                  onClick={handleProcessUploadQueue}
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-[#2c1b01] text-white text-xs font-semibold hover:bg-[#1a1200] transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Mengunggah..." : "Mulai Unggah Semua"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-amber-200 p-4 flex gap-4 items-start shadow-sm"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.teks_alt}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                    <div className="flex-1 space-y-2 text-xs">
                      {item.errorValidation ? (
                        <p className="text-red-600 font-semibold">{item.errorValidation}</p>
                      ) : (
                        <>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">
                              Teks Alternatif (Alt) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.teks_alt}
                              onChange={(e) =>
                                handleQueueChange(item.id, "teks_alt", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-semibold mb-1">
                              Caption Foto (Opsional)
                            </label>
                            <input
                              type="text"
                              value={item.caption}
                              onChange={(e) =>
                                handleQueueChange(item.id, "caption", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveQueue(item.id)}
                        className="text-red-600 hover:underline font-semibold text-[11px]"
                      >
                        Hapus dari antrean
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Laporan Hasil Upload Sekuensial */}
          {uploadReports.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs space-y-2">
              <p className="font-bold text-gray-900">Laporan Hasil Unggah Foto:</p>
              {uploadReports.map((rep, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  {rep.status === "sukses" ? (
                    <span className="text-emerald-700 font-semibold">✓ {rep.fileName} (Berhasil)</span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      ✗ {rep.fileName} ({rep.alasan})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Daftar Foto Galeri Terdaftar */}
          {galeriList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">Belum Ada Foto Galeri</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Silakan pilih dan unggah foto melalui tombol di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galeriList.map((item) => {
                const state = editingPhotoState[item.id] || {
                  caption: item.caption || "",
                  teks_alt: item.teks_alt || "",
                  urutan: item.urutan ?? 0,
                }
                const isBusy = actionLoadingId === item.id

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 shadow-sm space-y-3 relative flex flex-col justify-between ${
                      item.is_cover && item.is_active
                        ? "border-amber-500 ring-2 ring-amber-500/20"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Image Thumbnail & Badges */}
                      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-gray-100">
                        <img
                          src={item.foto_url}
                          alt={item.teks_alt}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.is_cover && item.is_active && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-gray-950 shadow-sm">
                              ★ COVER UTAMA
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                              item.is_active
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-800/80 text-gray-200"
                            }`}
                          >
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </div>

                      {/* Metadata Editors */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-gray-600 font-semibold mb-1">
                            Teks Alternatif (Alt) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={state.teks_alt}
                            onChange={(e) =>
                              handlePhotoStateChange(item.id, "teks_alt", e.target.value)
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-600 font-semibold mb-1">
                            Caption Foto (Opsional)
                          </label>
                          <input
                            type="text"
                            value={state.caption}
                            onChange={(e) =>
                              handlePhotoStateChange(item.id, "caption", e.target.value)
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center space-x-2">
                            <label className="text-gray-600 font-semibold">Urutan:</label>
                            <input
                              type="number"
                              min={0}
                              value={state.urutan}
                              onChange={(e) =>
                                handlePhotoStateChange(item.id, "urutan", e.target.value)
                              }
                              className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-center"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSimpanMetadataPhoto(item)}
                            disabled={isBusy}
                            className="px-3 py-1 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                          >
                            Simpan Meta
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Photo Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        {!item.is_cover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(item)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 text-xs transition-colors disabled:opacity-50"
                          >
                            Jadikan Cover
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleAktifGaleri(item)}
                          disabled={isBusy}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                            item.is_active
                              ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleHapusGaleri(item)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Kelola Produk, Unit Usaha, & Jasa */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Produk, Unit Usaha, & Jasa</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Kelola data berulang hasil kegiatan, unit usaha, produk panen, atau layanan entitas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenTambahProduk}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm shadow-sm transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Produk / Unit
            </button>
          </div>

          {/* Form Modal Produk / Unit Usaha */}
          {isFormProdukOpen && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  {editingProdukId ? "Edit Produk / Unit Usaha" : "Tambah Produk / Unit Usaha Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormProdukOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleProdukFormSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Jenis Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formProdukData.jenis_item}
                      onChange={(e) =>
                        setFormProdukData({
                          ...formProdukData,
                          jenis_item: e.target.value as JenisItemProdukUsaha,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-1 focus:ring-amber-500 bg-white"
                    >
                      {PILIHAN_JENIS_PRODUK_USAHA.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Nama Produk / Unit / Jasa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Beras Organik / Toko Tani / Jasa Sewa Alsintan"
                      value={formProdukData.nama_produk_usaha}
                      onChange={(e) =>
                        setFormProdukData({ ...formProdukData, nama_produk_usaha: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-1 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formProdukData.urutan}
                      onChange={(e) =>
                        setFormProdukData({ ...formProdukData, urutan: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-1 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Deskripsi / Penjelasan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Penjelasan produk, spesifikasi hasil panen, atau deskripsi layanan..."
                    value={formProdukData.deskripsi}
                    onChange={(e) =>
                      setFormProdukData({ ...formProdukData, deskripsi: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-1 focus:ring-amber-500 bg-white resize-y"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormProdukOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loadingProdukForm}
                    className="px-5 py-2 rounded-xl bg-[#2c1b01] text-white text-xs font-semibold hover:bg-[#1a1200] disabled:opacity-50"
                  >
                    {loadingProdukForm ? "Menyimpan..." : editingProdukId ? "Simpan Perubahan" : "Tambah Produk"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Daftar Produk Tabel */}
          {produkList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-medium">Belum Ada Produk / Unit Usaha</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Silakan tambah data berulang produk/unit/jasa entitas melalui tombol di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="py-3 px-4 w-16 text-center">Urutan</th>
                    <th className="py-3 px-4">Nama Produk / Unit</th>
                    <th className="py-3 px-4">Jenis Item</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {produkList.map((item) => {
                    const isBusy = actionLoadingId === item.id
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-gray-600">
                          {item.urutan}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {item.nama_produk_usaha}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {getLabelJenisItem(item.jenis_item)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                          {item.deskripsi || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduk(item)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAktifProduk(item)}
                              disabled={isBusy}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                item.is_active
                                  ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHapusProduk(item)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
