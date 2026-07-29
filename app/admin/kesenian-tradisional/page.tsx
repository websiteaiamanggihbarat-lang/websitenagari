"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_FOTO_KESENIAN,
  KategoriKesenian,
  KesenianTradisional,
  PILIHAN_KATEGORI_KESENIAN,
  buatSlugJenisKesenian,
  getLabelKategoriKesenian,
  isSlugJenisValid,
} from "@/lib/kesenian"

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
  urutan: string
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
  urutan: "0",
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
  const [listKesenian, setListKesenian] = useState<KesenianTradisional[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, boolean>>({})

  const [loadingList, setLoadingList] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [newCreatedId, setNewCreatedId] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormKesenianState>(FORM_AWAL)
  const [isSlugAutoMode, setIsSlugAutoMode] = useState<boolean>(true)

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
      // 1. Baca seluruh kesenian
      const { data: dataKesenian, error: errKesenian } = await supabase
        .from("kesenian_tradisional")
        .select("*")
        .order("urutan", { ascending: true })
        .order("nama_kesenian", { ascending: true })

      if (errKesenian) {
        setPesanError(`Gagal membaca data kesenian: ${errKesenian.message}`)
        setLoadingList(false)
        return
      }

      const kesenianArr = (dataKesenian as KesenianTradisional[]) || []
      setListKesenian(kesenianArr)

      // 2. Baca status cover aktif dari galeri_kesenian_tradisional
      const { data: dataCover, error: errCover } = await supabase
        .from("galeri_kesenian_tradisional")
        .select("kesenian_id")
        .eq("is_cover", true)
        .eq("is_active", true)

      if (errCover) {
        console.error("Gagal membaca cover map:", errCover)
      }

      const mapCover: Record<string, boolean> = {}
      if (dataCover) {
        for (const item of dataCover) {
          if (item.kesenian_id) {
            mapCover[item.kesenian_id] = true
          }
        }
      }
      setCoverMap(mapCover)
    } catch (err: any) {
      setPesanError(`Terjadi kesalahan memuat data: ${err.message || err}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenTambah = () => {
    setEditingId(null)
    setFormData(FORM_AWAL)
    setIsSlugAutoMode(true)
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: KesenianTradisional) => {
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
      urutan: (item.urutan ?? 0).toString(),
    })
    setIsSlugAutoMode(!item.jenis_slug)
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(FORM_AWAL)
    setIsSlugAutoMode(true)
  }

  const handleJenisKesenianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const newFormData = { ...formData, jenis_kesenian: val }
    if (isSlugAutoMode) {
      newFormData.jenis_slug = buatSlugJenisKesenian(val)
    }
    setFormData(newFormData)
  }

  const handleJenisSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
    setIsSlugAutoMode(false)
    setFormData({ ...formData, jenis_slug: val })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)

    // Validasi
    const namaClean = formData.nama_kesenian.trim()
    const jenisClean = formData.jenis_kesenian.trim()
    const slugClean = formData.jenis_slug.trim()
    const deskripsiClean = formData.deskripsi_singkat.trim()
    const petaClean = formData.tautan_peta.trim()

    if (!namaClean) {
      setPesanError("Nama kesenian wajib diisi.")
      return
    }

    if (!jenisClean) {
      setPesanError("Jenis Kesenian wajib diisi (contoh: Randai, Tari, Rebana, Ronggeng, Deki Pano).")
      return
    }

    if (!slugClean) {
      setPesanError("Slug Jenis wajib diisi (contoh: randai, tari, rebana, deki-pano).")
      return
    }

    if (!isSlugJenisValid(slugClean)) {
      setPesanError("Slug Jenis tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (contoh: deki-pano).")
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

    const numUrutan = Math.max(0, parseInt(formData.urutan || "0", 10) || 0)

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
      urutan: numUrutan,
    }

    setLoadingForm(true)

    try {
      if (editingId) {
        // UPDATE (jangan ubah is_active melalui form edit utama)
        const { error: errUpdate } = await supabase
          .from("kesenian_tradisional")
          .update(payload)
          .eq("id", editingId)

        if (errUpdate) {
          if (errUpdate.code === "23505") {
            setPesanError(
              "Kesenian dengan nama dan lokasi/alamat tersebut sudah terdaftar."
            )
          } else {
            setPesanError(`Gagal memperbarui kesenian: ${errUpdate.message}`)
          }
          setLoadingForm(false)
          return
        }

        setPesanSukses(`Data kesenian "${namaClean}" berhasil diperbarui.`)
        setIsFormOpen(false)
        setEditingId(null)
        setFormData(FORM_AWAL)
        await fetchData()
      } else {
        // CREATE (is_active selalu false)
        const { data: newRec, error: errInsert } = await supabase
          .from("kesenian_tradisional")
          .insert({
            ...payload,
            is_active: false,
          })
          .select("id")
          .single()

        if (errInsert) {
          if (errInsert.code === "23505") {
            setPesanError(
              "Kesenian dengan nama dan lokasi/alamat tersebut sudah terdaftar."
            )
          } else {
            setPesanError(`Gagal menambah kesenian: ${errInsert.message}`)
          }
          setLoadingForm(false)
          return
        }

        setPesanSukses(
          `Data kesenian "${namaClean}" berhasil ditambahkan (status default: Nonaktif). Silakan unggah foto utama melalui tombol Kelola Galeri.`
        )
        if (newRec && newRec.id) {
          setNewCreatedId(newRec.id)
        }
        setIsFormOpen(false)
        setFormData(FORM_AWAL)
        await fetchData()
      }
    } catch (err: any) {
      setPesanError(`Terjadi kesalahan: ${err.message || err}`)
    } finally {
      setLoadingForm(false)
    }
  }

  const handleAktifkan = async (item: KesenianTradisional) => {
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setActionLoadingId(item.id)

    try {
      // 1. Query galeri: harus ada minimal 1 dengan is_cover = true & is_active = true
      const { data: coverActive, error: errCheck } = await supabase
        .from("galeri_kesenian_tradisional")
        .select("id")
        .eq("kesenian_id", item.id)
        .eq("is_cover", true)
        .eq("is_active", true)
        .maybeSingle()

      if (errCheck) {
        setPesanError(`Gagal memeriksa galeri foto: ${errCheck.message}`)
        setActionLoadingId(null)
        return
      }

      if (!coverActive) {
        setPesanError(
          "Kesenian belum dapat diaktifkan karena belum memiliki foto utama yang aktif."
        )
        setActionLoadingId(null)
        return
      }

      // 2. Aktifkan
      const { error: errAktif } = await supabase
        .from("kesenian_tradisional")
        .update({ is_active: true })
        .eq("id", item.id)

      if (errAktif) {
        setPesanError(`Gagal mengaktifkan kesenian: ${errAktif.message}`)
      } else {
        setPesanSukses(`Kesenian "${item.nama_kesenian}" berhasil diaktifkan.`)
        await fetchData()
      }
    } catch (err: any) {
      setPesanError(`Terjadi kesalahan: ${err.message || err}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleNonaktifkan = async (item: KesenianTradisional) => {
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setActionLoadingId(item.id)

    try {
      const { error: errNonaktif } = await supabase
        .from("kesenian_tradisional")
        .update({ is_active: false })
        .eq("id", item.id)

      if (errNonaktif) {
        setPesanError(`Gagal menonaktifkan kesenian: ${errNonaktif.message}`)
      } else {
        setPesanSukses(`Kesenian "${item.nama_kesenian}" telah dinonaktifkan.`)
        await fetchData()
      }
    } catch (err: any) {
      setPesanError(`Terjadi kesalahan: ${err.message || err}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleHapus = async (item: KesenianTradisional) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus kesenian "${item.nama_kesenian}" beserta seluruh galeri dan foto di Storage?`
    )
    if (!konfirmasi) return

    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setActionLoadingId(item.id)

    try {
      // Step 1: Baca seluruh storage_path galeri milik kesenian
      const { data: listGaleri, error: errGaleri } = await supabase
        .from("galeri_kesenian_tradisional")
        .select("storage_path")
        .eq("kesenian_id", item.id)

      if (errGaleri) {
        setPesanError(
          `Gagal membaca data galeri sebelum menghapus: ${errGaleri.message}`
        )
        setActionLoadingId(null)
        return
      }

      const storagePaths = (listGaleri || [])
        .map((g) => g.storage_path)
        .filter((p): p is string => Boolean(p && p.trim()))

      // Step 2: Ubah kesenian dan galeri terkait menjadi is_active = false terlebih dahulu
      await supabase
        .from("kesenian_tradisional")
        .update({ is_active: false })
        .eq("id", item.id)

      await supabase
        .from("galeri_kesenian_tradisional")
        .update({ is_active: false })
        .eq("kesenian_id", item.id)

      // Step 3: Hapus seluruh file Storage jika ada
      if (storagePaths.length > 0) {
        const { error: errStorage } = await supabase.storage
          .from(BUCKET_FOTO_KESENIAN)
          .remove(storagePaths)

        if (errStorage) {
          // Step 4: Jika hapus Storage gagal, jangan hapus record DB!
          setPesanError(
            `Gagal menghapus file foto dari Storage: ${errStorage.message}. Data kesenian dan galeri telah dinonaktifkan tetapi belum dihapus dari database.`
          )
          await fetchData()
          setActionLoadingId(null)
          return
        }
      }

      // Step 5: Hapus record kesenian utama (CASCADE akan menghapus baris galeri di DB)
      const { error: errDeleteMain } = await supabase
        .from("kesenian_tradisional")
        .delete()
        .eq("id", item.id)

      if (errDeleteMain) {
        setPesanError(
          `File foto di Storage telah berhasil dihapus, namun gagal menghapus record database: ${errDeleteMain.message}`
        )
      } else {
        setPesanSukses(
          `Kesenian "${item.nama_kesenian}" beserta seluruh foto galerinya berhasil dihapus.`
        )
      }
      await fetchData()
    } catch (err: any) {
      setPesanError(`Terjadi kesalahan saat menghapus data: ${err.message || err}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Dashboard Admin"
              aria-label="Kembali ke Dashboard Admin"
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
                Kelola Kesenian Tradisional
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola data utama sanggar, kelompok seni, dan kesenian daerah Nagari Aia Manggih Barat
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
                <svg
                  className="w-5 h-5 mr-2"
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
                Tambah Kesenian Baru
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loadingList || loadingForm}
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

        {/* Alert Notifications */}
        {pesanSukses && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600 flex-shrink-0"
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
              <button
                onClick={() => setPesanSukses(null)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
            {newCreatedId && (
              <div className="mt-3">
                <Link
                  href={`/admin/kesenian-tradisional/${newCreatedId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 shadow-sm"
                >
                  Kelola Galeri Foto Sekarang →
                </Link>
              </div>
            )}
          </div>
        )}

        {pesanError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-red-600 flex-shrink-0"
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
                onClick={() => setPesanError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Form Overlay / Section */}
        {isFormOpen && (
          <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Data Kesenian Tradisional" : "Tambah Data Kesenian Baru"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingId
                    ? "Perbarui informasi utama kelompok kesenian."
                    : "Data baru akan tersimpan dalam status Nonaktif hingga foto utama diunggah."}
                </p>
              </div>
              <button
                onClick={handleBatalForm}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Nama Kesenian */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nama Kesenian / Kelompok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_kesenian}
                    onChange={(e) => setFormData({ ...formData, nama_kesenian: e.target.value })}
                    placeholder="Contoh: Randai SDN 07"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Kategori Kesenian <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as KategoriKesenian })
                    }
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  >
                    {PILIHAN_KATEGORI_KESENIAN.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Kesenian */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Jenis Kesenian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jenis_kesenian}
                    onChange={handleJenisKesenianChange}
                    placeholder="Contoh: Randai, Tari, Rebana, Ronggeng, Deki Pano"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Slug Jenis */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      Slug Jenis <span className="text-red-500">*</span>
                    </label>
                    {isSlugAutoMode && (
                      <span className="text-[11px] font-medium text-emerald-600">
                        (Otomatis dari Jenis)
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.jenis_slug}
                    onChange={handleJenisSlugChange}
                    placeholder="Contoh: randai atau deki-pano"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Digunakan untuk filter URL. Gunakan huruf kecil, angka, dan tanda hubung.
                  </p>
                </div>

                {/* Deskripsi Singkat */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Deskripsi Singkat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.deskripsi_singkat}
                    onChange={(e) => setFormData({ ...formData, deskripsi_singkat: e.target.value })}
                    placeholder="Ringkasan singkat tentang kelompok kesenian ini..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Penjelasan Lengkap */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Penjelasan Lengkap / Sejarah <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <textarea
                    rows={5}
                    value={formData.penjelasan_lengkap}
                    onChange={(e) => setFormData({ ...formData, penjelasan_lengkap: e.target.value })}
                    placeholder="Detail riwayat, struktur, keanggotaan, atau penjelasan mendalam..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Nama Kelompok Pengelola */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nama Sanggar / Kelompok Pengelola <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_kelompok_pengelola}
                    onChange={(e) => setFormData({ ...formData, nama_kelompok_pengelola: e.target.value })}
                    placeholder="Contoh: Sanggar Seni Sakato"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Nama Ketua */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nama Ketua / Penanggung Jawab <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_ketua}
                    onChange={(e) => setFormData({ ...formData, nama_ketua: e.target.value })}
                    placeholder="Nama lengkap ketua..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Alamat / Jorong <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Contoh: Padang Sarai, Jorong Kampung Padang"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Nomor Kontak */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nomor Kontak / WhatsApp <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nomor_kontak}
                    onChange={(e) => setFormData({ ...formData, nomor_kontak: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Jadwal Latihan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Jadwal Latihan <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jadwal_latihan}
                    onChange={(e) => setFormData({ ...formData, jadwal_latihan: e.target.value })}
                    placeholder="Contoh: Setiap Sabtu malam pukul 20.00 WIB"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Urutan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Urutan Tampil (Integer &ge; 0)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: e.target.value })}
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>

                {/* Tautan Peta */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tautan Peta (Google Maps URL) <span className="text-xs font-normal text-gray-500">(Opsional, wajib diawali https://)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.tautan_peta}
                    onChange={(e) => setFormData({ ...formData, tautan_peta: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#8c734b] focus:outline-none focus:ring-2 focus:ring-[#8c734b]/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  disabled={loadingForm}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#4a3210] disabled:opacity-50"
                >
                  {loadingForm ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : editingId ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Kesenian"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel / Lista Kesenian */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              Daftar Kesenian Tradisional ({listKesenian.length})
            </h3>
            {loadingList && <span className="text-xs text-gray-500">Memuat data...</span>}
          </div>

          {loadingList ? (
            <div className="p-12 text-center text-sm text-gray-500">
              <svg
                className="mx-auto h-8 w-8 animate-spin text-[#8c734b]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="mt-2">Sedang memuat data kesenian...</p>
            </div>
          ) : listKesenian.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              <p className="text-base font-semibold text-gray-700">Belum ada data kesenian tradisional.</p>
              <p className="mt-1 text-xs text-gray-500">Klik tombol &quot;Tambah Kesenian Baru&quot; di atas untuk mendaftarkan kesenian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5">Urutan</th>
                    <th className="px-6 py-3.5">Nama Kesenian</th>
                    <th className="px-6 py-3.5">Jenis Kesenian</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5">Alamat / Jorong</th>
                    <th className="px-6 py-3.5">Status Cover</th>
                    <th className="px-6 py-3.5">Status Publikasi</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                  {listKesenian.map((item) => {
                    const hasCover = Boolean(coverMap[item.id])
                    const isProcessing = actionLoadingId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {item.urutan}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.nama_kesenian}</div>
                          {item.deskripsi_singkat && (
                            <div className="text-xs text-gray-500 line-clamp-1 max-w-xs mt-0.5">
                              {item.deskripsi_singkat}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.jenis_kesenian ? (
                            <div>
                              <div className="font-semibold text-gray-900">
                                {item.jenis_kesenian}
                              </div>
                              {item.jenis_slug && (
                                <div className="text-[11px] font-mono text-gray-500">
                                  /{item.jenis_slug}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                              Belum dilengkapi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            {getLabelKategoriKesenian(item.kategori)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.alamat || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {hasCover ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Sudah ada foto utama
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                              Belum ada foto utama
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {/* Kelola Galeri */}
                            <Link
                              href={`/admin/kesenian-tradisional/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 px-2.5 py-1.5 text-xs font-semibold shadow-sm transition"
                              title="Kelola Galeri Foto"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Galeri
                            </Link>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              disabled={isProcessing}
                              className="rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>

                            {/* Aktifkan / Nonaktifkan */}
                            {item.is_active ? (
                              <button
                                onClick={() => handleNonaktifkan(item)}
                                disabled={isProcessing}
                                className="rounded-lg bg-gray-700 hover:bg-gray-800 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? "Proses..." : "Nonaktifkan"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAktifkan(item)}
                                disabled={isProcessing}
                                className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? "Proses..." : "Aktifkan"}
                              </button>
                            )}

                            {/* Hapus */}
                            <button
                              onClick={() => handleHapus(item)}
                              disabled={isProcessing}
                              className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                            >
                              {isProcessing ? "Proses..." : "Hapus"}
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
