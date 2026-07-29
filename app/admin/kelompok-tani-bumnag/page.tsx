"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_KELOMPOK_TANI_BUMNAG,
  JenisEntitasKelompokTaniBumnag,
  KelompokTaniBumnag,
  PILIHAN_JENIS_ENTITAS,
  getLabelBidang,
  getLabelJenisEntitas,
  getLabelPimpinan,
} from "@/lib/kelompokTaniBumnag"

interface FormState {
  nama_entitas: string
  jenis_entitas: JenisEntitasKelompokTaniBumnag
  bidang_utama: string
  deskripsi: string
  nama_pimpinan: string
  tahun_berdiri: string
  jumlah_anggota: string
  alamat: string
  wilayah_kegiatan: string
  nomor_kontak: string
  tautan_peta: string
  urutan: string
}

const FORM_AWAL: FormState = {
  nama_entitas: "",
  jenis_entitas: "kelompok_tani",
  bidang_utama: "",
  deskripsi: "",
  nama_pimpinan: "",
  tahun_berdiri: "",
  jumlah_anggota: "",
  alamat: "",
  wilayah_kegiatan: "",
  nomor_kontak: "",
  tautan_peta: "",
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
      " Data dengan kombinasi nama, jenis entitas, dan alamat tersebut sudah terdaftar (duplikat)."
  } else if (code === "23514") {
    specificAdvice =
      " Data melanggar aturan validasi database (check constraint). Pastikan bidang wajib diisi, tautan peta diawali https://, tahun berdiri 1800-2100, dan aktivasi sudah memiliki cover."
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

export default function AdminKelompokTaniBumnagPage() {
  const [listData, setListData] = useState<KelompokTaniBumnag[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, boolean>>({})

  const [loadingList, setLoadingList] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [newCreatedId, setNewCreatedId] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormState>(FORM_AWAL)

  const handleLogout = async () => {
    setLoadingList(true)
    await keluarDariAdmin("Logout error")
  }

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [filterJenis, setFilterJenis] = useState<string>("semua")
  const [filterStatus, setFilterStatus] = useState<string>("semua")

  const periksaUserAuth = async (): Promise<boolean> => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      window.location.href = "/login"
      return false
    }
    return true
  }

  const fetchData = async () => {
    setLoadingList(true)
    const valid = await periksaUserAuth()
    if (!valid) {
      setLoadingList(false)
      return
    }

    try {
      // 1. Baca seluruh data entitas (termasuk draft)
      const { data: dataEntitas, error: errEntitas } = await supabase
        .from("kelompok_tani_bumnag")
        .select("*")
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: false })

      if (errEntitas) {
        setPesanError(formatSupabaseError(errEntitas, "Gagal membaca data entitas"))
        setLoadingList(false)
        return
      }

      const arr = (dataEntitas as KelompokTaniBumnag[]) || []
      setListData(arr)

      // 2. Baca cover aktif dari galeri
      const { data: dataCover, error: errCover } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .select("kelompok_tani_bumnag_id")
        .eq("is_cover", true)
        .eq("is_active", true)

      if (errCover) {
        console.error("Gagal membaca cover map:", errCover)
      }

      const mapCover: Record<string, boolean> = {}
      if (dataCover) {
        for (const item of dataCover) {
          if (item.kelompok_tani_bumnag_id) {
            mapCover[item.kelompok_tani_bumnag_id] = true
          }
        }
      }
      setCoverMap(mapCover)
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan memuat data"))
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
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: KelompokTaniBumnag) => {
    setEditingId(item.id)
    setFormData({
      nama_entitas: item.nama_entitas || "",
      jenis_entitas: item.jenis_entitas || "kelompok_tani",
      bidang_utama: item.bidang_utama || "",
      deskripsi: item.deskripsi || "",
      nama_pimpinan: item.nama_pimpinan || "",
      tahun_berdiri: item.tahun_berdiri !== null ? item.tahun_berdiri.toString() : "",
      jumlah_anggota: item.jumlah_anggota !== null ? item.jumlah_anggota.toString() : "",
      alamat: item.alamat || "",
      wilayah_kegiatan: item.wilayah_kegiatan || "",
      nomor_kontak: item.nomor_kontak || "",
      tautan_peta: item.tautan_peta || "",
      urutan: (item.urutan ?? 0).toString(),
    })
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(FORM_AWAL)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    // Validasi
    const namaClean = formData.nama_entitas.trim()
    const bidangClean = formData.bidang_utama.trim()
    const deskripsiClean = formData.deskripsi.trim()
    const petaClean = formData.tautan_peta.trim()

    if (!namaClean) {
      setPesanError("Nama entitas wajib diisi.")
      return
    }

    if (!bidangClean) {
      setPesanError(`${getLabelBidang(formData.jenis_entitas)} wajib diisi.`)
      return
    }

    if (!deskripsiClean) {
      setPesanError("Deskripsi wajib diisi.")
      return
    }

    if (petaClean && !petaClean.toLowerCase().startsWith("https://")) {
      setPesanError("Tautan peta wajib diawali dengan https://")
      return
    }

    let numTahun: number | null = null
    if (formData.tahun_berdiri.trim()) {
      const parsed = parseInt(formData.tahun_berdiri.trim(), 10)
      if (isNaN(parsed) || parsed < 1800 || parsed > 2100) {
        setPesanError("Tahun berdiri harus berupa angka antara 1800 dan 2100.")
        return
      }
      numTahun = parsed
    }

    let numAnggota: number | null = null
    if (formData.jumlah_anggota.trim()) {
      const parsed = parseInt(formData.jumlah_anggota.trim(), 10)
      if (isNaN(parsed) || parsed < 0) {
        setPesanError("Jumlah anggota harus berupa angka positif (minimal 0).")
        return
      }
      numAnggota = parsed
    }

    const numUrutan = Math.max(0, parseInt(formData.urutan || "0", 10) || 0)

    const payload = {
      nama_entitas: namaClean,
      jenis_entitas: formData.jenis_entitas,
      bidang_utama: bidangClean,
      deskripsi: deskripsiClean,
      nama_pimpinan: formData.nama_pimpinan.trim() || null,
      tahun_berdiri: numTahun,
      jumlah_anggota: numAnggota,
      alamat: formData.alamat.trim() || null,
      wilayah_kegiatan: formData.wilayah_kegiatan.trim() || null,
      nomor_kontak: formData.nomor_kontak.trim() || null,
      tautan_peta: petaClean || null,
      urutan: numUrutan,
    }

    setLoadingForm(true)

    try {
      if (editingId) {
        // UPDATE (is_active tidak diubah via form utama)
        const { error: errUpdate } = await supabase
          .from("kelompok_tani_bumnag")
          .update(payload)
          .eq("id", editingId)

        if (errUpdate) {
          setPesanError(formatSupabaseError(errUpdate, "Gagal memperbarui entitas"))
          setLoadingForm(false)
          return
        }

        setPesanSukses(
          `Data ${getLabelJenisEntitas(formData.jenis_entitas)} "${namaClean}" berhasil diperbarui.`
        )
        setIsFormOpen(false)
        setEditingId(null)
        setFormData(FORM_AWAL)
        await fetchData()
      } else {
        // CREATE (is_active selalu false)
        const { data: newRec, error: errInsert } = await supabase
          .from("kelompok_tani_bumnag")
          .insert({
            ...payload,
            is_active: false,
          })
          .select("id")
          .single()

        if (errInsert) {
          setPesanError(formatSupabaseError(errInsert, "Gagal menambah entitas"))
          setLoadingForm(false)
          return
        }

        setPesanSukses(
          `Data ${getLabelJenisEntitas(formData.jenis_entitas)} "${namaClean}" berhasil ditambahkan (status default: Nonaktif). Silakan kelola galeri dan produk melalui tombol yang tersedia.`
        )
        if (newRec && newRec.id) {
          setNewCreatedId(newRec.id)
        }
        setIsFormOpen(false)
        setFormData(FORM_AWAL)
        await fetchData()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan simpan"))
    } finally {
      setLoadingForm(false)
    }
  }

  const handleAktifkan = async (item: KelompokTaniBumnag) => {
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)

    try {
      // 1. Cek keberadaan cover aktif di database
      const { data: coverActive, error: errCheck } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .select("id")
        .eq("kelompok_tani_bumnag_id", item.id)
        .eq("is_cover", true)
        .eq("is_active", true)
        .maybeSingle()

      if (errCheck) {
        setPesanError(formatSupabaseError(errCheck, "Gagal memeriksa galeri foto"))
        setActionLoadingId(null)
        return
      }

      if (!coverActive) {
        setPesanError(
          `Entitas "${item.nama_entitas}" belum dapat diaktifkan karena belum memiliki foto utama/cover aktif (is_cover = true & is_active = true). Silakan unggah foto di Kelola Galeri terlebih dahulu.`
        )
        setActionLoadingId(null)
        return
      }

      // 2. Update is_active = true
      const { error: errAktif } = await supabase
        .from("kelompok_tani_bumnag")
        .update({ is_active: true })
        .eq("id", item.id)

      if (errAktif) {
        setPesanError(formatSupabaseError(errAktif, "Gagal mengaktifkan entitas"))
      } else {
        setPesanSukses(
          `Data ${getLabelJenisEntitas(item.jenis_entitas)} "${item.nama_entitas}" berhasil diaktifkan.`
        )
        await fetchData()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan aktivasi"))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleNonaktifkan = async (item: KelompokTaniBumnag) => {
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)

    try {
      const { error: errNonaktif } = await supabase
        .from("kelompok_tani_bumnag")
        .update({ is_active: false })
        .eq("id", item.id)

      if (errNonaktif) {
        setPesanError(formatSupabaseError(errNonaktif, "Gagal menonaktifkan entitas"))
      } else {
        setPesanSukses(
          `Data ${getLabelJenisEntitas(item.jenis_entitas)} "${item.nama_entitas}" telah dinonaktifkan.`
        )
        await fetchData()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan nonaktifkan"))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleHapus = async (item: KelompokTaniBumnag) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus ${getLabelJenisEntitas(item.jenis_entitas)} "${item.nama_entitas}" beserta seluruh galeri, foto Storage, dan produknya?`
    )
    if (!konfirmasi) return

    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)

    const validAuth = await periksaUserAuth()
    if (!validAuth) return

    setActionLoadingId(item.id)

    try {
      // Step 1: Baca seluruh storage_path galeri milik entitas
      const { data: listGaleri, error: errGaleri } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .select("storage_path")
        .eq("kelompok_tani_bumnag_id", item.id)

      if (errGaleri) {
        setPesanError(
          formatSupabaseError(errGaleri, "Gagal membaca galeri sebelum menghapus")
        )
        setActionLoadingId(null)
        return
      }

      const storagePaths = (listGaleri || [])
        .map((g) => g.storage_path)
        .filter((p): p is string => Boolean(p && p.trim()))

      // Step 2: Menonaktifkan entitas induk & galeri anak terlebih dahulu
      await supabase
        .from("kelompok_tani_bumnag")
        .update({ is_active: false })
        .eq("id", item.id)

      await supabase
        .from("galeri_kelompok_tani_bumnag")
        .update({ is_active: false })
        .eq("kelompok_tani_bumnag_id", item.id)

      // Step 3: Hapus seluruh file Storage jika ada secara aman
      if (storagePaths.length > 0) {
        const { error: errStorage } = await supabase.storage
          .from(BUCKET_KELOMPOK_TANI_BUMNAG)
          .remove(storagePaths)

        if (errStorage) {
          setPesanError(
            formatSupabaseError(
              errStorage,
              "Gagal menghapus file foto dari Storage. Data telah dinonaktifkan tetapi belum dihapus dari database."
            )
          )
          await fetchData()
          setActionLoadingId(null)
          return
        }
      }

      // Step 4: Hapus record utama (ON DELETE CASCADE menghapus galeri & produk di DB)
      const { error: errDeleteMain } = await supabase
        .from("kelompok_tani_bumnag")
        .delete()
        .eq("id", item.id)

      if (errDeleteMain) {
        setPesanError(
          formatSupabaseError(
            errDeleteMain,
            "File Storage berhasil dihapus, namun gagal menghapus record database"
          )
        )
      } else {
        setPesanSukses(
          `Data ${getLabelJenisEntitas(item.jenis_entitas)} "${item.nama_entitas}" beserta seluruh foto dan produknya berhasil dihapus.`
        )
        await fetchData()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(formatSupabaseError(e, "Terjadi kesalahan saat menghapus"))
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filter & Search Logic
  const filteredList = listData.filter((item) => {
    const matchSearch =
      item.nama_entitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bidang_utama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nama_pimpinan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.alamat || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchJenis =
      filterJenis === "semua" || item.jenis_entitas === filterJenis

    const matchStatus =
      filterStatus === "semua" ||
      (filterStatus === "aktif" && item.is_active) ||
      (filterStatus === "nonaktif" && !item.is_active)

    return matchSearch && matchJenis && matchStatus
  })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* Top Header Navigation */}
      <div className="bg-[#2c1b01] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Dashboard Admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Kelola Kelompok Tani & BUMNag
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Panel Administrasi Data Utama Kelompok Tani dan BUMNag
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
                Tambah Data Utama
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

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Toast Notifikasi Sukses */}
        {pesanSukses && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium">{pesanSukses}</p>
                {newCreatedId && (
                  <Link
                    href={`/admin/kelompok-tani-bumnag/${newCreatedId}`}
                    className="inline-flex items-center text-xs font-semibold text-emerald-700 underline hover:text-emerald-900 mt-1"
                  >
                    Lanjut Unggah Galeri & Produk →
                  </Link>
                )}
              </div>
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

        {/* Modal Form Tambah / Edit Data Utama */}
        {isFormOpen && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xl relative animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Data Utama" : "Tambah Data Utama Baru"}
              </h2>
              <button
                type="button"
                onClick={handleBatalForm}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Jenis Entitas */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Jenis Entitas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jenis_entitas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenis_entitas: e.target.value as JenisEntitasKelompokTaniBumnag,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  >
                    {PILIHAN_JENIS_ENTITAS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Entitas */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Nama Entitas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kelompok Tani Cahaya Baru / BUMNag Aia Manggih"
                    value={formData.nama_entitas}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_entitas: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Bidang Utama (Dinamis Label) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    {getLabelBidang(formData.jenis_entitas)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formData.jenis_entitas === "kelompok_tani"
                        ? "Contoh: Pertanian Padi & Palawija"
                        : "Contoh: Perdagangan & Layanan Jasa Nagari"
                    }
                    value={formData.bidang_utama}
                    onChange={(e) =>
                      setFormData({ ...formData, bidang_utama: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Nama Pimpinan (Dinamis Label) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    {getLabelPimpinan(formData.jenis_entitas)} (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap pimpinan / ketua / direktur"
                    value={formData.nama_pimpinan}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_pimpinan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Tahun Berdiri */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Tahun Berdiri (Opsional)
                  </label>
                  <input
                    type="number"
                    min={1800}
                    max={2100}
                    placeholder="Contoh: 2018"
                    value={formData.tahun_berdiri}
                    onChange={(e) =>
                      setFormData({ ...formData, tahun_berdiri: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Jumlah Anggota */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Jumlah Anggota (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 25"
                    value={formData.jumlah_anggota}
                    onChange={(e) =>
                      setFormData({ ...formData, jumlah_anggota: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Wilayah Kegiatan */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Wilayah Kegiatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jorong Padang Sarai"
                    value={formData.wilayah_kegiatan}
                    onChange={(e) =>
                      setFormData({ ...formData, wilayah_kegiatan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Nomor Kontak */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Nomor Kontak (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={formData.nomor_kontak}
                    onChange={(e) =>
                      setFormData({ ...formData, nomor_kontak: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Urutan Tampil */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Urutan Tampil (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.urutan}
                    onChange={(e) =>
                      setFormData({ ...formData, urutan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>

                {/* Tautan Peta */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Tautan Peta (Google Maps - Wajib https://)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.tautan_peta}
                    onChange={(e) =>
                      setFormData({ ...formData, tautan_peta: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Alamat Lengkap (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat fisik sekretariat / lokasi kegiatan..."
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white resize-y"
                />
              </div>

              {/* Deskripsi Lengkap */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Deskripsi / Profil Singkat <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Penjelasan profil entitas, tujuan, bidang kegiatan..."
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white resize-y"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="px-6 py-2.5 rounded-xl bg-[#2c1b01] text-white font-semibold text-sm hover:bg-[#1a1200] transition-colors disabled:opacity-50"
                >
                  {loadingForm
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Data (Status: Nonaktif)"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter & Search Control Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/3 relative">
            <input
              type="text"
              placeholder="Cari nama, pimpinan, bidang, alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Jenis:</span>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
              >
                <option value="semua">Semua Jenis</option>
                <option value="kelompok_tani">Kelompok Tani</option>
                <option value="bumnag">BUMNag</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Draft / Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Data Admin */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loadingList ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Memuat data Kelompok Tani dan BUMNag...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-base font-semibold text-gray-700">Belum Ada Data</p>
              <p className="text-xs text-gray-500 mt-1">
                Tidak ada data entitas yang sesuai dengan kriteria filter/pencarian saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="py-3.5 px-4 w-16 text-center">Urutan</th>
                    <th className="py-3.5 px-4">Jenis & Nama Entitas</th>
                    <th className="py-3.5 px-4">Pimpinan & Kontak</th>
                    <th className="py-3.5 px-4">Bidang & Wilayah</th>
                    <th className="py-3.5 px-4 text-center">Status Cover & Aktif</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredList.map((item) => {
                    const hasCover = Boolean(coverMap[item.id])
                    const isBusy = actionLoadingId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-4 text-center font-bold text-gray-600">
                          {item.urutan}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mb-1 ${
                              item.jenis_entitas === "kelompok_tani"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {getLabelJenisEntitas(item.jenis_entitas)}
                          </span>
                          <p className="font-bold text-gray-900 text-base">
                            {item.nama_entitas}
                          </p>
                          {item.tahun_berdiri && (
                            <p className="text-xs text-gray-500">
                              Berdiri: {item.tahun_berdiri}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase">
                            {getLabelPimpinan(item.jenis_entitas)}:
                          </p>
                          <p className="font-medium text-gray-800">
                            {item.nama_pimpinan || "-"}
                          </p>
                          {item.nomor_kontak && (
                            <p className="text-xs text-gray-500">
                              ☎ {item.nomor_kontak}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase">
                            {getLabelBidang(item.jenis_entitas)}:
                          </p>
                          <p className="font-medium text-gray-800">
                            {item.bidang_utama}
                          </p>
                          {item.wilayah_kegiatan && (
                            <p className="text-xs text-gray-500">
                              📍 {item.wilayah_kegiatan}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            {item.is_active ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                                Draft (Nonaktif)
                              </span>
                            )}

                            {hasCover ? (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                ✓ Cover Siap
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">
                                Belum ada cover
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Tombol Kelola Galeri & Produk */}
                            <Link
                              href={`/admin/kelompok-tani-bumnag/${item.id}`}
                              className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 font-medium text-xs transition-colors"
                              title="Kelola foto galeri & produk"
                            >
                              Galeri & Produk
                            </Link>

                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-xs transition-colors disabled:opacity-50"
                            >
                              Edit
                            </button>

                            {/* Tombol Aktifkan / Nonaktifkan */}
                            {item.is_active ? (
                              <button
                                type="button"
                                onClick={() => handleNonaktifkan(item)}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                              >
                                Nonaktifkan
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAktifkan(item)}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                              >
                                Aktifkan
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handleHapus(item)}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
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
