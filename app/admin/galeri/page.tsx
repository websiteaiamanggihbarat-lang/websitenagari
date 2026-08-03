"use client"

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  GALERI_FOTO_TABLE,
  GALERI_FOTO_BUCKET,
  GALERI_FOTO_STORAGE_ROOT,
  GALERI_FOTO_MAX_FILE_SIZE_BYTES,
  GALERI_FOTO_PERFORMANCE_WARNING_BYTES,
  GALERI_FOTO_ALLOWED_MIME_TYPES,
  fetchSemuaGaleriFotoAdmin,
  type GaleriFoto,
} from "@/lib/galeri"

export default function AdminGaleriPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // State data
  const [items, setItems] = useState<GaleriFoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorDaftar, setErrorDaftar] = useState<string | null>(null)

  // State form
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [teksAlt, setTeksAlt] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [warningFile, setWarningFile] = useState<string | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  // State operasi
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  // State cleanup upload tertunda (jika upload Storage berhasil tetapi insert DB gagal)
  const [cleanupPath, setCleanupPath] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  // Load data awal
  const loadData = async () => {
    try {
      setIsLoading(true)
      setErrorDaftar(null)
      const data = await fetchSemuaGaleriFotoAdmin()
      setItems(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat seluruh data galeri."
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

  // Buka Form Tambah
  const handleOpenTambah = () => {
    setPesanSukses(null)
    setPesanError(null)
    setErrorForm(null)
    setWarningFile(null)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setTeksAlt("")
    setIsFormOpen(true)
  }

  // Tutup/Batal Form
  const handleBatal = () => {
    setIsFormOpen(false)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setTeksAlt("")
    setWarningFile(null)
    setErrorForm(null)
  }

  // Handler Ganti File
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
    const isValidMime = GALERI_FOTO_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof GALERI_FOTO_ALLOWED_MIME_TYPES)[number]
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

    // Validasi Ukuran Maksimal (10 MB)
    if (file.size > GALERI_FOTO_MAX_FILE_SIZE_BYTES) {
      setErrorForm("Ukuran file melebihi batas maksimal 10 MB.")
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    // Warning Ukuran Performa (> 2 MB)
    if (file.size > GALERI_FOTO_PERFORMANCE_WARNING_BYTES) {
      setWarningFile("Ukuran file lebih dari 2 MB. Direkomendasikan melakukan kompresi agar memuat lebih cepat di HP.")
    }

    // Buat Object URL preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreview = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(newPreview)
  }

  // Sanitasi Nama File
  const getSafeFileName = (originalName: string): string => {
    const lastDotIndex = originalName.lastIndexOf(".")
    const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName
    const ext = lastDotIndex !== -1 ? originalName.slice(lastDotIndex).toLowerCase() : ".jpg"

    const cleanBase = baseName
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9._-]/g, "")
      .slice(0, 50) || "foto"

    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return `${timestamp}-${randomSuffix}-${cleanBase}${ext}`
  }

  // Safe Create Handler
  const handleSimpan = async (e: FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    setPesanSukses(null)
    setPesanError(null)
    setErrorForm(null)

    // Validasi File
    if (!selectedFile) {
      setErrorForm("Silakan pilih file foto terlebih dahulu.")
      return
    }

    // Normalisasi Teks Alt (Opsional)
    const cleanAlt = teksAlt.trim()
    const finalAlt = cleanAlt === "" ? null : cleanAlt

    if (finalAlt && finalAlt.length > 300) {
      setErrorForm("Teks alternatif maksimal 300 karakter.")
      return
    }

    try {
      setIsSaving(true)

      // 1. Generate Record UUID
      const fotoId = crypto.randomUUID()

      // 2. Format Storage Path
      const safeFileName = getSafeFileName(selectedFile.name)
      const storagePath = `${GALERI_FOTO_STORAGE_ROOT}/${fotoId}/foto/${safeFileName}`

      // 3. Upload File ke Storage
      const { error: errUpload } = await supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (errUpload) {
        throw new Error(`Gagal mengunggah foto ke Storage: ${errUpload.message}`)
      }

      // 4. Ambil dan Validasi Public URL
      const { data: urlData } = supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .getPublicUrl(storagePath)

      const publicUrl = urlData?.publicUrl || ""
      if (!publicUrl || !publicUrl.startsWith("https://")) {
        // Rollback Upload jika URL tidak valid
        await supabase.storage.from(GALERI_FOTO_BUCKET).remove([storagePath])
        throw new Error("Gagal mendapatkan URL HTTPS publik dari Supabase Storage.")
      }

      // 5. Insert Record ke Database
      const { error: errInsert } = await supabase
        .from(GALERI_FOTO_TABLE)
        .insert({
          id: fotoId,
          foto_url: publicUrl,
          foto_storage_path: storagePath,
          teks_alt: finalAlt,
          is_active: true,
        })

      if (errInsert) {
        // Rollback Upload jika DB Insert gagal
        const { error: errRemove } = await supabase.storage
          .from(GALERI_FOTO_BUCKET)
          .remove([storagePath])

        if (errRemove) {
          setCleanupPath(storagePath)
          throw new Error(
            `Gagal menyimpan data database: ${errInsert.message}. File Storage juga gagal dibersihkan secara otomatis.`
          )
        }

        throw new Error(`Gagal menyimpan data database: ${errInsert.message}. File Storage telah dibersihkan.`)
      }

      // Sukses
      setPesanSukses("Foto galeri berhasil ditambahkan.")
      handleBatal()
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan foto."
      setErrorForm(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Cleanup Upload Tertunda
  const handleCleanupUpload = async () => {
    if (!cleanupPath || isCleaningUp) return

    try {
      setIsCleaningUp(true)
      const { error } = await supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .remove([cleanupPath])

      if (error) {
        throw new Error(`Gagal membersihkan file: ${error.message}`)
      }

      setCleanupPath(null)
      setPesanSukses("File gagal unggah berhasil dibersihkan dari Storage.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membersihkan file."
      setPesanError(msg)
    } finally {
      setIsCleaningUp(false)
    }
  }

  // Validasi Path Sebelum Delete
  const isValidDeletePath = (path: string, recordId: string): boolean => {
    if (!path || typeof path !== "string") return false
    const expectedPrefix = `${GALERI_FOTO_STORAGE_ROOT}/${recordId}/foto/`
    if (!path.startsWith(expectedPrefix)) return false
    const fileName = path.slice(expectedPrefix.length)
    if (!fileName || fileName.includes("/") || fileName.includes("..") || fileName === "." || fileName === "..") {
      return false
    }
    return /^[A-Za-z0-9._-]+$/.test(fileName)
  }

  // Safe Delete Handler
  const handleHapus = async (item: GaleriFoto) => {
    if (deletingId) return

    const teksKonfirmasi = item.teks_alt
      ? `dengan teks alternatif "${item.teks_alt}"`
      : "ini"

    const konfirmasi = confirm(
      `Apakah Anda yakin ingin menghapus foto ${teksKonfirmasi} secara permanen?`
    )
    if (!konfirmasi) return

    setPesanSukses(null)
    setPesanError(null)

    try {
      setDeletingId(item.id)

      // Step 1: Set is_active = false secara internal
      const { error: errDeactivate } = await supabase
        .from(GALERI_FOTO_TABLE)
        .update({ is_active: false })
        .eq("id", item.id)

      if (errDeactivate) {
        throw new Error(`Gagal menonaktifkan status foto: ${errDeactivate.message}`)
      }

      // Step 2: Validasi Storage Path
      if (!isValidDeletePath(item.foto_storage_path, item.id)) {
        throw new Error("Path file Storage tidak sesuai format yang valid. Data aman dan siap di-retry.")
      }

      // Step 3: Check & List Storage Object
      const folderPath = `${GALERI_FOTO_STORAGE_ROOT}/${item.id}/foto`
      const fileName = item.foto_storage_path.slice(folderPath.length + 1)

      const { data: fileList, error: errList } = await supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .list(folderPath)

      if (errList) {
        throw new Error(`Gagal memeriksa keberadaan file di Storage: ${errList.message}. Silakan lakukan Retry Hapus.`)
      }

      const fileExists = (fileList || []).some((f) => f.name === fileName)

      // Step 4: Remove File jika masih ada
      if (fileExists) {
        const { error: errRemove } = await supabase.storage
          .from(GALERI_FOTO_BUCKET)
          .remove([item.foto_storage_path])

        if (errRemove) {
          throw new Error(`Gagal menghapus file dari Storage: ${errRemove.message}. Silakan lakukan Retry Hapus.`)
        }

        // Verifikasi Ulang
        const { data: reCheckList } = await supabase.storage
          .from(GALERI_FOTO_BUCKET)
          .list(folderPath)

        const stillExists = (reCheckList || []).some((f) => f.name === fileName)
        if (stillExists) {
          throw new Error("File Storage masih terdeteksi setelah penghapusan. Silakan lakukan Retry Hapus.")
        }
      }

      // Step 5: Hapus Record Database
      const { error: errDeleteDb } = await supabase
        .from(GALERI_FOTO_TABLE)
        .delete()
        .eq("id", item.id)

      if (errDeleteDb) {
        throw new Error(`File Storage telah bersih, namun gagal menghapus record database: ${errDeleteDb.message}. Silakan Retry Hapus.`)
      }

      // Sukses Hapus
      setPesanSukses("Foto galeri beserta file Storage berhasil dihapus permanen.")
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus foto."
      setPesanError(msg)
      await loadData()
    } finally {
      setDeletingId(null)
    }
  }

  // Retry Hapus Handler (untuk record is_active = false)
  const handleRetryHapus = async (item: GaleriFoto) => {
    if (deletingId) return

    setPesanSukses(null)
    setPesanError(null)

    try {
      setDeletingId(item.id)

      // Step 1: Validasi Path
      if (!isValidDeletePath(item.foto_storage_path, item.id)) {
        throw new Error("Path file Storage tidak sesuai format yang valid.")
      }

      // Step 2: Check & List Storage
      const folderPath = `${GALERI_FOTO_STORAGE_ROOT}/${item.id}/foto`
      const fileName = item.foto_storage_path.slice(folderPath.length + 1)

      const { data: fileList } = await supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .list(folderPath)

      const fileExists = (fileList || []).some((f) => f.name === fileName)

      // Step 3: Remove file jika ada
      if (fileExists) {
        const { error: errRemove } = await supabase.storage
          .from(GALERI_FOTO_BUCKET)
          .remove([item.foto_storage_path])

        if (errRemove) {
          throw new Error(`Gagal menghapus file dari Storage: ${errRemove.message}`)
        }
      }

      // Step 4: Hapus Record Database
      const { error: errDeleteDb } = await supabase
        .from(GALERI_FOTO_TABLE)
        .delete()
        .eq("id", item.id)

      if (errDeleteDb) {
        throw new Error(`File Storage bersih, gagal menghapus record database: ${errDeleteDb.message}`)
      }

      setPesanSukses("Penghapusan foto galeri berhasil diselesaikan.")
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan penghapusan foto."
      setPesanError(msg)
      await loadData()
    } finally {
      setDeletingId(null)
    }
  }

  // Format tanggal Indonesia
  const formatTanggal = (isoString: string): string => {
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return "-"
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d)
    } catch {
      return "-"
    }
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
                  Kelola Galeri
                </h1>
                <p className="text-xs text-amber-200/80 sm:text-sm">
                  Tambah dan hapus foto yang ditampilkan pada halaman galeri.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isFormOpen && (
                <button
                  type="button"
                  onClick={handleOpenTambah}
                  className="inline-flex cursor-pointer items-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 shadow-md transition-all duration-200 hover:bg-amber-400"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  + Tambah Foto
                </button>
              )}

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

        {/* Alert Cleanup Path Tertunda */}
        {cleanupPath && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm font-medium">
                Terdapat file unggahan yang gagal disimpan ke database.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCleanupUpload}
              disabled={isCleaningUp}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-50"
            >
              {isCleaningUp ? "Membersihkan..." : "Bersihkan File Gagal"}
            </button>
          </div>
        )}

        {/* Form Tambah Foto */}
        {isFormOpen && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Tambah Foto Galeri
              </h2>
              <p className="text-xs text-gray-500">
                Pilih foto dan berikan teks alternatif/deskripsi (opsional) sebelum mengunggah.
              </p>
            </div>

            {errorForm && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleSimpan} className="space-y-6">
              {/* Field File */}
              <div>
                <label
                  htmlFor="input-foto-galeri"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Foto Galeri <span className="text-red-500">*</span>
                </label>

                <input
                  id="input-foto-galeri"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isSaving}
                  className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Format yang didukung: JPEG, PNG, WebP. Maksimal 10 MB.
                </p>

                {warningFile && (
                  <p className="mt-1.5 text-xs font-medium text-amber-700">
                    ⚠️ {warningFile}
                  </p>
                )}
              </div>

              {/* Preview Foto */}
              {previewUrl && (
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Preview Foto:
                  </span>
                  <div className="relative aspect-[4/3] max-w-md overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
                    <img
                      src={previewUrl}
                      alt={teksAlt.trim() || "Pratinjau foto Galeri Nagari"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Field Teks Alternatif / Deskripsi (Opsional) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="input-teks-alt"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Teks Alternatif / Deskripsi Foto (Opsional)
                  </label>
                  <span className="text-xs text-gray-400">
                    {teksAlt.trim().length}/300
                  </span>
                </div>

                <textarea
                  id="input-teks-alt"
                  rows={3}
                  maxLength={300}
                  value={teksAlt}
                  onChange={(e) => setTeksAlt(e.target.value)}
                  disabled={isSaving}
                  placeholder="Contoh: Dokumentasi kegiatan masyarakat Nagari Aia Manggih Barat."
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100 disabled:opacity-60"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Deskripsi singkat isi gambar untuk aksesibilitas pembaca layar (screen reader). Opsional.
                </p>
              </div>

              {/* Tombol Form */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleBatal}
                  disabled={isSaving}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-gray-950 shadow-md hover:bg-amber-400 disabled:opacity-60"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Foto"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel Daftar Foto Admin (4 Kolom) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Daftar Foto Galeri ({items.length})
            </h2>
          </div>

          {/* Error Daftar */}
          {errorDaftar && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
              {errorDaftar}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-bold tracking-wider text-gray-600 uppercase">
                  <th className="px-4 py-3.5">PREVIEW</th>
                  <th className="px-4 py-3.5">TEKS ALTERNATIF / DESKRIPSI</th>
                  <th className="px-4 py-3.5">DITAMBAHKAN</th>
                  <th className="px-4 py-3.5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-gray-500">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                      <p className="text-sm font-medium">Memuat foto galeri...</p>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="mt-3 text-base font-semibold text-gray-900">
                        Belum ada foto galeri yang ditambahkan.
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Gunakan tombol "+ Tambah Foto" di bagian atas untuk menambahkan foto pertama.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isDeleting = deletingId === item.id

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Preview */}
                        <td className="px-4 py-3">
                          <div className="relative aspect-[4/3] w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
                            <img
                              src={item.foto_url}
                              alt={item.teks_alt || "Foto Galeri Nagari"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>

                        {/* Teks Alternatif / Deskripsi */}
                        <td className="px-4 py-3">
                          {item.teks_alt ? (
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {item.teks_alt}
                            </p>
                          ) : (
                            <span className="text-xs italic text-gray-400">
                              Tidak ada deskripsi
                            </span>
                          )}
                        </td>

                        {/* Ditambahkan */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">
                            {formatTanggal(item.created_at)}
                          </span>
                        </td>

                        {/* Aksi (Hapus / Retry Hapus berdasarkan is_active) */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end">
                            {item.is_active ? (
                              <button
                                type="button"
                                onClick={() => handleHapus(item)}
                                disabled={isDeleting}
                                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                <span>{isDeleting ? "Menghapus..." : "Hapus"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRetryHapus(item)}
                                disabled={isDeleting}
                                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                <span>{isDeleting ? "Memproses..." : "Retry Hapus"}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
