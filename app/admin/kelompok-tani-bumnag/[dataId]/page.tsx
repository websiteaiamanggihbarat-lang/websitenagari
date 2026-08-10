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
  getLabelJenisItem,
} from "@/lib/kelompokTaniBumnag"
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface PageProps {
  params: Promise<{ dataId: string }>
}

interface UploadQueueItem {
  id: string
  file: File
  previewUrl: string
  caption: string
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
      " Data melanggar aturan validasi database (check constraint)."
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

async function keluarDariAdmin(labelError = "Logout error") {
  try {
    await supabase.auth.signOut()

    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
    }

    const response = await fetch("/auth/signout", {
      method: "POST",
      credentials: "include",
      redirect: "follow",
    })

    if (response.redirected) {
      window.location.href = response.url
    } else {
      window.location.href = `/login?logout=success&t=${Date.now()}`
    }
  } catch (error) {
    console.error(labelError, error)
    window.location.href = `/login?logout=success&t=${Date.now()}`
  }
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

  const handleLogout = async () => {
    setLoading(true)
    await keluarDariAdmin("Logout error")
  }

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()
  const [deleteTargetFoto, setDeleteTargetFoto] = useState<GaleriKelompokTaniBumnag | null>(null)
  const [deleteTargetProduk, setDeleteTargetProduk] = useState<ProdukUsahaKelompokTaniBumnag | null>(null)

  // Multi-upload queue & report state
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [uploadReports, setUploadReports] = useState<UploadReportItem[]>([])

  // State caption per foto
  const [captionPhotoState, setCaptionPhotoState] = useState<Record<string, string>>({})

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

  // Auto dismiss success toast message after 4 seconds
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

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

      // 2. Baca seluruh galeri foto
      const { data: dataGaleri, error: errGaleri } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .select("*")
        .eq("kelompok_tani_bumnag_id", dataId)

      if (errGaleri) {
        setPesanError(formatSupabaseError(errGaleri, "Gagal membaca galeri foto"))
      } else {
        const listRaw = (dataGaleri as GaleriKelompokTaniBumnag[]) || []
        // Urutkan: is_cover DESC -> created_at DESC
        const listSorted = [...listRaw].sort((a, b) => {
          if (a.is_cover && !b.is_cover) return -1
          if (!a.is_cover && b.is_cover) return 1
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA
        })
        setGaleriList(listSorted)

        // Inisialisasi state caption per foto
        const captionMap: Record<string, string> = {}
        for (const item of listSorted) {
          captionMap[item.id] = item.caption || ""
        }
        setCaptionPhotoState(captionMap)
      }

      // 3. Baca seluruh produk/unit usaha
      const { data: dataProduk, error: errProduk } = await supabase
        .from("produk_usaha_kelompok_tani_bumnag")
        .select("*")
        .eq("kelompok_tani_bumnag_id", dataId)
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

      newQueue.push({
        id,
        file,
        previewUrl,
        caption: "",
        errorValidation,
      })
    })

    setUploadQueue((prev) => [...prev, ...newQueue])
    if (e.target) {
      e.target.value = ""
    }
  }

  const handleQueueCaptionChange = (id: string, value: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption: value } : item))
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
    const entitasNama = entitas?.nama_entitas || "Kelompok Tani / BUMNag"

    for (let idx = 0; idx < validItems.length; idx++) {
      const item = validItems[idx]
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
      const teksAltFallback = item.caption.trim() || `${entitasNama} - Foto ${galeriList.length + idx + 1}`

      // Step 3: Insert record ke database galeri_kelompok_tani_bumnag (Otomatis Aktif)
      const { error: errInsert } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .insert({
          kelompok_tani_bumnag_id: dataId,
          foto_url: fotoUrl,
          storage_path: storagePath,
          caption: item.caption.trim() || null,
          teks_alt: teksAltFallback,
          is_cover: false,
          is_active: true, // OTOMATIS AKTIF
          urutan: galeriList.length + idx + 1,
        })

      if (errInsert) {
        console.warn("Gagal simpan DB galeri, melakukan rollback storage:", errInsert)
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
    const suksesCount = reports.filter((r) => r.status === "sukses").length
    if (suksesCount > 0) {
      setPesanSukses("Foto berhasil ditambahkan.")
    }
    await fetchEntitasDetail()
  }

  // --- Handlers Caption Auto-Save ---
  const handleCaptionBlur = async (item: GaleriKelompokTaniBumnag, newCaption: string) => {
    const valClean = newCaption.trim() || null
    if (valClean === (item.caption || null)) return

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    try {
      const { error: errUpdate } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({
          caption: valClean,
          teks_alt: valClean || item.teks_alt || entitas?.nama_entitas || "Foto Galeri",
        })
        .eq("id", item.id)

      if (!errUpdate) {
        setPesanSukses("Caption foto berhasil diperbarui.")
        await fetchEntitasDetail()
      }
    } catch {
      // ignore
    }
  }

  // --- Handlers Status Cover ---
  const handleSetCover = async (item: GaleriKelompokTaniBumnag) => {
    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      // 1. Nonaktifkan status is_cover dari cover lama terlebih dahulu
      await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({ is_cover: false })
        .eq("kelompok_tani_bumnag_id", dataId)
        .eq("is_cover", true)

      // 2. Tetapkan foto baru sebagai is_cover = true
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
        setPesanSukses("Foto berhasil dijadikan cover.")
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan menetapkan cover"))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleHapusGaleri = (item: GaleriKelompokTaniBumnag) => {
    setDeleteTargetFoto(item)
  }

  const executeHapusGaleri = async (item: GaleriKelompokTaniBumnag) => {
    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      if (item.is_cover && item.is_active && entitas?.is_active) {
        const otherActiveCovers = galeriList.filter(
          (g) => g.id !== item.id && g.is_cover && g.is_active
        )

        if (otherActiveCovers.length === 0) {
          const { error: errParent } = await supabase
            .from("kelompok_tani_bumnag")
            .update({ is_active: false })
            .eq("id", dataId)

          if (errParent) {
            const msg = formatSupabaseError(errParent, "Gagal menonaktifkan entitas induk sebelum menghapus foto cover terakhir")
            setPesanError(msg)
            showError(msg)
            setActionLoadingId(null)
            return
          }
        }
      }

      if (item.storage_path) {
        const { error: errStorage } = await supabase.storage
          .from(BUCKET_KELOMPOK_TANI_BUMNAG)
          .remove([item.storage_path])

        if (errStorage) {
          const msg = formatSupabaseError(errStorage, "Gagal menghapus file dari Storage.")
          setPesanError(msg)
          showError(msg)
          setActionLoadingId(null)
          return
        }
      }

      const { error: errDeleteDB } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .delete()
        .eq("id", item.id)

      if (errDeleteDB) {
        const msg = formatSupabaseError(errDeleteDB, "Gagal menghapus record database galeri.")
        setPesanError(msg)
        showError(msg)
      } else {
        const msg = "Foto berhasil dihapus."
        setPesanSukses(msg)
        showSuccess(msg)
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      const msg = formatSupabaseError(e, "Terjadi kesalahan hapus foto")
      setPesanError(msg)
      showError(msg)
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

        setPesanSukses("Produk berhasil diperbarui.")
        setIsFormProdukOpen(false)
        setEditingProdukId(null)
        setFormProdukData(FORM_PRODUK_AWAL)
        await fetchEntitasDetail()
      } else {
        const { error: errInsert } = await supabase
          .from("produk_usaha_kelompok_tani_bumnag")
          .insert({
            ...payload,
            is_active: true, // OTOMATIS AKTIF
          })

        if (errInsert) {
          setPesanError(formatSupabaseError(errInsert, "Gagal menambahkan produk/unit usaha"))
          setLoadingProdukForm(false)
          return
        }

        setPesanSukses("Produk berhasil ditambahkan.")
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

  const handleHapusProduk = (item: ProdukUsahaKelompokTaniBumnag) => {
    setDeleteTargetProduk(item)
  }

  const executeHapusProduk = async (item: ProdukUsahaKelompokTaniBumnag) => {
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
        const msg = formatSupabaseError(errDelete, "Gagal menghapus produk")
        setPesanError(msg)
        showError(msg)
      } else {
        const msg = `Produk "${item.nama_produk_usaha}" berhasil dihapus.`
        setPesanSukses(msg)
        showSuccess(msg)
        await fetchEntitasDetail()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      const msg = formatSupabaseError(e, "Terjadi kesalahan hapus produk")
      setPesanError(msg)
      showError(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // --- Condition Data Not Found ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f2e8] flex items-center justify-center p-6 text-gray-600">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
          <p className="text-sm font-medium">Memuat detail entitas, galeri, dan produk...</p>
        </div>
      </div>
    )
  }

  if (!entitas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] flex items-center justify-center p-6 text-gray-800">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
          <svg className="w-16 h-16 text-amber-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] text-gray-900 pb-20">
      {/* Top Header Navigation (Cukup Menampilkan Nama Entitas Tanpa Badge Status/Jenis) */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-8">
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
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {entitas.nama_entitas}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Global Toast Notifications */}
        <div aria-live="polite">
          {pesanSukses && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{pesanSukses}</span>
              </div>
            </div>
          )}

          {pesanError && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="whitespace-pre-wrap">{pesanError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPesanError(null)}
                  className="text-red-600 hover:text-red-800 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: Kelola Galeri Foto & Cover Utama */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-[#f7f2e8] p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">Galeri Foto & Cover Utama</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Unggah foto galeri dan tentukan satu foto cover utama (Maksimal 2 MB per file, JPEG/PNG/WebP).
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-sm shadow-md cursor-pointer transition-all w-fit">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambahkan Foto</span>
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

          <div className="p-6 space-y-6">
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
                    className="px-5 py-2 rounded-xl bg-[#2c1b01] text-white text-xs font-semibold hover:bg-[#6b4b1d] transition-colors disabled:opacity-50 cursor-pointer"
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
                        alt="Preview Foto"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0"
                      />
                      <div className="flex-1 space-y-2 text-xs">
                        {item.errorValidation ? (
                          <p className="text-red-600 font-semibold">{item.errorValidation}</p>
                        ) : (
                          <div>
                            <label className="block text-gray-700 font-semibold mb-1">
                              Caption Foto <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={item.caption}
                              onChange={(e) =>
                                handleQueueCaptionChange(item.id, e.target.value)
                              }
                              placeholder="Tambahkan keterangan foto..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-[#6b4b1d] focus:outline-none"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveQueue(item.id)}
                          className="text-red-600 hover:underline font-semibold text-[11px] cursor-pointer"
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
                  Silakan pilih dan unggah foto melalui tombol 'Tambahkan Foto' di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galeriList.map((item) => {
                  const currentCaption =
                    captionPhotoState[item.id] !== undefined
                      ? captionPhotoState[item.id]
                      : item.caption || ""
                  const isBusy = actionLoadingId === item.id

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm relative flex flex-col justify-between space-y-3"
                    >
                      {/* Tombol X Hapus di Kanan Atas (Theme Krem-Cokelat) */}
                      <button
                        type="button"
                        onClick={() => handleHapusGaleri(item)}
                        disabled={isBusy}
                        aria-label={`Hapus foto ${item.caption || "galeri"}`}
                        title="Hapus foto"
                        className="absolute top-2 right-2 z-10 rounded-full border border-[#6b4b1d]/30 bg-[#f7f2e8] p-1.5 text-[#2c1b01] shadow-sm hover:bg-[#2c1b01] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="space-y-3">
                        {/* Image Thumbnail */}
                        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-gray-100">
                          <img
                            src={item.foto_url}
                            alt={item.caption || entitas?.nama_entitas || "Foto Galeri"}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Input Caption (Opsional, Auto-save on blur) */}
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-700">
                            Caption Foto <span className="text-[11px] font-normal text-gray-500">(Opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={currentCaption}
                            onChange={(e) =>
                              setCaptionPhotoState({
                                ...captionPhotoState,
                                [item.id]: e.target.value,
                              })
                            }
                            onFocus={(e) => e.currentTarget.select()}
                            onBlur={(e) => handleCaptionBlur(item, e.target.value)}
                            placeholder="Tambahkan keterangan foto..."
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Photo Actions Footer: Tombol Jadikan Cover (Hanya jika belum cover) */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                        {!item.is_cover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(item)}
                            disabled={isBusy}
                            className="rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4] transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Jadikan Cover
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Kelola Produk, Unit Usaha, & Jasa */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-[#f7f2e8] p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">Produk, Unit Usaha, & Jasa</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Kelola data berulang hasil kegiatan, unit usaha, produk panen, atau layanan entitas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenTambahProduk}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-sm shadow-md transition-all cursor-pointer w-fit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Produk / Unit</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Form Modal Produk / Unit Usaha (Tanpa Tombol Batal di Header) */}
            {isFormProdukOpen && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-base font-bold text-gray-900">
                    {editingProdukId ? "Edit Produk / Unit Usaha" : "Tambah Produk / Unit Usaha Baru"}
                  </h3>
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
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#6b4b1d] focus:outline-none bg-white"
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
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#6b4b1d] focus:outline-none bg-white"
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
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#6b4b1d] focus:outline-none bg-white"
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
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#6b4b1d] focus:outline-none bg-white resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormProdukOpen(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-100 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loadingProdukForm}
                      className="px-5 py-2 rounded-xl bg-[#2c1b01] text-white text-xs font-semibold hover:bg-[#6b4b1d] disabled:opacity-50 cursor-pointer"
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
                  <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                    <tr>
                      <th scope="col" className="py-3.5 px-6 font-bold w-16 text-center">Urutan</th>
                      <th scope="col" className="py-3.5 px-6 font-bold">Nama Produk / Unit</th>
                      <th scope="col" className="py-3.5 px-6 font-bold">Jenis Item</th>
                      <th scope="col" className="py-3.5 px-6 font-bold">Deskripsi</th>
                      <th scope="col" className="py-3.5 px-6 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {produkList.map((item) => {
                      const isBusy = actionLoadingId === item.id
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-6 text-center font-bold text-gray-600">
                            {item.urutan}
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-gray-900">
                            {item.nama_produk_usaha}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#f7f2e8] text-[#6b4b1d] border border-gray-200">
                              {getLabelJenisItem(item.jenis_item)}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-gray-600 max-w-xs truncate">
                            {item.deskripsi || "-"}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduk(item)}
                                disabled={isBusy}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHapusProduk(item)}
                                disabled={isBusy}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer"
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

      {/* Custom Confirmation Modals */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetFoto)}
        title="⚠ Hapus Foto Galeri?"
        message="Apakah Anda yakin ingin menghapus foto ini? File gambar di Storage dan database akan dihapus secara permanen."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(actionLoadingId)}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTargetFoto) {
            await executeHapusGaleri(deleteTargetFoto)
            setDeleteTargetFoto(null)
          }
        }}
        onCancel={() => setDeleteTargetFoto(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTargetProduk)}
        title="⚠ Hapus Produk / Unit Usaha?"
        message={
          <>
            Apakah Anda yakin ingin menghapus <strong>&quot;{deleteTargetProduk?.nama_produk_usaha}&quot;</strong>?
            <br />
            Data produk/unit usaha akan dihapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(actionLoadingId)}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTargetProduk) {
            await executeHapusProduk(deleteTargetProduk)
            setDeleteTargetProduk(null)
          }
        }}
        onCancel={() => setDeleteTargetProduk(null)}
      />
    </div>
  )
}
