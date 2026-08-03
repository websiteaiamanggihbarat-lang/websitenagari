"use client"

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  STRUKTUR_ORGANISASI_TABLE,
  STRUKTUR_ORGANISASI_BUCKET,
  STRUKTUR_ORGANISASI_STORAGE_ROOT,
  STRUKTUR_ORGANISASI_MAX_FILE_SIZE_BYTES,
  STRUKTUR_ORGANISASI_PERFORMANCE_WARNING_BYTES,
  STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES,
  STRUKTUR_ORGANISASI_SLOT_KEYS,
  fetchSemuaStrukturOrganisasiAdmin,
  type StrukturOrganisasi,
  type StrukturOrganisasiSlotKey,
} from "@/lib/strukturOrganisasi"

type StatusCleanupSlot = {
  sedangMemeriksa: boolean
  fileTambahan: string[]
  gagalMemeriksa: boolean
}

function isValidHttpsUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    value.length === 0 ||
    /\s/.test(value)
  ) {
    return false
  }
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

export default function AdminStrukturOrganisasiPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // State data
  const [items, setItems] = useState<StrukturOrganisasi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorDaftar, setErrorDaftar] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  // State form inline
  const [editingSlot, setEditingSlot] = useState<StrukturOrganisasiSlotKey | null>(null)
  const [namaPejabat, setNamaPejabat] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingFoto, setIsDeletingFoto] = useState(false)
  const [warningFile, setWarningFile] = useState<string | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  // State pesan global & session
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  // State cleanup per slot
  const [cleanupState, setCleanupState] = useState<
    Partial<Record<StrukturOrganisasiSlotKey, StatusCleanupSlot>>
  >({})
  const [isCleaningUpSlot, setIsCleaningUpSlot] = useState<
    Partial<Record<StrukturOrganisasiSlotKey, boolean>>
  >({})

  // Validator Storage Path
  const isValidStoragePath = (
    path: string | null,
    slotKey: StrukturOrganisasiSlotKey
  ): boolean => {
    if (!path || typeof path !== "string") return false
    const trimmed = path.trim()
    if (trimmed !== path || trimmed.length === 0) return false
    const expectedPrefix = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto/`
    if (!trimmed.startsWith(expectedPrefix)) return false
    const fileName = trimmed.slice(expectedPrefix.length)
    if (
      !fileName ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      fileName === "." ||
      fileName === ".."
    ) {
      return false
    }
    return /^[A-Za-z0-9._-]+$/.test(fileName)
  }

  // Rekonsiliasi & Pemeriksaan Folder Storage per slot
  const periksaFolderSlot = async (
    record: StrukturOrganisasi
  ): Promise<StatusCleanupSlot> => {
    const slotKey = record.slot_key
    const folderPath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto`

    try {
      const { data: fileList, error } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .list(folderPath, { limit: 100 })

      if (error) {
        return {
          sedangMemeriksa: false,
          fileTambahan: [],
          gagalMemeriksa: true,
        }
      }

      const activeFileName =
        record.foto_storage_path &&
        isValidStoragePath(record.foto_storage_path, slotKey)
          ? record.foto_storage_path.slice(folderPath.length + 1)
          : null

      const fileTambahan = (fileList || [])
        .map((f) => f.name)
        .filter((name) => {
          if (!name || name.includes("/") || name.includes("\\") || name === "." || name === "..") {
            return false
          }
          if (!/^[A-Za-z0-9._-]+$/.test(name)) {
            return false
          }
          if (activeFileName && name === activeFileName) {
            return false
          }
          return true
        })

      return {
        sedangMemeriksa: false,
        fileTambahan,
        gagalMemeriksa: false,
      }
    } catch {
      return {
        sedangMemeriksa: false,
        fileTambahan: [],
        gagalMemeriksa: true,
      }
    }
  }

  const periksaSemuaFolder = async (records: StrukturOrganisasi[]) => {
    const promises = records.map(async (rec) => {
      const status = await periksaFolderSlot(rec)
      return { slotKey: rec.slot_key, status }
    })

    const results = await Promise.allSettled(promises)
    const nextState: Partial<Record<StrukturOrganisasiSlotKey, StatusCleanupSlot>> = {}

    for (const res of results) {
      if (res.status === "fulfilled") {
        nextState[res.value.slotKey] = res.value.status
      }
    }

    setCleanupState((prev) => ({ ...prev, ...nextState }))
  }

  // Load data awal
  const loadData = async () => {
    try {
      setIsLoading(true)
      setErrorDaftar(null)
      const data = await fetchSemuaStrukturOrganisasiAdmin()
      setItems(data)
      await periksaSemuaFolder(data)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Struktur organisasi belum dapat dimuat."
      setErrorDaftar(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Cleanup object URL preview saat unmount atau previewUrl berubah
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await fetch("/auth/signout", { method: "POST" })
      router.push("/login?logout=success")
    } catch {
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Buka Form Edit Slot
  const handleEdit = (item: StrukturOrganisasi) => {
    setPesanSukses(null)
    setPesanError(null)
    setErrorForm(null)
    setWarningFile(null)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setNamaPejabat(item.nama_pejabat || "")
    setEditingSlot(item.slot_key)
  }

  // Tutup/Batal Form
  const handleBatal = () => {
    setEditingSlot(null)
    setNamaPejabat("")
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setWarningFile(null)
    setErrorForm(null)
  }

  // Handler Ganti File Foto
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorForm(null)
    setWarningFile(null)
    const file = e.target.files?.[0] || null

    if (!file) {
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    // Validasi MIME
    const isValidMime = (
      STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES as readonly string[]
    ).includes(file.type)

    if (!isValidMime) {
      setErrorForm("Format file tidak didukung. Gunakan format JPEG, PNG, atau WebP.")
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    // Validasi Ukuran Maksimal (5 MB)
    if (file.size > STRUKTUR_ORGANISASI_MAX_FILE_SIZE_BYTES) {
      setErrorForm("Ukuran file melebihi batas maksimal 5 MB.")
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    // Warning Ukuran Performa (> 2 MB)
    if (file.size > STRUKTUR_ORGANISASI_PERFORMANCE_WARNING_BYTES) {
      setWarningFile(
        "Ukuran file lebih dari 2 MB. Direkomendasikan melakukan kompresi agar memuat lebih cepat di HP."
      )
    }

    // Buat Object URL preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreview = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(newPreview)
  }

  // Mapping Ekstensi dari MIME
  const getExtFromMime = (mimeType: string): string => {
    switch (mimeType) {
      case "image/jpeg":
        return ".jpg"
      case "image/png":
        return ".png"
      case "image/webp":
        return ".webp"
      default:
        return ".jpg"
    }
  }

  // Sanitasi Nama File berdasarkan MIME dan Crypto UUID
  const getSafeFileName = (file: File): string => {
    const originalName = file.name
    const lastDotIndex = originalName.lastIndexOf(".")
    const baseName =
      lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName

    const cleanBase =
      baseName
        .replace(/\s+/g, "-")
        .replace(/[^A-Za-z0-9._-]/g, "")
        .slice(0, 50) || "foto"

    const timestamp = Date.now()
    const randomSuffix = crypto.randomUUID().slice(0, 8)
    const ext = getExtFromMime(file.type)

    return `${timestamp}-${randomSuffix}-${cleanBase}${ext}`
  }

  // Save Handler (Nama Saja atau Safe Replace Foto)
  const handleSimpan = async (
    e: FormEvent,
    currentRecord: StrukturOrganisasi
  ) => {
    e.preventDefault()
    if (isSaving) return

    setPesanSukses(null)
    setPesanError(null)
    setErrorForm(null)

    const slotKey = currentRecord.slot_key
    if (!STRUKTUR_ORGANISASI_SLOT_KEYS.includes(slotKey)) {
      setErrorForm("Slot jabatan tidak valid.")
      return
    }

    const namaBersih = namaPejabat.trim()
    const payloadNama = namaBersih === "" ? null : namaBersih

    if (payloadNama && payloadNama.length > 200) {
      setErrorForm("Nama pejabat maksimal 200 karakter.")
      return
    }

    // Opsi A: Hanya Ubah Nama Pejabat (Tanpa Foto Baru)
    if (!selectedFile) {
      try {
        setIsSaving(true)
        const { data: updatedRow, error: errUpdate } = await supabase
          .from(STRUKTUR_ORGANISASI_TABLE)
          .update({ nama_pejabat: payloadNama })
          .eq("slot_key", slotKey)
          .select(
            "slot_key, nama_jabatan, nama_pejabat, foto_url, foto_storage_path, parent_slot_key, kelompok_layout, urutan, created_at, updated_at"
          )
          .single()

        if (errUpdate || !updatedRow) {
          throw new Error(
            `Gagal memperbarui nama pejabat: ${errUpdate?.message || "Data tidak ditemukan."}`
          )
        }

        setPesanSukses(
          `Nama pejabat ${currentRecord.nama_jabatan} berhasil diperbarui.`
        )
        handleBatal()
        await loadData()
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal memperbarui nama pejabat."
        setErrorForm(msg)
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Opsi B: Safe Replace Foto (Sertakan Foto Baru)
    let newStoragePath: string | null = null

    try {
      setIsSaving(true)

      // 1. Format Storage Path Baru dari Ekstensi MIME & UUID
      const safeFileName = getSafeFileName(selectedFile)
      newStoragePath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto/${safeFileName}`

      // 2. Upload Foto Baru ke Storage (upsert: false)
      const { error: errUpload } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .upload(newStoragePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (errUpload) {
        throw new Error(`Gagal mengunggah foto baru: ${errUpload.message}`)
      }

      // 3. Ambil dan Validasi Public URL menggunakan new URL()
      const { data: urlData } = supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .getPublicUrl(newStoragePath)

      const publicUrl = urlData?.publicUrl || ""
      if (!isValidHttpsUrl(publicUrl)) {
        // Rollback Upload jika URL tidak valid
        await supabase.storage
          .from(STRUKTUR_ORGANISASI_BUCKET)
          .remove([newStoragePath])
        throw new Error(
          "Gagal mendapatkan URL HTTPS publik dari Supabase Storage."
        )
      }

      // 4. Update Database & Buktikan 1 Row Kembali
      const { data: updatedRow, error: errUpdateDb } = await supabase
        .from(STRUKTUR_ORGANISASI_TABLE)
        .update({
          nama_pejabat: payloadNama,
          foto_url: publicUrl,
          foto_storage_path: newStoragePath,
        })
        .eq("slot_key", slotKey)
        .select(
          "slot_key, nama_jabatan, nama_pejabat, foto_url, foto_storage_path, parent_slot_key, kelompok_layout, urutan, created_at, updated_at"
        )
        .single()

      if (errUpdateDb || !updatedRow) {
        // Rollback: Hapus foto baru yang gagal disimpan ke DB
        const { error: errRemoveNew } = await supabase.storage
          .from(STRUKTUR_ORGANISASI_BUCKET)
          .remove([newStoragePath])

        if (errRemoveNew) {
          throw new Error(
            `Gagal memperbarui database: ${errUpdateDb?.message || "Data tidak ditemukan."}. File baru juga gagal dibersihkan secara otomatis.`
          )
        }

        throw new Error(
          `Gagal memperbarui database: ${errUpdateDb?.message || "Data tidak ditemukan."}. File baru telah dibersihkan.`
        )
      }

      // 5. DB Update Berhasil -> Refresh Data & Rekonsiliasi Folder menggunakan Record Terbaru
      setPesanSukses(
        `Nama dan foto pejabat ${currentRecord.nama_jabatan} berhasil diperbarui.`
      )
      handleBatal()
      await loadData()

      const cleanupRes = await rekonsiliasiFolderSlot(updatedRow)
      if (!cleanupRes.success) {
        setPesanError(
          "Perubahan berhasil disimpan, tetapi file lama belum sepenuhnya bersih. Gunakan 'Bersihkan File Lama' jika diperlukan."
        )
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan perubahan."
      setErrorForm(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Hapus Foto Handler
  const handleHapusFoto = async (currentRecord: StrukturOrganisasi) => {
    if (isDeletingFoto) return

    const konfirmasi = confirm(
      `Apakah Anda yakin ingin menghapus foto pejabat ${currentRecord.nama_jabatan}?`
    )
    if (!konfirmasi) return

    setPesanSukses(null)
    setPesanError(null)

    const slotKey = currentRecord.slot_key

    try {
      setIsDeletingFoto(true)

      // 1. Update Database (foto_url = null, foto_storage_path = null) & Buktikan 1 Row
      const { data: updatedRow, error: errUpdateDb } = await supabase
        .from(STRUKTUR_ORGANISASI_TABLE)
        .update({
          foto_url: null,
          foto_storage_path: null,
        })
        .eq("slot_key", slotKey)
        .select(
          "slot_key, nama_jabatan, nama_pejabat, foto_url, foto_storage_path, parent_slot_key, kelompok_layout, urutan, created_at, updated_at"
        )
        .single()

      if (errUpdateDb || !updatedRow) {
        throw new Error(
          `Gagal menghapus foto dari database: ${errUpdateDb?.message || "Data tidak ditemukan."}`
        )
      }

      // 2. Refresh & Rekonsiliasi Folder menggunakan Record Terbaru
      handleBatal()
      await loadData()

      const cleanupRes = await rekonsiliasiFolderSlot(updatedRow)
      if (cleanupRes.success) {
        setPesanSukses(
          `Foto pejabat ${currentRecord.nama_jabatan} berhasil dihapus.`
        )
      } else {
        setPesanError(
          "Foto berhasil dihapus dari database, namun file Storage belum sepenuhnya bersih. Gunakan 'Bersihkan File Lama' untuk retry."
        )
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menghapus foto pejabat."
      setPesanError(msg)
    } finally {
      setIsDeletingFoto(false)
    }
  }

  // Rekonsiliasi Folder Slot dengan Record Terbaru
  const rekonsiliasiFolderSlot = async (
    record: StrukturOrganisasi
  ): Promise<{ success: boolean; remainingCount: number }> => {
    const slotKey = record.slot_key
    const folderPath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto`

    try {
      const { data: fileList, error: errList } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .list(folderPath, { limit: 100 })

      if (errList || !fileList) {
        setCleanupState((prev) => ({
          ...prev,
          [slotKey]: { sedangMemeriksa: false, fileTambahan: [], gagalMemeriksa: true },
        }))
        return { success: false, remainingCount: 0 }
      }

      const activeFileName =
        record.foto_storage_path &&
        isValidStoragePath(record.foto_storage_path, slotKey)
          ? record.foto_storage_path.slice(folderPath.length + 1)
          : null

      const candidates = fileList
        .map((f) => f.name)
        .filter((name) => {
          if (!name || name.includes("/") || name.includes("\\") || name === "." || name === "..") {
            return false
          }
          if (!/^[A-Za-z0-9._-]+$/.test(name)) {
            return false
          }
          if (activeFileName && name === activeFileName) {
            return false
          }
          return true
        })

      if (candidates.length === 0) {
        setCleanupState((prev) => ({
          ...prev,
          [slotKey]: { sedangMemeriksa: false, fileTambahan: [], gagalMemeriksa: false },
        }))
        return { success: true, remainingCount: 0 }
      }

      const removePaths = candidates.map((name) => `${folderPath}/${name}`)
      const { error: errRemove } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .remove(removePaths)

      if (errRemove) {
        setCleanupState((prev) => ({
          ...prev,
          [slotKey]: { sedangMemeriksa: false, fileTambahan: candidates, gagalMemeriksa: true },
        }))
        return { success: false, remainingCount: candidates.length }
      }

      // Verifikasi Ulang List Folder
      const { data: reCheckList } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .list(folderPath, { limit: 100 })

      const remainingExtra = (reCheckList || [])
        .map((f) => f.name)
        .filter((name) => {
          if (!name || name === "." || name === "..") return false
          if (activeFileName && name === activeFileName) return false
          return true
        })

      setCleanupState((prev) => ({
        ...prev,
        [slotKey]: {
          sedangMemeriksa: false,
          fileTambahan: remainingExtra,
          gagalMemeriksa: false,
        },
      }))

      return {
        success: remainingExtra.length === 0,
        remainingCount: remainingExtra.length,
      }
    } catch {
      setCleanupState((prev) => ({
        ...prev,
        [slotKey]: { sedangMemeriksa: false, fileTambahan: [], gagalMemeriksa: true },
      }))
      return { success: false, remainingCount: 0 }
    }
  }

  // Retry Cleanup Handler (Menghitung Ulang Kandidat dari Fetch Terbaru)
  const handleRetryCleanup = async (record: StrukturOrganisasi) => {
    const slotKey = record.slot_key
    if (isCleaningUpSlot[slotKey]) return

    setPesanSukses(null)
    setPesanError(null)

    try {
      setIsCleaningUpSlot((prev) => ({ ...prev, [slotKey]: true }))

      // Ambil record paling segar dari DB
      const freshRecords = await fetchSemuaStrukturOrganisasiAdmin()
      const freshItem = freshRecords.find((r) => r.slot_key === slotKey) || record

      const res = await rekonsiliasiFolderSlot(freshItem)
      if (res.success) {
        setPesanSukses(
          `Pembersihan file lama untuk ${record.nama_jabatan} berhasil diselesaikan.`
        )
      } else {
        setPesanError(
          `File lama untuk ${record.nama_jabatan} masih tersisa atau gagal diperiksa. Silakan coba lagi.`
        )
      }
    } catch {
      setPesanError(`Gagal membersihkan file lama untuk ${record.nama_jabatan}.`)
    } finally {
      setIsCleaningUpSlot((prev) => ({ ...prev, [slotKey]: false }))
    }
  }

  const handleImageError = (slotKey: string) => {
    setFailedImages((prev) => ({ ...prev, [slotKey]: true }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-[#2c1b01] text-white shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="rounded-lg bg-white/10 p-2 text-amber-200 transition-colors hover:bg-white/20"
                title="Kembali ke Dashboard Admin"
                aria-label="Kembali ke dashboard admin"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Kelola Struktur Organisasi
                </h1>
                <p className="text-xs text-amber-200/80 sm:text-sm">
                  Perbarui nama dan foto pejabat pada struktur organisasi Nagari.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-red-700 disabled:opacity-60"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
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
                <span>{isLoggingOut ? "Proses..." : "Logout"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alert Pesan Sukses */}
        {pesanSukses && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium">{pesanSukses}</span>
            </div>
            <button
              type="button"
              onClick={() => setPesanSukses(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Alert Pesan Error */}
        {pesanError && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">{pesanError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPesanError(null)}
              className="text-red-600 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Utama */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-gray-600">
              Memuat data struktur organisasi...
            </p>
          </div>
        ) : errorDaftar ? (
          /* Error Load Utama */
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-3 text-lg font-bold text-red-900">
              Struktur organisasi belum dapat dimuat.
            </h3>
            <p className="mt-1 text-sm text-red-700">{errorDaftar}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          /* Tabel Daftar 16 Slot Admin */
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Daftar Struktur Organisasi
                </h2>
                <p className="text-xs text-gray-500">
                  Total 16 jabatan tetap Nagari Aia Manggih Barat
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                16 Jabatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 min-w-[760px]">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold w-24">
                      PREVIEW
                    </th>
                    <th scope="col" className="px-6 py-3 font-semibold">
                      JABATAN
                    </th>
                    <th scope="col" className="px-6 py-3 font-semibold">
                      NAMA PEJABAT
                    </th>
                    <th scope="col" className="px-6 py-3 font-semibold text-right w-48">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item) => {
                    const isEditing = editingSlot === item.slot_key
                    const slotCleanup = cleanupState[item.slot_key]
                    const hasExtraFiles =
                      slotCleanup &&
                      (slotCleanup.fileTambahan.length > 0 || slotCleanup.gagalMemeriksa)
                    const isCleaning = Boolean(isCleaningUpSlot[item.slot_key])
                    const imageFailed = Boolean(failedImages[item.slot_key])

                    return (
                      <tr
                        key={item.slot_key}
                        className={`transition-colors hover:bg-amber-50/30 ${
                          isEditing ? "bg-amber-50/60" : ""
                        }`}
                      >
                        {/* 1. Preview Foto */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 shadow-sm">
                            {item.foto_url && !imageFailed ? (
                              <img
                                src={item.foto_url}
                                alt={
                                  item.nama_pejabat
                                    ? `Foto ${item.nama_pejabat}, ${item.nama_jabatan}`
                                    : `Foto pejabat ${item.nama_jabatan}`
                                }
                                onError={() => handleImageError(item.slot_key)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <svg
                                className="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            )}
                          </div>
                        </td>

                        {/* 2. Jabatan (Read-Only) */}
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-gray-900">
                            {item.nama_jabatan}
                          </div>
                        </td>

                        {/* 3. Nama Pejabat (Bisa diedit via Inline Form) */}
                        <td className="px-6 py-4 align-top">
                          {isEditing ? (
                            /* Form Inline untuk Slot yang Sedang Diedit */
                            <form
                              onSubmit={(e) => handleSimpan(e, item)}
                              className="space-y-4 rounded-xl border border-amber-300 bg-white p-4 shadow-md"
                            >
                              <div className="border-b border-gray-100 pb-2">
                                <h3 className="text-sm font-bold text-gray-900">
                                  Edit Pejabat: {item.nama_jabatan}
                                </h3>
                              </div>

                              {errorForm && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                                  {errorForm}
                                </div>
                              )}

                              {/* Input Nama Pejabat */}
                              <div>
                                <div className="mb-1 flex items-center justify-between">
                                  <label
                                    htmlFor={`nama-pejabat-${item.slot_key}`}
                                    className="block text-xs font-semibold text-gray-700"
                                  >
                                    Nama Pejabat (Opsional)
                                  </label>
                                  <span className="text-[10px] text-gray-400">
                                    {namaPejabat.trim().length}/200
                                  </span>
                                </div>
                                <input
                                  id={`nama-pejabat-${item.slot_key}`}
                                  type="text"
                                  maxLength={200}
                                  value={namaPejabat}
                                  onChange={(e) => setNamaPejabat(e.target.value)}
                                  disabled={isSaving || isDeletingFoto}
                                  placeholder="Contoh: Nama Pejabat, S.Pd."
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100"
                                />
                              </div>

                              {/* Foto saat ini / Preview */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-700">
                                  Foto Saat Ini:
                                </label>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                    {item.foto_url && !imageFailed ? (
                                      <img
                                        src={item.foto_url}
                                        alt={item.nama_jabatan}
                                        onError={() => handleImageError(item.slot_key)}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <svg
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1.5}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {item.foto_url
                                      ? "Foto pejabat sudah terpasang"
                                      : "Belum ada foto"}
                                  </span>
                                </div>
                              </div>

                              {/* Input Foto Baru */}
                              <div>
                                <label
                                  htmlFor={`input-foto-${item.slot_key}`}
                                  className="mb-1 block text-xs font-semibold text-gray-700"
                                >
                                  Ganti Foto Baru (Opsional)
                                </label>
                                <input
                                  id={`input-foto-${item.slot_key}`}
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handleFileChange}
                                  disabled={isSaving || isDeletingFoto}
                                  className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">
                                  JPEG, PNG, WebP. Maksimal 5 MB.
                                </p>
                                {warningFile && (
                                  <p className="mt-1 text-[10px] font-medium text-amber-700">
                                    ⚠️ {warningFile}
                                  </p>
                                )}
                              </div>

                              {/* Preview Foto Baru */}
                              {previewUrl && (
                                <div>
                                  <span className="mb-1 block text-[10px] font-semibold text-gray-700">
                                    Pratinjau foto baru {item.nama_jabatan}:
                                  </span>
                                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-amber-500 shadow-inner">
                                    <img
                                      src={previewUrl}
                                      alt={`Pratinjau foto baru ${item.nama_jabatan}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Tombol Form Inline */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                                <div>
                                  {item.foto_url && item.foto_storage_path && (
                                    <button
                                      type="button"
                                      onClick={() => handleHapusFoto(item)}
                                      disabled={isSaving || isDeletingFoto}
                                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                                    >
                                      {isDeletingFoto
                                        ? "Menghapus Foto..."
                                        : "Hapus Foto"}
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleBatal}
                                    disabled={isSaving || isDeletingFoto}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSaving || isDeletingFoto}
                                    className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-gray-950 shadow hover:bg-amber-400 disabled:opacity-50"
                                  >
                                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                                  </button>
                                </div>
                              </div>
                            </form>
                          ) : item.nama_pejabat ? (
                            <span className="font-medium text-gray-800">
                              {item.nama_pejabat}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">
                              Belum ditetapkan
                            </span>
                          )}
                        </td>

                        {/* 4. Aksi */}
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                disabled={isSaving || isDeletingFoto || isCleaning}
                                className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                              >
                                Edit
                              </button>
                            )}

                            {hasExtraFiles && (
                              <button
                                type="button"
                                onClick={() => handleRetryCleanup(item)}
                                disabled={isCleaning || isSaving || isDeletingFoto}
                                className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-200 disabled:opacity-50"
                              >
                                {isCleaning ? "Membersihkan..." : "Bersihkan File Lama"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
