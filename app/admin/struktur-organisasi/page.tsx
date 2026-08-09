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

  // Cleanup object URL preview saat unmount atau previewUrl berubah
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Auto dismiss success toast message after 4 seconds
  useEffect(() => {
    if (!pesanSukses) return

    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [pesanSukses])

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

  // Buka Form Edit Slot (Inline Edit)
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
    setWarningFile(null)
    setErrorForm(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (
      !(STRUKTUR_ORGANISASI_ALLOWED_MIME_TYPES as readonly string[]).includes(
        file.type
      )
    ) {
      setErrorForm("Format file foto harus berupa JPEG, PNG, atau WebP.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > STRUKTUR_ORGANISASI_MAX_FILE_SIZE_BYTES) {
      setErrorForm("Ukuran file foto melebihi batas maksimal 5 MB.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > STRUKTUR_ORGANISASI_PERFORMANCE_WARNING_BYTES) {
      setWarningFile(
        "Ukuran foto di atas 2 MB. Disarankan kompresi untuk menghemat kuota."
      )
    }

    setSelectedFile(file)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  // Generasi Nama File Aman (MIME type extension + random UUID)
  const getSafeFileName = (file: File): string => {
    let ext = "jpg"
    if (file.type === "image/png") ext = "png"
    if (file.type === "image/webp") ext = "webp"
    const randomId = crypto.randomUUID()
    return `${randomId}.${ext}`
  }

  // Rekonsiliasi Otomatis Hapus File Tambahan Lama
  const rekonsiliasiFolderSlot = async (
    record: StrukturOrganisasi
  ): Promise<{ success: boolean; remainingCount: number }> => {
    const slotKey = record.slot_key
    const folderPath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto`

    try {
      const { data: fileList, error: listError } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .list(folderPath, { limit: 100 })

      if (listError || !fileList) {
        return { success: false, remainingCount: 0 }
      }

      const activeFileName =
        record.foto_storage_path &&
        isValidStoragePath(record.foto_storage_path, slotKey)
          ? record.foto_storage_path.slice(folderPath.length + 1)
          : null

      const filesToDelete = fileList
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

      if (filesToDelete.length === 0) {
        setCleanupState((prev) => ({
          ...prev,
          [slotKey]: { sedangMemeriksa: false, fileTambahan: [], gagalMemeriksa: false },
        }))
        return { success: true, remainingCount: 0 }
      }

      const fullPathsToDelete = filesToDelete.map((f) => `${folderPath}/${f}`)
      const { error: removeError } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .remove(fullPathsToDelete)

      if (removeError) {
        setCleanupState((prev) => ({
          ...prev,
          [slotKey]: {
            sedangMemeriksa: false,
            fileTambahan: filesToDelete,
            gagalMemeriksa: true,
          },
        }))
        return { success: false, remainingCount: filesToDelete.length }
      }

      setCleanupState((prev) => ({
        ...prev,
        [slotKey]: { sedangMemeriksa: false, fileTambahan: [], gagalMemeriksa: false },
      }))

      return { success: true, remainingCount: 0 }
    } catch {
      setCleanupState((prev) => ({
        ...prev,
        [slotKey]: { sedangMemeriksa: false, fileTambahan: [], gagalMemeriksa: true },
      }))
      return { success: false, remainingCount: 0 }
    }
  }

  // Simpan Perubahan (Inline Save Handler)
  const handleSimpan = async (
    e: FormEvent,
    currentRecord: StrukturOrganisasi
  ) => {
    e.preventDefault()
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

      const safeFileName = getSafeFileName(selectedFile)
      newStoragePath = `${STRUKTUR_ORGANISASI_STORAGE_ROOT}/${slotKey}/foto/${safeFileName}`

      const { error: errUpload } = await supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .upload(newStoragePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (errUpload) {
        throw new Error(`Gagal mengunggah foto baru: ${errUpload.message}`)
      }

      const { data: urlData } = supabase.storage
        .from(STRUKTUR_ORGANISASI_BUCKET)
        .getPublicUrl(newStoragePath)

      const publicUrl = urlData?.publicUrl || ""
      if (!isValidHttpsUrl(publicUrl)) {
        await supabase.storage
          .from(STRUKTUR_ORGANISASI_BUCKET)
          .remove([newStoragePath])
        throw new Error(
          "Gagal mendapatkan URL HTTPS publik dari Supabase Storage."
        )
      }

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
        {/* Alert Pesan Sukses (Green 50 / Green 200 / Green 700 with Auto Dismiss 4s, No Close X) */}
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
              className="text-red-600 hover:text-red-900 cursor-pointer"
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
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          /* Tabel Daftar 16 Slot Admin (INLINE EDIT TABLE ROW) */
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
              <table className="w-full text-left text-sm text-gray-600 min-w-[760px] table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[25%]" />
                  <col className="w-[35%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-center">
                      PREVIEW
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-left">
                      JABATAN
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-left">
                      NAMA PEJABAT
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-center">
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
                        {/* 1. Preview Foto (Centered in Cell) */}
                        <td className="px-4 py-3.5 align-middle text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 shadow-sm">
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

                            {/* Control Ganti Foto (Inline di samping Foto saat Editing) */}
                            {isEditing && (
                              <div className="flex flex-col items-start gap-1 flex-shrink-0">
                                <label className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 shadow-xs hover:bg-amber-100 transition-colors">
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
                        <td className="px-4 py-3.5 align-middle text-left">
                          <div className="font-semibold text-gray-900 truncate">
                            {item.nama_jabatan}
                          </div>
                        </td>

                        {/* 3. Nama Pejabat (Bounded Direct Inline Input) */}
                        <td className="px-4 py-3.5 align-middle text-left min-w-0">
                          {isEditing ? (
                            <div className="w-full max-w-full min-w-0 space-y-1">
                              <input
                                id={`nama-pejabat-${item.slot_key}`}
                                type="text"
                                maxLength={200}
                                value={namaPejabat}
                                onChange={(e) => setNamaPejabat(e.target.value)}
                                disabled={isSaving}
                                placeholder="Nama pejabat"
                                className="block w-full min-w-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100"
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

                        {/* 4. Aksi (Centered/Fixed Position Buttons) */}
                        <td className="px-4 py-3.5 align-middle text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={(e) => handleSimpan(e as unknown as FormEvent, item)}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-gray-950 shadow hover:bg-amber-400 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                disabled={isSaving || isCleaning}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                Edit
                              </button>
                            )}

                            {hasExtraFiles && !isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRetryCleanup(item)}
                                disabled={isCleaning || isSaving}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
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
