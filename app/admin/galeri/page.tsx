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
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

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
  const { showSuccess, showError } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<GaleriFoto | null>(null)

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

    // Validasi Teks Alt (Opsional, max 300 char)
    const altClean = teksAlt.trim()
    if (altClean.length > 300) {
      setErrorForm("Teks alternatif/deskripsi maksimal 300 karakter.")
      return
    }

    try {
      setIsSaving(true)

      // Step 1: Generate Record ID & Safe Storage Path
      const recordId = crypto.randomUUID()
      const safeFileName = getSafeFileName(selectedFile.name)
      const storagePath = `${GALERI_FOTO_STORAGE_ROOT}/${recordId}/foto/${safeFileName}`

      // Step 2: Upload file ke Supabase Storage (public bucket)
      const { error: errUpload } = await supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        })

      if (errUpload) {
        throw new Error(`Gagal mengunggah file ke Storage: ${errUpload.message}`)
      }

      // Tandai path untuk cleanup jika insert DB selanjutnya gagal
      setCleanupPath(storagePath)

      // Step 3: Dapatkan URL publik file
      const { data: publicUrlData } = supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .getPublicUrl(storagePath)

      const publicUrl = publicUrlData?.publicUrl
      if (!publicUrl) {
        throw new Error("Gagal mendapatkan URL publik file foto yang diunggah.")
      }

      // Step 4: Insert Record Baru ke Database SQL
      const { error: errInsert } = await supabase.from(GALERI_FOTO_TABLE).insert([
        {
          id: recordId,
          foto_url: publicUrl,
          foto_storage_path: storagePath,
          teks_alt: altClean || null,
          urutan: 0,
          is_active: true,
        },
      ])

      if (errInsert) {
        // PERHATIAN: Upload Storage berhasil tetapi insert DB gagal.
        // Coba bersihkan file dari Storage agar tidak menjadi orphan file.
        await supabase.storage.from(GALERI_FOTO_BUCKET).remove([storagePath])
        setCleanupPath(null)
        throw new Error(`Upload berhasil tetapi gagal menyimpan data ke database: ${errInsert.message}`)
      }

      // Hapus status cleanup path karena insert DB sukses total
      setCleanupPath(null)
      setPesanSukses("Foto galeri berhasil ditambahkan.")

      // Reset form dan reload data
      handleBatal()
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan foto."
      setErrorForm(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Cleanup manual jika file tertunda di Storage
  const handleCleanupUpload = async () => {
    if (!cleanupPath || isCleaningUp) return
    try {
      setIsCleaningUp(true)
      await supabase.storage.from(GALERI_FOTO_BUCKET).remove([cleanupPath])
      setCleanupPath(null)
      setPesanSukses("File gagal unggah berhasil dibersihkan dari Storage.")
    } catch (err) {
      console.error("Cleanup error:", err)
    } finally {
      setIsCleaningUp(false)
    }
  }

  // Validasi Safe Delete Path
  const isValidDeletePath = (path: string | null, targetId: string): boolean => {
    if (!path) return false
    const expectedPrefix = `${GALERI_FOTO_STORAGE_ROOT}/${targetId}/foto/`
    return path.startsWith(expectedPrefix)
  }

  const handleHapus = (item: GaleriFoto) => {
    if (deletingId) return
    setDeleteTarget(item)
  }

  const executeHapus = async (item: GaleriFoto) => {
    setPesanSukses(null)
    setPesanError(null)

    try {
      setDeletingId(item.id)

      // Step 1: Validasi Path Storage
      if (!isValidDeletePath(item.foto_storage_path, item.id)) {
        throw new Error("Path file Storage tidak sesuai format yang valid.")
      }

      // Step 2: Hapus File dari Supabase Storage
      const { error: errStorage } = await supabase.storage
        .from(GALERI_FOTO_BUCKET)
        .remove([item.foto_storage_path])

      if (errStorage) {
        throw new Error(`Gagal menghapus file foto dari Storage: ${errStorage.message}`)
      }

      // Step 3: Hapus Record Database SQL
      const { error: errDb } = await supabase
        .from(GALERI_FOTO_TABLE)
        .delete()
        .eq("id", item.id)

      if (errDb) {
        // Catat di database bahwa storage telah terhapus tapi DB belum
        await supabase
          .from(GALERI_FOTO_TABLE)
          .update({ is_active: false })
          .eq("id", item.id)

        throw new Error(
          `File foto di Storage berhasil dihapus, namun gagal menghapus data dari database: ${errDb.message}. Status diset nonaktif.`
        )
      }

      // Sukses Hapus
      const msg = "Foto galeri berhasil dihapus."
      setPesanSukses(msg)
      showSuccess(msg)
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus foto."
      setPesanError(msg)
      showError(msg)
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
        throw new Error(`Gagal menghapus record database: ${errDeleteDb.message}`)
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
                  Kelola Galeri Foto
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Dokumentasi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola foto dokumentasi &amp; kegiatan Nagari Aia Manggih Barat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isFormOpen && (
              <button
                type="button"
                onClick={handleOpenTambah}
                className="inline-flex items-center gap-2 rounded-xl bg-[#B6A587] hover:bg-[#c9b99b] text-[#1A1200] font-bold px-4 py-2.5 text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#1A1200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Foto Baru</span>
              </button>
            )}

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
                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{pesanSukses}</span>
              </div>
            </div>
          )}

          {pesanError && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{pesanError}</span>
              </div>
            </div>
          )}
        </div>

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
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
            >
              {isCleaningUp ? "Membersihkan..." : "Bersihkan File Gagal"}
            </button>
          </div>
        )}

        {/* Form Tambah Foto */}
        {isFormOpen && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Tambah Foto Galeri
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Pilih foto dan berikan teks alternatif/deskripsi (opsional) sebelum mengunggah.
              </p>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={handleSimpan} className="p-6 space-y-6">
              {errorForm && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorForm}
                </div>
              )}

              {/* Field File */}
              <div>
                <label
                  htmlFor="input-foto-galeri"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
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
                  className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-700 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:cursor-not-allowed disabled:opacity-60 file:mr-3 file:rounded-md file:border-0 file:bg-[#2c1b01] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
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
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Teks Alternatif / Deskripsi Foto <span className="text-xs font-normal text-gray-500">(Opsional)</span>
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
                  onFocus={(e) => e.currentTarget.select()}
                  disabled={isSaving}
                  placeholder="Contoh: Dokumentasi kegiatan masyarakat Nagari Aia Manggih Barat."
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y disabled:bg-gray-100 disabled:opacity-60"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Deskripsi singkat isi gambar untuk aksesibilitas pembaca layar (screen reader). Opsional.
                </p>
              </div>

              {/* Footer Buttons (Batal & Simpan) */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleBatal}
                  disabled={isSaving}
                  className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Foto"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel Daftar Foto Admin (Outer Card Konsisten) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header Section Krem/White */}
          <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Daftar Foto Galeri
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Menampilkan seluruh foto galeri Nagari.
              </p>
            </div>
            {items.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#f7f2e8] px-3 py-1 text-xs font-semibold text-[#2c1b01] border border-[#2c1b01]/10">
                Total: {items.length} Foto
              </span>
            )}
          </div>

          {/* Error Daftar */}
          {errorDaftar && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
              {errorDaftar}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold w-[20%]">PREVIEW</th>
                  <th scope="col" className="px-6 py-4 font-bold w-[45%]">TEKS ALTERNATIF / DESKRIPSI</th>
                  <th scope="col" className="px-6 py-4 font-bold w-[20%]">DITAMBAHKAN</th>
                  <th scope="col" className="px-6 py-4 font-bold text-right w-[15%]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-gray-500">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#6b4b1d] border-t-transparent"></div>
                      <p className="text-sm font-medium">Memuat foto galeri...</p>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      <p className="text-base font-semibold text-gray-700">Belum ada foto galeri.</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Gunakan tombol &quot;Tambah Foto&quot; di bagian atas untuk mendaftarkan foto pertama.
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
                        <td className="py-4 px-6">
                          <div className="relative h-14 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-xs">
                            <img
                              src={item.foto_url}
                              alt={item.teks_alt || "Foto Galeri Nagari"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>

                        {/* Teks Alternatif / Deskripsi */}
                        <td className="py-4 px-6 text-gray-900">
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
                        <td className="py-4 px-6 text-gray-600">
                          <span className="text-xs">
                            {formatTanggal(item.created_at)}
                          </span>
                        </td>

                        {/* Aksi (Hapus / Retry Hapus) */}
                        <td className="py-4 px-6 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {item.is_active ? (
                              <button
                                type="button"
                                onClick={() => handleHapus(item)}
                                disabled={isDeleting}
                                className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                {isDeleting ? "Menghapus..." : "Hapus"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRetryHapus(item)}
                                disabled={isDeleting}
                                className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                {isDeleting ? "Proses..." : "Coba Hapus Lagi"}
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Foto Galeri?"
        message={
          <>
            Apakah Anda yakin ingin menghapus foto galeri ini secara permanen?
            <br />
            File di Storage dan data pada database akan dihapus.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(deletingId)}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeHapus(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
