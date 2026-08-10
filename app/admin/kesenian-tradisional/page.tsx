"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_FOTO_KESENIAN,
  GaleriKesenianTradisional,
  KategoriKesenian,
  KesenianTradisional,
  PILIHAN_KATEGORI_KESENIAN,
  buatSlugJenisKesenian,
  getLabelKategoriKesenian,
} from "@/lib/kesenian"
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface FormKesenianState {
  nama_kesenian: string
  kategori: KategoriKesenian
  jenis_kesenian: string
  jenis_slug: string
  deskripsi_singkat: string
  penjelasan_lengkap: string
  nama_kelompok_pengelola: string
  nama_ketua: string
  alamat: string
  nomor_kontak: string
  jadwal_latihan: string
  tautan_peta: string
}

const FORM_AWAL: FormKesenianState = {
  nama_kesenian: "",
  kategori: "tari",
  jenis_kesenian: "",
  jenis_slug: "",
  deskripsi_singkat: "",
  penjelasan_lengkap: "",
  nama_kelompok_pengelola: "",
  nama_ketua: "",
  alamat: "",
  nomor_kontak: "",
  jadwal_latihan: "",
  tautan_peta: "",
}

interface ExistingGaleriItem extends GaleriKesenianTradisional {
  isPendingDelete?: boolean
}

interface NewPhotoItem {
  localId: string
  file: File
  previewUrl: string
  caption: string
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

export default function AdminKesenianTradisionalPage() {
  const formRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [listKesenian, setListKesenian] = useState<KesenianTradisional[]>([])

  const [loadingList, setLoadingList] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<KesenianTradisional | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterKategori, setFilterKategori] = useState<string>("semua")

  const [formData, setFormData] = useState<FormKesenianState>(FORM_AWAL)
  const [isSlugAutoMode, setIsSlugAutoMode] = useState<boolean>(true)

  // State untuk Inline Galeri
  const [existingGaleri, setExistingGaleri] = useState<ExistingGaleriItem[]>([])
  const [newPhotos, setNewPhotos] = useState<NewPhotoItem[]>([])
  const [deletedGaleriIds, setDeletedGaleriIds] = useState<string[]>([])

  const listKesenianTerfilter =
    filterKategori === "semua"
      ? listKesenian
      : listKesenian.filter((item) => item.kategori === filterKategori)

  const handleLogout = async () => {
    setLoadingList(true)
    await keluarDariAdmin("Logout error")
  }

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

  const fetchData = async () => {
    setLoadingList(true)
    const valid = await periksaSesi()
    if (!valid) {
      setLoadingList(false)
      return
    }

    try {
      // Baca seluruh data kesenian tradisional diurutkan berdasarkan created_at DESC (Terbaru Dulu)
      const { data: dataKesenian, error: errKesenian } = await supabase
        .from("kesenian_tradisional")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })

      if (errKesenian) {
        setPesanError(`Gagal membaca data kesenian: ${errKesenian.message}`)
        setLoadingList(false)
        return
      }

      const kesenianArr = (dataKesenian as KesenianTradisional[]) || []
      setListKesenian(kesenianArr)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan memuat data: ${msg}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto dismiss success toast notification after 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  // Clean up object URLs when newPhotos state changes or unmounts
  const cleanupNewPhotoPreviews = (photos: NewPhotoItem[]) => {
    photos.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })
  }

  const handleOpenTambah = () => {
    cleanupNewPhotoPreviews(newPhotos)

    setEditingId(null)
    setFormData(FORM_AWAL)
    setIsSlugAutoMode(true)
    setExistingGaleri([])
    setNewPhotos([])
    setDeletedGaleriIds([])
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleOpenEdit = async (item: KesenianTradisional) => {
    cleanupNewPhotoPreviews(newPhotos)

    setEditingId(item.id)
    setFormData({
      nama_kesenian: item.nama_kesenian || "",
      kategori: item.kategori || "tari",
      jenis_kesenian: item.jenis_kesenian || "",
      jenis_slug: item.jenis_slug || "",
      deskripsi_singkat: item.deskripsi_singkat || "",
      penjelasan_lengkap: item.penjelasan_lengkap || "",
      nama_kelompok_pengelola: item.nama_kelompok_pengelola || "",
      nama_ketua: item.nama_ketua || "",
      alamat: item.alamat || "",
      nomor_kontak: item.nomor_kontak || "",
      jadwal_latihan: item.jadwal_latihan || "",
      tautan_peta: item.tautan_peta || "",
    })
    setIsSlugAutoMode(!item.jenis_slug)
    setNewPhotos([])
    setDeletedGaleriIds([])
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)

    // Read existing gallery photos for this kesenian
    try {
      const { data: dataGaleri, error: errGaleri } = await supabase
        .from("galeri_kesenian_tradisional")
        .select("*")
        .eq("kesenian_id", item.id)
        .order("is_cover", { ascending: false })
        .order("created_at", { ascending: true })

      if (!errGaleri && dataGaleri) {
        setExistingGaleri(dataGaleri as ExistingGaleriItem[])
      } else {
        setExistingGaleri([])
      }
    } catch {
      setExistingGaleri([])
    }

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleBatalForm = () => {
    cleanupNewPhotoPreviews(newPhotos)

    setIsFormOpen(false)
    setEditingId(null)
    setFormData(FORM_AWAL)
    setIsSlugAutoMode(true)
    setExistingGaleri([])
    setNewPhotos([])
    setDeletedGaleriIds([])
  }

  // File Picker Selection
  const handleSelectNewPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validNewPhotos: NewPhotoItem[] = []

    Array.from(files).forEach((file) => {
      const mimeValid = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      const extValid = ["jpg", "jpeg", "png", "webp"].includes(ext)

      if (!mimeValid && !extValid) {
        showError(`Format file "${file.name}" tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.`)
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        showError(`Ukuran file "${file.name}" melebihi batas 2 MB.`)
        return
      }

      validNewPhotos.push({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
      })
    })

    setNewPhotos((prev) => [...prev, ...validNewPhotos])
    e.target.value = ""
  }

  const handleRemoveNewPhoto = (localId: string) => {
    setNewPhotos((prev) => {
      const target = prev.find((item) => item.localId === localId)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.localId !== localId)
    })
  }

  const handleDeleteExistingPhoto = (id: string) => {
    setDeletedGaleriIds((prev) => [...prev, id])
  }

  const handleSetCoverExistingPhoto = (id: string) => {
    setExistingGaleri((prev) =>
      prev.map((item) => ({
        ...item,
        is_cover: item.id === id,
      }))
    )
  }

  const handleUpdateExistingCaption = (id: string, newCaption: string) => {
    setExistingGaleri((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption: newCaption } : item))
    )
  }

  const handleUpdateNewCaption = (localId: string, newCaption: string) => {
    setNewPhotos((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, caption: newCaption } : item))
    )
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setPesanSukses(null)
    setPesanError(null)

    // Validasi Data Utama
    const namaClean = formData.nama_kesenian.trim()
    const deskripsiClean = formData.deskripsi_singkat.trim()
    const petaClean = formData.tautan_peta.trim()

    if (!namaClean) {
      setPesanError("Nama kesenian wajib diisi.")
      return
    }

    if (!deskripsiClean) {
      setPesanError("Deskripsi singkat wajib diisi.")
      return
    }

    if (petaClean && !petaClean.toLowerCase().startsWith("https://")) {
      setPesanError("Tautan peta harus diawali dengan https://")
      return
    }

    const editingItem = listKesenian.find((item) => item.id === editingId)
    const jenisClean = editingItem?.jenis_kesenian || namaClean
    const slugClean = editingItem?.jenis_slug || buatSlugJenisKesenian(namaClean)

    const payload = {
      nama_kesenian: namaClean,
      kategori: formData.kategori,
      jenis_kesenian: jenisClean,
      jenis_slug: slugClean,
      deskripsi_singkat: deskripsiClean,
      penjelasan_lengkap: formData.penjelasan_lengkap.trim() || null,
      nama_kelompok_pengelola: formData.nama_kelompok_pengelola.trim() || null,
      nama_ketua: formData.nama_ketua.trim() || null,
      alamat: formData.alamat.trim() || null,
      nomor_kontak: formData.nomor_kontak.trim() || null,
      jadwal_latihan: formData.jadwal_latihan.trim() || null,
      tautan_peta: petaClean || null,
      urutan: 0,
    }

    setLoadingForm(true)

    try {
      if (editingId) {
        // MODE EDIT
        // 1. Update Data Utama Parent
        const { error: errUpdate } = await supabase
          .from("kesenian_tradisional")
          .update(payload)
          .eq("id", editingId)

        if (errUpdate) {
          setPesanError(`Gagal memperbarui kesenian: ${errUpdate.message}`)
          setLoadingForm(false)
          return
        }

        // 2. Hapus Galeri yang ditandai Delete
        if (deletedGaleriIds.length > 0) {
          const toDeleteItems = existingGaleri.filter((g) => deletedGaleriIds.includes(g.id))
          const storagePaths = toDeleteItems.map((g) => g.storage_path).filter(Boolean)

          if (storagePaths.length > 0) {
            await supabase.storage.from(BUCKET_FOTO_KESENIAN).remove(storagePaths)
          }

          await supabase
            .from("galeri_kesenian_tradisional")
            .delete()
            .in("id", deletedGaleriIds)
        }

        // 3. Update Existing Galeri (caption & is_cover)
        const remainingExisting = existingGaleri.filter((g) => !deletedGaleriIds.includes(g.id))
        for (const item of remainingExisting) {
          await supabase
            .from("galeri_kesenian_tradisional")
            .update({
              caption: item.caption ? item.caption.trim() : null,
              is_cover: item.is_cover,
            })
            .eq("id", item.id)
        }

        // 4. Upload New Photos jika ada
        if (newPhotos.length > 0) {
          const hasCoverInExisting = remainingExisting.some((g) => g.is_cover)

          for (let i = 0; i < newPhotos.length; i++) {
            const photo = newPhotos[i]
            const timestamp = Date.now()
            const randomId = crypto.randomUUID()
            const ext = photo.file.name.split(".").pop()?.toLowerCase() || "jpg"
            const storagePath = `kesenian-tradisional/${editingId}/${timestamp}-${randomId}.${ext}`

            const { error: errUpload } = await supabase.storage
              .from(BUCKET_FOTO_KESENIAN)
              .upload(storagePath, photo.file, {
                cacheControl: "3600",
                upsert: false,
                contentType: photo.file.type || "image/jpeg",
              })

            if (!errUpload) {
              const { data: publicData } = supabase.storage
                .from(BUCKET_FOTO_KESENIAN)
                .getPublicUrl(storagePath)

              const isCover = !hasCoverInExisting && i === 0

              await supabase.from("galeri_kesenian_tradisional").insert({
                kesenian_id: editingId,
                foto_url: publicData?.publicUrl || "",
                storage_path: storagePath,
                caption: photo.caption.trim() || null,
                teks_alt: `Foto ${namaClean}`,
                is_cover: isCover,
                is_active: true,
                urutan: 0,
              })
            }
          }
        }

        setPesanSukses(`Kesenian "${namaClean}" berhasil diperbarui.`)
        handleBatalForm()
        await fetchData()
      } else {
        // MODE CREATE
        // 1. Insert Parent Kesenian (is_active: true secara otomatis)
        const parentId = crypto.randomUUID()
        const { error: errInsert } = await supabase
          .from("kesenian_tradisional")
          .insert({
            id: parentId,
            ...payload,
            is_active: true, // OTOMATIS AKTIF
          })

        if (errInsert) {
          if (errInsert.code === "23505") {
            setPesanError("Kesenian dengan nama tersebut sudah terdaftar.")
          } else {
            setPesanError(`Gagal menambah kesenian: ${errInsert.message}`)
          }
          setLoadingForm(false)
          return
        }

        // 2. Upload New Photos
        if (newPhotos.length > 0) {
          for (let i = 0; i < newPhotos.length; i++) {
            const photo = newPhotos[i]
            const timestamp = Date.now()
            const randomId = crypto.randomUUID()
            const ext = photo.file.name.split(".").pop()?.toLowerCase() || "jpg"
            const storagePath = `kesenian-tradisional/${parentId}/${timestamp}-${randomId}.${ext}`

            const { error: errUpload } = await supabase.storage
              .from(BUCKET_FOTO_KESENIAN)
              .upload(storagePath, photo.file, {
                cacheControl: "3600",
                upsert: false,
                contentType: photo.file.type || "image/jpeg",
              })

            if (!errUpload) {
              const { data: publicData } = supabase.storage
                .from(BUCKET_FOTO_KESENIAN)
                .getPublicUrl(storagePath)

              await supabase.from("galeri_kesenian_tradisional").insert({
                kesenian_id: parentId,
                foto_url: publicData?.publicUrl || "",
                storage_path: storagePath,
                caption: photo.caption.trim() || null,
                teks_alt: `Foto ${namaClean}`,
                is_cover: i === 0, // Foto pertama otomatis jadi cover
                is_active: true,
                urutan: 0,
              })
            }
          }
        }

        setPesanSukses(`Kesenian "${namaClean}" berhasil ditambahkan.`)
        handleBatalForm()
        await fetchData()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan: ${msg}`)
    } finally {
      setLoadingForm(false)
    }
  }

  const handleHapus = (item: KesenianTradisional) => {
    setDeleteTarget(item)
  }

  const executeHapus = async (item: KesenianTradisional) => {
    setPesanSukses(null)
    setPesanError(null)
    setActionLoadingId(item.id)

    try {
      // Step 1: Baca seluruh storage_path galeri milik kesenian
      const { data: listGaleri } = await supabase
        .from("galeri_kesenian_tradisional")
        .select("storage_path")
        .eq("kesenian_id", item.id)

      const storagePaths = (listGaleri || [])
        .map((g) => g.storage_path)
        .filter((p): p is string => Boolean(p && p.trim()))

      // Step 2: Hapus seluruh file Storage jika ada
      if (storagePaths.length > 0) {
        await supabase.storage.from(BUCKET_FOTO_KESENIAN).remove(storagePaths)
      }

      // Step 3: Hapus galeri dan record kesenian utama
      await supabase.from("galeri_kesenian_tradisional").delete().eq("kesenian_id", item.id)

      const { error: errDeleteMain } = await supabase
        .from("kesenian_tradisional")
        .delete()
        .eq("id", item.id)

      if (errDeleteMain) {
        const msg = `Gagal menghapus record database kesenian: ${errDeleteMain.message}`
        setPesanError(msg)
        showError(msg)
      } else {
        const msg = `Kesenian "${item.nama_kesenian}" berhasil dihapus.`
        setPesanSukses(msg)
        showSuccess(msg)
      }
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat menghapus data: ${msg}`)
      showError(`Terjadi kesalahan saat menghapus data: ${msg}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const activeExistingGaleri = existingGaleri.filter((g) => !deletedGaleriIds.includes(g.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation (Samakan dengan Kelola Layanan Informasi) */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Dashboard Admin"
              aria-label="Kembali ke Dashboard Admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Kelola Kesenian Tradisional
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola data kesenian tradisional Nagari Aia Manggih Barat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isFormOpen && (
              <button
                type="button"
                onClick={handleOpenTambah}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Kesenian Baru
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
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

        {/* SECTION: FORM UNIFIED TAMBAH / EDIT KESENIAN TRADISIONAL */}
        {isFormOpen && (
          <div ref={formRef} id="form-kesenian-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {editingId ? "Edit Kesenian Tradisional" : "Tambah Kesenian Tradisional Baru"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingId
                  ? "Ubah informasi kesenian tradisional dan foto galerinya."
                  : "Lengkapi informasi kesenian tradisional dan pilih foto galeri."}
              </p>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* SUBSECTION 1: DATA UTAMA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama Kesenian */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nama Kesenian / Kelompok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_kesenian}
                    onChange={(e) => setFormData({ ...formData, nama_kesenian: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: Randai Sanggar Sakato"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Kategori Kesenian <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as KategoriKesenian })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  >
                    {PILIHAN_KATEGORI_KESENIAN.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deskripsi Singkat */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Deskripsi Singkat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.deskripsi_singkat}
                    onChange={(e) => setFormData({ ...formData, deskripsi_singkat: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Ringkasan singkat tentang kelompok kesenian ini..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                  />
                </div>

                {/* Penjelasan Lengkap */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Penjelasan Lengkap / Sejarah <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.penjelasan_lengkap}
                    onChange={(e) => setFormData({ ...formData, penjelasan_lengkap: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Detail riwayat, struktur, keanggotaan, atau penjelasan mendalam..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                  />
                </div>

                {/* Nama Sanggar / Kelompok Pengelola */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nama Sanggar / Kelompok Pengelola <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_kelompok_pengelola}
                    onChange={(e) => setFormData({ ...formData, nama_kelompok_pengelola: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: Sanggar Seni Sakato"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Nama Ketua */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nama Ketua / Penanggung Jawab <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_ketua}
                    onChange={(e) => setFormData({ ...formData, nama_ketua: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Nama lengkap ketua..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Alamat / Jorong */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Alamat / Jorong <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: Padang Sarai, Jorong Kampung Padang"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Nomor Kontak */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nomor Kontak / WhatsApp <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nomor_kontak}
                    onChange={(e) => setFormData({ ...formData, nomor_kontak: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Jadwal Latihan */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jadwal Latihan <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jadwal_latihan}
                    onChange={(e) => setFormData({ ...formData, jadwal_latihan: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: Setiap Sabtu malam pukul 20.00 WIB"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Tautan Peta */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tautan Peta (Google Maps URL - Wajib https://) <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.tautan_peta}
                    onChange={(e) => setFormData({ ...formData, tautan_peta: e.target.value })}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="https://maps.google.com/..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>
              </div>

              {/* SUBSECTION 2: GALERI FOTO INLINE */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#2c1b01]">Galeri Foto</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Tambahkan foto dokumentasi kesenian tradisional. Foto pertama otomatis dijadikan foto utama / cover.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleSelectNewPhotos}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Tambahkan Foto</span>
                    </button>
                  </div>
                </div>

                {/* Grid Photo Cards */}
                {activeExistingGaleri.length === 0 && newPhotos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center text-gray-500 text-xs">
                    Belum ada foto galeri yang ditambahkan. Klik tombol <strong>"Tambahkan Foto"</strong> di atas.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {/* Existing Gallery Photos */}
                    {activeExistingGaleri.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col group"
                      >
                        <div className="relative h-32 w-full bg-gray-100 overflow-hidden">
                          <img
                            src={photo.foto_url}
                            alt={photo.teks_alt || "Foto Galeri"}
                            className="h-full w-full object-cover"
                          />

                          {/* Delete Button (Deferred) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingPhoto(photo.id)}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                            title="Hapus foto"
                          >
                            ✕
                          </button>

                          {/* Cover Badge / Button */}
                          {photo.is_cover ? (
                            <span className="absolute bottom-2 left-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-gray-950 shadow-sm">
                              ★ Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCoverExistingPhoto(photo.id)}
                              className="absolute bottom-2 left-2 rounded-md bg-black/60 hover:bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                            >
                              Jadikan Cover
                            </button>
                          )}
                        </div>

                        <div className="p-2 bg-white flex-1 flex flex-col">
                          <input
                            type="text"
                            placeholder="Keterangan foto (opsional)..."
                            value={photo.caption || ""}
                            onChange={(e) => handleUpdateExistingCaption(photo.id, e.target.value)}
                            className="w-full text-xs text-gray-800 border-0 focus:ring-0 p-1 border-b border-gray-200 focus:border-[#6b4b1d]"
                          />
                        </div>
                      </div>
                    ))}

                    {/* New Selected Photos */}
                    {newPhotos.map((photo) => (
                      <div
                        key={photo.localId}
                        className="relative rounded-xl border border-amber-200 bg-amber-50/20 overflow-hidden shadow-sm flex flex-col group"
                      >
                        <div className="relative h-32 w-full bg-gray-100 overflow-hidden">
                          <img
                            src={photo.previewUrl}
                            alt="Preview Foto Baru"
                            className="h-full w-full object-cover"
                          />

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveNewPhoto(photo.localId)}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                            title="Hapus dari daftar pilihan"
                          >
                            ✕
                          </button>

                          <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            Foto Baru
                          </span>
                        </div>

                        <div className="p-2 bg-white flex-1 flex flex-col">
                          <input
                            type="text"
                            placeholder="Keterangan foto (opsional)..."
                            value={photo.caption}
                            onChange={(e) => handleUpdateNewCaption(photo.localId, e.target.value)}
                            className="w-full text-xs text-gray-800 border-0 focus:ring-0 p-1 border-b border-gray-200 focus:border-[#6b4b1d]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Form Buttons (Single Batal Button) */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  disabled={loadingForm}
                  className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  {loadingForm ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : editingId ? (
                    <span>Simpan Perubahan</span>
                  ) : (
                    <span>Tambah Kesenian</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Panel Filter Kategori */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter Kategori:</span>
            <select
              id="filter-kategori-select"
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-[#6b4b1d] focus:border-[#6b4b1d]"
            >
              <option value="semua">Semua Kategori</option>
              {PILIHAN_KATEGORI_KESENIAN.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {filterKategori !== "semua" && (
              <button
                type="button"
                onClick={() => setFilterKategori("semua")}
                className="text-xs font-semibold text-amber-800 hover:underline px-2 py-1 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Tabel / Daftar Kesenian Tradisional (Tanpa Bar Header Tambahan) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingList ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
              <p className="text-sm font-medium">Sedang memuat data kesenian...</p>
            </div>
          ) : listKesenianTerfilter.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-base font-semibold text-gray-700">
                {filterKategori !== "semua"
                  ? `Tidak ada kesenian tradisional pada kategori ini.`
                  : "Belum Ada Data Kesenian Tradisional"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filterKategori !== "semua"
                  ? "Coba pilih kategori lain atau reset filter."
                  : 'Klik tombol "Tambah Kesenian Baru" di atas untuk mendaftarkan kesenian.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold w-[35%]">Nama Kesenian</th>
                    <th scope="col" className="px-6 py-4 font-bold w-[20%]">Kategori</th>
                    <th scope="col" className="px-6 py-4 font-bold w-[22%]">Alamat / Jorong</th>
                    <th scope="col" className="px-6 py-4 font-bold text-right w-[23%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {listKesenianTerfilter.map((item) => {
                    const isBusy = actionLoadingId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 text-base">
                            {item.nama_kesenian}
                          </p>
                          {item.deskripsi_singkat && (
                            <p className="text-xs text-gray-500 line-clamp-1 max-w-md mt-0.5">
                              {item.deskripsi_singkat}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-800">
                          {getLabelKategoriKesenian(item.kategori)}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-700">
                          {item.alamat || "-"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              disabled={isBusy}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handleHapus(item)}
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Kesenian Tradisional?"
        message={
          <>
            Apakah Anda yakin ingin menghapus kesenian <strong>&quot;{deleteTarget?.nama_kesenian}&quot;</strong>?
            <br />
            Seluruh galeri dan foto terkait akan dihapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(actionLoadingId)}
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
