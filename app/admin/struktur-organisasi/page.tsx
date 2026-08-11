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

  // Auto dismiss success toast message after 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

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

  // Buka Mode Edit untuk 1 slot
  const handleEdit = (record: StrukturOrganisasi) => {
    setPesanSukses(null)
    setPesanError(null)
    setErrorForm(null)
    setWarningFile(null)

    // Reset file preview jika sebelumnya ada
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setSelectedFile(null)

    setEditingSlot(record.slot_key)
    setNamaPejabat(record.nama_pejabat || "")
  }

  // Batal Inline Edit
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
    const isValidMime = STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES)[number]
    )
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
      setErrorForm("Ukuran file foto melebihi batas maksimal 5 MB.")
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    // Warning Ukuran Performa (> 2 MB)
    if (file.size > STRUKTUR_ORGANISASI_PERFORMANCE_WARNING_BYTES) {
      setWarningFile("Ukuran file lebih dari 2 MB. Kompresi foto direkomendasikan.")
    }

    // Object URL preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreview = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(newPreview)
  }

  // Sanitasi Nama File Foto
  const getSafeFileName = (originalName: string, slotKey: string): string => {
    const lastDotIndex = originalName.lastIndexOf(".")
    const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName
    const ext = lastDotIndex !== -1 ? originalName.slice(lastDotIndex).toLowerCase() : ".jpg"

    const cleanBase = baseName
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9._-]/g, "")
      .slice(0, 40) || "foto"

    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 7)

    return `${slotKey}-${timestamp}-${randomSuffix}-${cleanBase}${ext}`
  }

  // Safe Rekonsiliasi & Cleanup Storage Slot
  const rekonsiliasiFolderSlot = async (
    record: StrukturOrganisasi
  ): Promise<{ success: boolean; deletedCount: number }> => {
    const slotKey = record.slot_key
    const folderPath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto`

    try {
      const { data: fileList, error: errList } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .list(folderPath, { limit: 100 })

      if (errList) {
        console.error("rekonsiliasiFolderSlot list error:", errList)
        return { success: false, deletedCount: 0 }
      }

      const activeFileName =
        record.foto_storage_path &&
        isValidStoragePath(record.foto_storage_path, slotKey)
          ? record.foto_storage_path.slice(folderPath.length + 1)
          : null

      const filesToDelete = (fileList || [])
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
        .map((name) => `${folderPath}/${name}`)

      if (filesToDelete.length > 0) {
        const { error: errRemove } = await supabase.storage
          .from(STRUKTUR_ORGANISASI_BUCKET)
          .remove(filesToDelete)

        if (errRemove) {
          console.error("rekonsiliasiFolderSlot remove error:", errRemove)
          return { success: false, deletedCount: 0 }
        }
      }

      return { success: true, deletedCount: filesToDelete.length }
    } catch (err) {
      console.error("rekonsiliasiFolderSlot catch error:", err)
      return { success: false, deletedCount: 0 }
    }
  }

  // Simpan Inline Edit (Update Nama & Foto)
  const handleSimpan = async (e: FormEvent, currentRecord: StrukturOrganisasi) => {
    e.preventDefault()
    if (isSaving) return

    setPesanSukses(null)
    setPesanError(null)
    setErrorForm(null)

    const namaClean = namaPejabat.trim()
    if (namaClean.length > 200) {
      setErrorForm("Nama pejabat maksimal 200 karakter.")
      return
    }

    try {
      setIsSaving(true)
      const slotKey = currentRecord.slot_key

      let finalFotoUrl = currentRecord.foto_url
      let finalStoragePath = currentRecord.foto_storage_path
      let newUploadedPath: string | null = null

      // Step 1: Upload foto baru jika ada file baru terpilih
      if (selectedFile) {
        const safeFileName = getSafeFileName(selectedFile.name, slotKey)
        const storagePath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto/${safeFileName}`

        const { error: errUpload } = await supabase.storage
          .from(STRUKTUR_ORGANISASI_BUCKET)
          .upload(storagePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type,
          })

        if (errUpload) {
          throw new Error(`Gagal mengunggah foto baru ke Storage: ${errUpload.message}`)
        }

        newUploadedPath = storagePath

        const { data: publicUrlData } = supabase.storage
          .from(STRUKTUR_ORGANISASI_BUCKET)
          .getPublicUrl(storagePath)

        const publicUrl = publicUrlData?.publicUrl
        if (!publicUrl) {
          await supabase.storage.from(STRUKTUR_ORGANISASI_BUCKET).remove([storagePath])
          throw new Error("Gagal mendapatkan URL publik foto baru.")
        }

        finalFotoUrl = publicUrl
        finalStoragePath = storagePath
      }

      // Step 2: Update database record SQL
      const payloadUpdate = {
        nama_pejabat: namaClean || null,
        foto_url: finalFotoUrl || null,
        foto_storage_path: finalStoragePath || null,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedRow, error: errUpdateDb } = await supabase
        .from(STRUKTUR_ORGANISASI_TABLE)
        .update(payloadUpdate)
        .eq("slot_key", slotKey)
        .select("*")
        .single()

      if (errUpdateDb || !updatedRow) {
        // Rollback upload file baru jika insert DB gagal
        if (newUploadedPath) {
          await supabase.storage
            .from(STRUKTUR_ORGANISASI_BUCKET)
            .remove([newUploadedPath])
        }

        throw new Error(
          `Gagal memperbarui database: ${errUpdateDb?.message || "Data tidak ditemukan."}. File baru telah dibersihkan.`
        )
      }

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

  // Retry Cleanup Handler
  const handleRetryCleanup = async (record: StrukturOrganisasi) => {
    const slotKey = record.slot_key
    if (isCleaningUpSlot[slotKey]) return

    setPesanSukses(null)
    setPesanError(null)

    try {
      setIsCleaningUpSlot((prev) => ({ ...prev, [slotKey]: true }))

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
    <div className="min-h-screen bg-admin-warm pb-20 text-[#1F2937]">
      {/* Top Header Panel - Warm Modern Government Theme */}
      <header className="bg-gradient-to-r from-[#1A1200] via-[#2C1B01] to-[#3D2605] border-b border-[#B6A587]/30 shadow-lg text-white mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#B6A587]/15 hover:bg-[#B6A587]/30 text-[#B6A587] hover:text-white border border-[#B6A587]/30 transition-all transform hover:-translate-x-1 cursor-pointer"
              title="Kembali ke Dashboard Admin"
              aria-label="Kembali ke Dashboard Admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Kelola Struktur Organisasi
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Pemerintahan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Perbarui data nama &amp; foto pejabat struktur pemerintahan Nagari Aia Manggih Barat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-200 hover:text-white font-semibold px-4 py-2.5 text-xs sm:text-sm border border-red-500/30 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Global Toast Notifications */}
        <div aria-live="polite">
          {pesanSukses && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 shadow-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-green-600"
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
                <span>{pesanSukses}</span>
              </div>
            </div>
          )}

          {pesanError && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
              <div className="flex items-center justify-between gap-2">
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
                  <span>{pesanError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPesanError(null)}
                  className="text-red-600 hover:text-red-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Utama */}
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
            <p className="text-sm font-medium text-gray-600">
              Memuat data struktur organisasi...
            </p>
          </div>
        ) : errorDaftar ? (
          /* Error Load Utama */
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Struktur organisasi belum dapat dimuat.
            </h3>
            <p className="text-sm text-gray-600 mb-6">{errorDaftar}</p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2604] transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          /* Tabel Daftar 16 Slot Admin (INLINE EDIT TABLE ROW) */
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Section Krem/White */}
            <div className="p-5 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Daftar Struktur Organisasi
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Total {items.length} jabatan tetap Nagari Aia Manggih Barat
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px] table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[30%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold text-center">
                      PREVIEW
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-left">
                      JABATAN
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-left">
                      NAMA PEJABAT
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-right">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
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
                        className={`transition-colors ${
                          isEditing
                            ? "bg-[#f7f2e8]/40"
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        {/* 1. Preview Foto (Centered & Fixed Layout) */}
                        <td className="px-6 py-4 align-middle text-center">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 shadow-xs">
                              {previewUrl && isEditing ? (
                                <img
                                  src={previewUrl}
                                  alt={`Pratinjau foto baru ${item.nama_jabatan}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : item.foto_url && !imageFailed ? (
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

                            {/* Control Ganti Foto (Inline tanpa menggeser layout) */}
                            {isEditing && (
                              <div className="flex flex-col items-center sm:items-start gap-1 flex-shrink-0">
                                <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-2.5 py-1 text-xs font-semibold text-[#6b4b1d] shadow-xs hover:bg-[#ebdcc4] transition-colors">
                                  <span>Ganti Foto</span>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    disabled={isSaving}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {isEditing && warningFile && (
                            <p className="mt-1 text-[10px] font-medium text-amber-700 text-center">
                              ⚠️ {warningFile}
                            </p>
                          )}
                        </td>

                        {/* 2. Jabatan (Read-Only, Fixed Position) */}
                        <td className="px-6 py-4 align-middle text-left font-semibold text-gray-900">
                          <div className="truncate">
                            {item.nama_jabatan}
                          </div>
                        </td>

                        {/* 3. Nama Pejabat (Bounded Direct Inline Input) */}
                        <td className="px-6 py-4 align-middle text-left min-w-0">
                          {isEditing ? (
                            <div className="w-full max-w-full min-w-0 space-y-1">
                              <input
                                id={`nama-pejabat-${item.slot_key}`}
                                type="text"
                                maxLength={200}
                                value={namaPejabat}
                                onChange={(e) => setNamaPejabat(e.target.value)}
                                onFocus={(e) => e.currentTarget.select()}
                                disabled={isSaving}
                                placeholder="Masukkan nama pejabat..."
                                className="block w-full min-w-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white disabled:bg-gray-100"
                              />
                              {errorForm && (
                                <p className="text-xs font-medium text-red-600">
                                  {errorForm}
                                </p>
                              )}
                            </div>
                          ) : item.nama_pejabat ? (
                            <span className="font-medium text-gray-800 truncate block">
                              {item.nama_pejabat}
                            </span>
                          ) : (
                            <span className="italic text-gray-400 block">
                              Belum ditetapkan
                            </span>
                          )}
                        </td>

                        {/* 4. Aksi (Right-Aligned Fixed Position Buttons) */}
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleBatal}
                                  disabled={isSaving}
                                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleSimpan(e as unknown as FormEvent, item)}
                                  disabled={isSaving}
                                  className="inline-flex items-center justify-center rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                disabled={isSaving || isCleaning}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                Edit
                              </button>
                            )}

                            {hasExtraFiles && !isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRetryCleanup(item)}
                                disabled={isCleaning || isSaving}
                                className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100 disabled:opacity-50 cursor-pointer whitespace-nowrap"
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
