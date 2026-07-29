"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_FOTO_KESENIAN,
  GaleriKesenianTradisional,
  KesenianTradisional,
  getLabelKategoriKesenian,
} from "@/lib/kesenian"

interface PageProps {
  params: Promise<{ kesenianId: string }>
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

export default function AdminGaleriKesenianPage({ params }: PageProps) {
  const routeParams = useParams()
  const unwrappedParams = typeof use === "function" && params ? use(params) : null
  const kesenianId =
    unwrappedParams?.kesenianId ||
    (Array.isArray(routeParams?.kesenianId)
      ? routeParams.kesenianId[0]
      : routeParams?.kesenianId) ||
    ""

  const [kesenian, setKesenian] = useState<KesenianTradisional | null>(null)
  const [galeriList, setGaleriList] = useState<GaleriKesenianTradisional[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await keluarDariAdmin("Logout error")
  }

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  // Multi-upload queue & report state
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [uploadReports, setUploadReports] = useState<UploadReportItem[]>([])

  // Editing state for existing photo metadata
  const [editingPhotoState, setEditingPhotoState] = useState<
    Record<string, { caption: string; teks_alt: string; urutan: number }>
  >({})

  const periksaSesi = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      window.location.href = "/login"
      return false
    }
    return true
  }

  const fetchKesenianDanGaleri = async () => {
    if (!kesenianId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const valid = await periksaSesi()
    if (!valid) {
      setLoading(false)
      return
    }

    try {
      // 1. Baca data utama kesenian
      const { data: dataKesenian, error: errKesenian } = await supabase
        .from("kesenian_tradisional")
        .select("*")
        .eq("id", kesenianId)
        .maybeSingle()

      if (errKesenian || !dataKesenian) {
        setKesenian(null)
        setLoading(false)
        return
      }

      setKesenian(dataKesenian as KesenianTradisional)

      // 2. Baca seluruh galeri foto kesenian (aktif dan nonaktif)
      const { data: dataGaleri, error: errGaleri } = await supabase
        .from("galeri_kesenian_tradisional")
        .select("*")
        .eq("kesenian_id", kesenianId)

      if (errGaleri) {
        setPesanError(`Gagal membaca galeri foto: ${errGaleri.message}`)
        setLoading(false)
        return
      }

      const listRaw = (dataGaleri as GaleriKesenianTradisional[]) || []

      // 3. Urutkan: cover aktif terlebih dahulu -> urutan ASC -> created_at ASC
      const listSorted = [...listRaw].sort((a, b) => {
        const aIsCoverActive = a.is_cover && a.is_active
        const bIsCoverActive = b.is_cover && b.is_active

        if (aIsCoverActive && !bIsCoverActive) return -1
        if (!aIsCoverActive && bIsCoverActive) return 1

        if (a.urutan !== b.urutan) return a.urutan - b.urutan

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateA - dateB
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan memuat data: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKesenianDanGaleri()
  }, [kesenianId])

  // --- Handlers Multi-Upload ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const newQueue: UploadQueueItem[] = []

    Array.from(selectedFiles).forEach((file, index) => {
      let errorValidation = ""
      const mimeValid = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      const extValid = ["jpg", "jpeg", "png", "webp"].includes(ext)

      if (!mimeValid && !extValid) {
        errorValidation = "Format file harus JPEG, PNG, atau WebP."
      } else if (file.size > 2 * 1024 * 1024) {
        errorValidation = "Ukuran file melebihi batas maksimal 2 MB."
      }

      // Default alt text dari nama file tanpa ekstensi
      const baseAltName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
      const defaultAlt = `Foto ${kesenian?.nama_kesenian || "Kesenian"} - ${baseAltName}`

      newQueue.push({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        teks_alt: defaultAlt,
        caption: "",
        urutan: galeriList.length + index + 1,
        errorValidation: errorValidation || undefined,
      })
    })

    setUploadQueue((prev) => [...prev, ...newQueue])
    e.target.value = ""
  }

  const handleUpdateQueueItem = (
    id: string,
    field: "teks_alt" | "caption" | "urutan",
    value: string | number
  ) => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          [field]: field === "urutan" ? Math.max(0, parseInt(String(value || "0"), 10) || 0) : String(value),
        }
      })
    )
  }

  const handleHapusQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id))
  }

  const handleProsesUploadQueue = async () => {
    if (uploadQueue.length === 0 || isUploading) return

    const validItems = uploadQueue.filter((item) => !item.errorValidation)
    if (validItems.length === 0) {
      setPesanError("Tidak ada file valid yang siap diunggah.")
      return
    }

    // Validasi teks_alt wajib
    const missingAlt = validItems.find((item) => !item.teks_alt.trim())
    if (missingAlt) {
      setPesanError(`Teks alternatif (alt) wajib diisi untuk file "${missingAlt.file.name}".`)
      return
    }

    setIsUploading(true)
    setPesanSukses(null)
    setPesanError(null)
    setUploadReports([])

    const reports: UploadReportItem[] = []

    // Upload sekuensial per file (concurrency terbatas 1)
    for (const item of validItems) {
      const namaAman = buatNamaFileAman(item.file.name)
      const timestamp = Date.now()
      const randomId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      const storagePath = `kesenian-tradisional/${kesenianId}/${timestamp}-${randomId}-${namaAman}`

      // Step 1: Upload ke Supabase Storage
      const { error: errUpload } = await supabase.storage
        .from(BUCKET_FOTO_KESENIAN)
        .upload(storagePath, item.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: item.file.type || "image/jpeg",
        })

      if (errUpload) {
        reports.push({
          fileName: item.file.name,
          status: "gagal",
          alasan: `Gagal unggah Storage: ${errUpload.message}`,
          rollbackStorage: "tidak_perlu",
        })
        continue
      }

      // Step 2: Ambil Public URL
      const { data: publicData } = supabase.storage
        .from(BUCKET_FOTO_KESENIAN)
        .getPublicUrl(storagePath)

      const fotoUrl = publicData?.publicUrl || ""

      // Step 3: Insert record ke database galeri_kesenian_tradisional
      const { error: errInsert } = await supabase
        .from("galeri_kesenian_tradisional")
        .insert({
          kesenian_id: kesenianId,
          foto_url: fotoUrl,
          storage_path: storagePath,
          caption: item.caption.trim() || null,
          teks_alt: item.teks_alt.trim(),
          is_cover: false,
          is_active: true,
          urutan: Math.max(0, item.urutan || 0),
        })

      if (errInsert) {
        // Step 4: Jika Insert DB gagal -> Rollback Hapus file Storage
        const { error: errRollback } = await supabase.storage
          .from(BUCKET_FOTO_KESENIAN)
          .remove([storagePath])

        reports.push({
          fileName: item.file.name,
          status: "gagal",
          alasan: `Gagal simpan database: ${errInsert.message}`,
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
    await fetchKesenianDanGaleri()
  }

  // --- Handlers Pengelolaan Metadata Foto ---
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

  const handleSimpanMetadata = async (item: GaleriKesenianTradisional) => {
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

    const { error: errUpdate } = await supabase
      .from("galeri_kesenian_tradisional")
      .update({
        caption: currentState.caption.trim() || null,
        teks_alt: altClean,
        urutan: Math.max(0, currentState.urutan || 0),
      })
      .eq("id", item.id)

    if (errUpdate) {
      setPesanError(`Gagal memperbarui metadata foto: ${errUpdate.message}`)
    } else {
      setPesanSukses("Metadata foto berhasil diperbarui.")
      await fetchKesenianDanGaleri()
    }
    setActionLoadingId(null)
  }

  // --- Handler Menetapkan Cover ---
  const handleJadikanCover = async (targetPhoto: GaleriKesenianTradisional) => {
    if (!targetPhoto.is_active) {
      setPesanError("Hanya foto aktif yang dapat dijadikan foto utama (cover).")
      return
    }

    setActionLoadingId(targetPhoto.id)
    setPesanSukses(null)
    setPesanError(null)

    // 1. Simpan ID cover lama
    const oldCover = galeriList.find((g) => g.is_cover && g.is_active && g.id !== targetPhoto.id)

    // 2. Ubah cover lama menjadi is_cover = false terlebih dahulu
    if (oldCover) {
      const { error: errUnsetOld } = await supabase
        .from("galeri_kesenian_tradisional")
        .update({ is_cover: false })
        .eq("id", oldCover.id)

      if (errUnsetOld) {
        setPesanError(`Gagal menonaktifkan foto utama lama: ${errUnsetOld.message}`)
        setActionLoadingId(null)
        return
      }
    }

    // 3. Ubah target menjadi is_cover = true & is_active = true
    const { error: errSetTarget } = await supabase
      .from("galeri_kesenian_tradisional")
      .update({ is_cover: true, is_active: true })
      .eq("id", targetPhoto.id)

    if (errSetTarget) {
      // 4. Jika langkah target gagal -> Rollback cover lama menjadi is_cover = true
      if (oldCover) {
        await supabase
          .from("galeri_kesenian_tradisional")
          .update({ is_cover: true })
          .eq("id", oldCover.id)
      }

      if (errSetTarget.code === "23505") {
        setPesanError("Gagal menetapkan foto utama. Terdapat konflik foto cover aktif (Postgres 23505).")
      } else {
        setPesanError(`Gagal menetapkan foto utama: ${errSetTarget.message}`)
      }
    } else {
      setPesanSukses(`Foto "${targetPhoto.teks_alt}" berhasil ditetapkan sebagai foto utama cover.`)
      await fetchKesenianDanGaleri()
    }
    setActionLoadingId(null)
  }

  // --- Handler Aktif / Nonaktif Foto ---
  const handleToggleAktifFoto = async (item: GaleriKesenianTradisional) => {
    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    const newStatus = !item.is_active

    // Jika foto yang dinonaktifkan adalah cover aktif
    if (!newStatus && item.is_cover) {
      // 1. Nonaktifkan terlebih dahulu kesenian induk
      const { error: errParent } = await supabase
        .from("kesenian_tradisional")
        .update({ is_active: false })
        .eq("id", kesenianId)

      if (errParent) {
        setPesanError(`Gagal menonaktifkan kesenian induk: ${errParent.message}`)
        setActionLoadingId(null)
        return
      }

      // 2. Ubah foto cover: is_cover = false & is_active = false
      const { error: errPhoto } = await supabase
        .from("galeri_kesenian_tradisional")
        .update({ is_cover: false, is_active: false })
        .eq("id", item.id)

      if (errPhoto) {
        setPesanError(`Gagal menonaktifkan foto cover: ${errPhoto.message}`)
      } else {
        setPesanSukses(
          "Foto utama telah dinonaktifkan. Status Kesenian Induk otomatis diubah menjadi Nonaktif karena tidak lagi memiliki foto utama yang aktif."
        )
      }
    } else {
      const { error: errPhoto } = await supabase
        .from("galeri_kesenian_tradisional")
        .update({ is_active: newStatus })
        .eq("id", item.id)

      if (errPhoto) {
        setPesanError(`Gagal mengubah status foto: ${errPhoto.message}`)
      } else {
        setPesanSukses(`Status foto berhasil diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`)
      }
    }

    await fetchKesenianDanGaleri()
    setActionLoadingId(null)
  }

  // --- Handler Hapus Foto (Safe Delete Workflow) ---
  const handleHapusFoto = async (item: GaleriKesenianTradisional) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus foto "${item.teks_alt}" ini?`)
    if (!konfirmasi) return

    setActionLoadingId(item.id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      // Step 1: Jika target cover aktif, nonaktifkan kesenian induk terlebih dahulu
      if (item.is_cover && item.is_active) {
        await supabase
          .from("kesenian_tradisional")
          .update({ is_active: false })
          .eq("id", kesenianId)
      }

      // Step 2: Ubah record galeri menjadi is_active = false, is_cover = false
      await supabase
        .from("galeri_kesenian_tradisional")
        .update({ is_active: false, is_cover: false })
        .eq("id", item.id)

      // Step 3: Hapus file dari Storage
      const { error: errStorage } = await supabase.storage
        .from(BUCKET_FOTO_KESENIAN)
        .remove([item.storage_path])

      if (errStorage) {
        // Step 4: Storage gagal -> biarkan record tetap nonaktif, jangan hapus record DB
        setPesanError(
          `Gagal menghapus file dari Storage: ${errStorage.message}. Foto telah dinonaktifkan di database. Silakan klik tombol 'Coba Hapus Kembali' untuk mengulangi.`
        )
        await fetchKesenianDanGaleri()
        setActionLoadingId(null)
        return
      }

      // Step 5: Storage berhasil -> hapus record galeri dari database
      const { error: errDeleteDb } = await supabase
        .from("galeri_kesenian_tradisional")
        .delete()
        .eq("id", item.id)

      if (errDeleteDb) {
        // Step 6: DB delete gagal setelah file terhapus -> record tetap nonaktif & beri pesan jujur
        setPesanError(
          `File foto di Storage telah terhapus, namun gagal menghapus baris di database: ${errDeleteDb.message}. Record tetap berstatus nonaktif sehingga tidak muncul di publik. Klik 'Retry Hapus Record DB' untuk mencoba menghapus baris database lagi.`
        )
      } else {
        setPesanSukses(
          item.is_cover && item.is_active
            ? "Foto utama berhasil dihapus. Kesenian induk telah dinonaktifkan karena tidak lagi memiliki foto utama."
            : "Foto galeri berhasil dihapus secara permanen."
        )
      }

      await fetchKesenianDanGaleri()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat menghapus foto: ${msg}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // --- Render Handling ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center text-sm text-gray-500">
          <svg className="mx-auto h-8 w-8 animate-spin text-[#8c734b]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-2">Memuat data galeri kesenian...</p>
        </div>
      </div>
    )
  }

  if (!kesenian) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Data Kesenian Tidak Ditemukan</h2>
          <p className="mt-1 text-sm text-gray-500">ID Kesenian tidak valid atau record telah dihapus.</p>
          <Link
            href="/admin/kesenian-tradisional"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4a3210]"
          >
            ← Kembali ke Daftar Kesenian
          </Link>
        </div>
      </div>
    )
  }

  const hasActiveCover = galeriList.some((g) => g.is_cover && g.is_active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/kesenian-tradisional"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Daftar Kesenian"
              aria-label="Kembali ke Daftar Kesenian"
            >
              <svg
                className="w-5 h-5"
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
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Galeri Foto — {kesenian.nama_kesenian}
              </h1>

              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola foto utama, galeri, dan metadata dokumentasi kesenian
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/kesenian-tradisional"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer"
            >
              ← Kembali ke Kelola Kesenian
            </Link>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Ringkasan Status Kesenian Card */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {getLabelKategoriKesenian(kesenian.kategori)}
            </span>

            {kesenian.is_active ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Status Kesenian: Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                Status Kesenian: Nonaktif
              </span>
            )}

            {hasActiveCover ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                ✓ Cover Utama Terpasang
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                ! Belum Ada Cover Utama
              </span>
            )}
          </div>

          <div className="text-xs text-gray-500 font-medium">
            {kesenian.alamat && <span>📍 {kesenian.alamat} | </span>}
            <span>Total: {galeriList.length} Foto</span>
          </div>
        </div>

        {/* Notifications Alert */}
        {pesanSukses && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{pesanSukses}</span>
              </div>
              <button onClick={() => setPesanSukses(null)} className="text-green-600 hover:text-green-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {pesanError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{pesanError}</span>
              </div>
              <button onClick={() => setPesanError(null)} className="text-red-600 hover:text-red-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {!hasActiveCover && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Perhatian:</strong> Kesenian ini belum memiliki foto utama (cover) yang aktif. Silakan unggah foto dan klik tombol <strong>&quot;Jadikan Cover Utama&quot;</strong> agar kesenian ini dapat diaktifkan.
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Form Multi-Upload Foto */}
        <div className="mb-10 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Unggah Multi-Foto Galeri Baru</h2>
          <p className="text-xs text-gray-500 mb-4">
            Pilih beberapa file sekaligus (format JPEG, PNG, WebP; maks 2 MB per file). Pastikan mengisi teks alternatif untuk aksesibilitas sebelum memproses unggahan.
          </p>

          {/* Input File Selector */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-1 text-sm font-semibold text-gray-700">Klik untuk memilih file foto galeri</p>
                <p className="text-xs text-gray-500">Mendukung ungggah sekaligus beberapa foto (JPEG, PNG, WebP)</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Queue Antrean Upload */}
          {uploadQueue.length > 0 && (
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Antrean File Siap Diunggah ({uploadQueue.length} file)
                </h3>
                <button
                  type="button"
                  onClick={handleProsesUploadQueue}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-800 disabled:opacity-50 transition"
                >
                  {isUploading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses Unggahan...
                    </>
                  ) : (
                    "Mulai Unggah Semua File"
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border ${
                      item.errorValidation ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-gray-50/60"
                    }`}
                  >
                    {/* Thumbnail Preview */}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
                      <img src={item.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>

                    {/* Form Controls Per File */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-xs">
                      <div>
                        <span className="font-semibold text-gray-800 block truncate">{item.file.name}</span>
                        <span className="text-gray-500">{(item.file.size / 1024).toFixed(1)} KB</span>
                        {item.errorValidation && (
                          <span className="text-red-600 block mt-1 font-semibold">{item.errorValidation}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Teks Alternatif (Alt) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.teks_alt}
                          onChange={(e) => handleUpdateQueueItem(item.id, "teks_alt", e.target.value)}
                          placeholder="Deskripsi foto untuk aksesibilitas..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-purple-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Caption <span className="text-gray-400 font-normal">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) => handleUpdateQueueItem(item.id, "caption", e.target.value)}
                          placeholder="Keterangan singkat..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHapusQueueItem(item.id)}
                      disabled={isUploading}
                      className="text-red-600 hover:text-red-800 p-1 font-bold text-sm"
                      title="Hapus dari antrean"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Reports Summary */}
          {uploadReports.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Laporan Hasil Unggah File:</h3>
              <div className="space-y-2">
                {uploadReports.map((rep, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg text-xs font-medium border ${
                      rep.status === "sukses"
                        ? "bg-green-50 border-green-200 text-green-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{rep.status === "sukses" ? "✓" : "✕"}</span>
                      <span className="font-bold">{rep.fileName}</span>
                      {rep.alasan && <span className="text-red-700">— {rep.alasan}</span>}
                    </div>
                    <div>
                      {rep.status === "sukses" ? (
                        <span className="rounded bg-green-200 px-2 py-0.5 font-semibold text-green-800">
                          Berhasil
                        </span>
                      ) : (
                        <span className="rounded bg-red-200 px-2 py-0.5 font-semibold text-red-800">
                          Gagal {rep.rollbackStorage === "berhasil" ? "(Rollback Storage Sukses)" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Daftar Foto Galeri Terpasang */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-md sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Foto Galeri Terpasang ({galeriList.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Kelola foto utama cover, status keaktifan, urutan, dan metadata foto.
              </p>
            </div>
          </div>

          {galeriList.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-3 text-base font-semibold text-gray-700">Belum ada foto galeri.</p>
              <p className="mt-1 text-xs text-gray-500">Gunakan form di atas untuk mengunggah foto galeri kesenian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {galeriList.map((item) => {
                const isProcessing = actionLoadingId === item.id
                const isCoverActive = item.is_cover && item.is_active
                const stateItem = editingPhotoState[item.id] || {
                  caption: item.caption || "",
                  teks_alt: item.teks_alt || "",
                  urutan: item.urutan ?? 0,
                }

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border transition shadow-sm ${
                      isCoverActive
                        ? "border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/30"
                        : item.is_active
                        ? "border-gray-200 bg-white hover:shadow-md"
                        : "border-gray-200 bg-gray-50/70 opacity-80"
                    }`}
                  >
                    {/* Gambar Preview */}
                    <div className="relative h-48 w-full bg-gray-100 overflow-hidden group">
                      <img
                        src={item.foto_url}
                        alt={item.teks_alt}
                        className="h-full w-full object-cover transition group-hover:scale-105 duration-300"
                      />

                      {/* Badges Top Overlay */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {isCoverActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                            ★ Foto Utama (Cover)
                          </span>
                        )}
                        {item.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                            Nonaktif
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                        Urutan: {item.urutan}
                      </div>
                    </div>

                    {/* Metadata Edit Form */}
                    <div className="flex-1 p-4 space-y-3 text-xs">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Teks Alternatif (Alt) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={stateItem.teks_alt}
                          onChange={(e) => handlePhotoStateChange(item.id, "teks_alt", e.target.value)}
                          placeholder="Deskripsi foto..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#8c734b] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Caption <span className="text-gray-400 font-normal">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={stateItem.caption}
                          onChange={(e) => handlePhotoStateChange(item.id, "caption", e.target.value)}
                          placeholder="Keterangan foto..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#8c734b] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">Urutan Tampil</label>
                        <input
                          type="number"
                          min={0}
                          value={stateItem.urutan}
                          onChange={(e) => handlePhotoStateChange(item.id, "urutan", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#8c734b] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSimpanMetadata(item)}
                        disabled={isProcessing}
                        className="w-full rounded-lg border border-gray-300 bg-white py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {isProcessing ? "Menyimpan..." : "Simpan Metadata Foto"}
                      </button>
                    </div>

                    {/* Action Footer */}
                    <div className="border-t border-gray-100 p-3 bg-gray-50/80 flex flex-wrap items-center justify-between gap-2">
                      {!isCoverActive && (
                        <button
                          type="button"
                          onClick={() => handleJadikanCover(item)}
                          disabled={isProcessing || !item.is_active}
                          className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
                          title={!item.is_active ? "Aktifkan foto terlebih dahulu" : "Jadikan Cover Utama"}
                        >
                          Jadikan Cover
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleAktifFoto(item)}
                        disabled={isProcessing}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          item.is_active
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        } disabled:opacity-50`}
                      >
                        {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleHapusFoto(item)}
                        disabled={isProcessing}
                        className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        {isProcessing ? "Proses..." : "Hapus Foto"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
