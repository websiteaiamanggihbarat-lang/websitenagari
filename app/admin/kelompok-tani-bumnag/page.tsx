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
      " Data melanggar aturan validasi database (check constraint)."
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

  const [loadingList, setLoadingList] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [newCreatedId, setNewCreatedId] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormState>(FORM_AWAL)

  // Filter & Search State (Hanya Search dan Jenis Entitas)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterJenis, setFilterJenis] = useState<string>("semua")

  const handleLogout = async () => {
    setLoadingList(true)
    await keluarDariAdmin("Logout error")
  }

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
      // Baca seluruh data entitas diurutkan berdasarkan created_at DESC
      const { data: dataEntitas, error: errEntitas } = await supabase
        .from("kelompok_tani_bumnag")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })

      if (errEntitas) {
        setPesanError(formatSupabaseError(errEntitas, "Gagal membaca data entitas"))
        setLoadingList(false)
        return
      }

      const arr = (dataEntitas as KelompokTaniBumnag[]) || []
      setListData(arr)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan sistem saat memuat data: ${msg}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto dismiss success toast message after 4 seconds
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  const handleOpenTambah = () => {
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setEditingId(null)
    setFormData(FORM_AWAL)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: KelompokTaniBumnag) => {
    setPesanSukses(null)
    setPesanError(null)
    setNewCreatedId(null)
    setEditingId(item.id)
    setFormData({
      nama_entitas: item.nama_entitas,
      jenis_entitas: item.jenis_entitas,
      bidang_utama: item.bidang_utama,
      deskripsi: item.deskripsi || "",
      nama_pimpinan: item.nama_pimpinan || "",
      tahun_berdiri: item.tahun_berdiri ? item.tahun_berdiri.toString() : "",
      jumlah_anggota: item.jumlah_anggota ? item.jumlah_anggota.toString() : "",
      alamat: item.alamat || "",
      wilayah_kegiatan: item.wilayah_kegiatan || "",
      nomor_kontak: item.nomor_kontak || "",
      tautan_peta: item.tautan_peta || "",
    })
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(FORM_AWAL)
  }

  const validateForm = (): boolean => {
    if (!formData.nama_entitas.trim()) {
      setPesanError("Nama Entitas wajib diisi.")
      return false
    }
    if (!formData.bidang_utama.trim()) {
      setPesanError("Bidang Utama / Kegiatan wajib diisi.")
      return false
    }
    if (!formData.deskripsi.trim()) {
      setPesanError("Deskripsi / Profil Singkat wajib diisi.")
      return false
    }

    if (formData.tahun_berdiri.trim()) {
      const thn = parseInt(formData.tahun_berdiri.trim(), 10)
      if (isNaN(thn) || thn < 1800 || thn > 2100) {
        setPesanError("Tahun berdiri tidak valid (harus 1800 - 2100).")
        return false
      }
    }

    if (formData.jumlah_anggota.trim()) {
      const jml = parseInt(formData.jumlah_anggota.trim(), 10)
      if (isNaN(jml) || jml < 0) {
        setPesanError("Jumlah anggota tidak boleh negatif.")
        return false
      }
    }

    if (formData.tautan_peta.trim()) {
      if (!formData.tautan_peta.trim().startsWith("https://")) {
        setPesanError("Tautan peta wajib diawali dengan https://")
        return false
      }
    }

    return true
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPesanSukses(null)
    setPesanError(null)

    if (loadingForm) return
    if (!validateForm()) return

    setLoadingForm(true)

    const validSesi = await periksaUserAuth()
    if (!validSesi) {
      setLoadingForm(false)
      return
    }

    const payload = {
      nama_entitas: formData.nama_entitas.trim(),
      jenis_entitas: formData.jenis_entitas,
      bidang_utama: formData.bidang_utama.trim(),
      deskripsi: formData.deskripsi.trim(),
      nama_pimpinan: formData.nama_pimpinan.trim() || null,
      tahun_berdiri: formData.tahun_berdiri.trim()
        ? parseInt(formData.tahun_berdiri.trim(), 10)
        : null,
      jumlah_anggota: formData.jumlah_anggota.trim()
        ? parseInt(formData.jumlah_anggota.trim(), 10)
        : null,
      alamat: formData.alamat.trim() || null,
      wilayah_kegiatan: formData.wilayah_kegiatan.trim() || null,
      nomor_kontak: formData.nomor_kontak.trim() || null,
      tautan_peta: formData.tautan_peta.trim() || null,
    }

    try {
      if (editingId) {
        // Mode Edit (Preserve status is_active)
        const { error: errUpdate } = await supabase
          .from("kelompok_tani_bumnag")
          .update(payload)
          .eq("id", editingId)

        if (errUpdate) {
          setPesanError(formatSupabaseError(errUpdate, "Gagal memperbarui data entitas"))
          setLoadingForm(false)
          return
        }

        setPesanSukses(`Perubahan data "${payload.nama_entitas}" berhasil disimpan!`)
        handleBatalForm()
        await fetchData()
      } else {
        // Mode Tambah Baru (is_active: true secara otomatis)
        const newId = crypto.randomUUID()
        const payloadInsert = {
          id: newId,
          ...payload,
          is_active: true, // OTOMATIS AKTIF
          urutan: 0,
        }

        const { error: errInsert } = await supabase
          .from("kelompok_tani_bumnag")
          .insert(payloadInsert)

        if (errInsert) {
          setPesanError(formatSupabaseError(errInsert, "Gagal menambahkan data baru"))
          setLoadingForm(false)
          return
        }

        setNewCreatedId(newId)
        setPesanSukses(`Data "${payload.nama_entitas}" berhasil ditambahkan.`)
        handleBatalForm()
        await fetchData()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan sistem: ${msg}`)
    } finally {
      setLoadingForm(false)
    }
  }

  const handleHapus = async (item: KelompokTaniBumnag) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus data "${item.nama_entitas}"?\n\nPERINGATAN: Seluruh foto galeri dan daftar produk/unit usaha terkait juga akan dihapus secara permanen!`
    )
    if (!konfirmasi) return

    setPesanSukses(null)
    setPesanError(null)
    setActionLoadingId(item.id)

    try {
      // 1. Ambil storage path galeri untuk dibersihkan dari Storage
      const { data: listGaleri } = await supabase
        .from("galeri_kelompok_tani_bumnag")
        .select("storage_path")
        .eq("kelompok_tani_bumnag_id", item.id)

      if (listGaleri && listGaleri.length > 0) {
        const paths = listGaleri.map((g) => g.storage_path).filter(Boolean)
        if (paths.length > 0) {
          await supabase.storage.from(BUCKET_KELOMPOK_TANI_BUMNAG).remove(paths)
        }
      }

      // 2. Hapus child galeri dan produk usaha
      await supabase.from("galeri_kelompok_tani_bumnag").delete().eq("kelompok_tani_bumnag_id", item.id)
      await supabase.from("produk_usaha_kelompok_tani_bumnag").delete().eq("kelompok_tani_bumnag_id", item.id)

      // 3. Hapus entitas parent
      const { error: errDelete } = await supabase
        .from("kelompok_tani_bumnag")
        .delete()
        .eq("id", item.id)

      if (errDelete) {
        setPesanError(formatSupabaseError(errDelete, `Gagal menghapus data "${item.nama_entitas}"`))
      } else {
        setPesanSukses(`Data "${item.nama_entitas}" beserta rincian galeri & produk berhasil dihapus.`)
        await fetchData()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat menghapus data: ${msg}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtering data berdasarkan SearchQuery & FilterJenis
  const filteredList = listData.filter((item) => {
    // Filter Jenis
    if (filterJenis !== "semua" && item.jenis_entitas !== filterJenis) {
      return false
    }

    // Filter Search Text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchNama = item.nama_entitas.toLowerCase().includes(q)
      const matchPimpinan = item.nama_pimpinan ? item.nama_pimpinan.toLowerCase().includes(q) : false
      const matchBidang = item.bidang_utama.toLowerCase().includes(q)
      const matchAlamat = item.alamat ? item.alamat.toLowerCase().includes(q) : false
      const matchWilayah = item.wilayah_kegiatan ? item.wilayah_kegiatan.toLowerCase().includes(q) : false

      if (!matchNama && !matchPimpinan && !matchBidang && !matchAlamat && !matchWilayah) {
        return false
      }
    }

    return true
  })

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
                Kelola Kelompok Tani & BUMNag
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola data kelompok tani dan BUMNag Nagari Aia Manggih Barat.
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
                Tambah Data Baru
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{pesanSukses}</span>
                </div>

                {newCreatedId && (
                  <Link
                    href={`/admin/kelompok-tani-bumnag/${newCreatedId}`}
                    className="flex-shrink-0 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                  >
                    Kelola Galeri & Produk Sekarang ↗
                  </Link>
                )}
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

        {/* SECTION: FORM TAMBAH / EDIT KELOMPOK TANI & BUMNAG */}
        {isFormOpen && (
          <div id="form-entitas-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {editingId ? "Edit Data Kelompok Tani / BUMNag" : "Tambah Data Kelompok Tani / BUMNag"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingId
                  ? "Ubah data kelompok tani atau BUMNag."
                  : "Lengkapi data utama kelompok tani atau BUMNag."}
              </p>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Jenis Entitas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Bidang Utama */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Nama Pimpinan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {getLabelPimpinan(formData.jenis_entitas)} <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap pimpinan / ketua / direktur"
                    value={formData.nama_pimpinan}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_pimpinan: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Tahun Berdiri */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tahun Berdiri <span className="text-xs font-normal text-gray-500">(Opsional)</span>
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Jumlah Anggota */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jumlah Anggota <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 25"
                    value={formData.jumlah_anggota}
                    onChange={(e) =>
                      setFormData({ ...formData, jumlah_anggota: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Wilayah Kegiatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Wilayah Kegiatan <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jorong Padang Sarai"
                    value={formData.wilayah_kegiatan}
                    onChange={(e) =>
                      setFormData({ ...formData, wilayah_kegiatan: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Nomor Kontak */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nomor Kontak <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={formData.nomor_kontak}
                    onChange={(e) =>
                      setFormData({ ...formData, nomor_kontak: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>

                {/* Tautan Peta */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tautan Peta (Google Maps - Wajib https://) <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.tautan_peta}
                    onChange={(e) =>
                      setFormData({ ...formData, tautan_peta: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  />
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Alamat Lengkap <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat fisik sekretariat / lokasi kegiatan..."
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                />
              </div>

              {/* Deskripsi Lengkap */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                />
              </div>

              {/* Action Buttons (Single Batal Button di Footer) */}
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
                    <span>Simpan Data</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter & Search Control Panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Cari nama, pimpinan, bidang, alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6b4b1d] focus:border-[#6b4b1d] text-sm bg-white"
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

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis:</span>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-[#6b4b1d] focus:border-[#6b4b1d]"
            >
              <option value="semua">Semua Jenis</option>
              <option value="kelompok_tani">Kelompok Tani</option>
              <option value="bumnag">BUMNag</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Admin (Kolom: Nama Entitas, Jenis, Bidang, Aksi) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingList ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
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
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold w-[30%]">Nama Entitas</th>
                    <th scope="col" className="px-6 py-4 font-bold w-[18%]">Jenis</th>
                    <th scope="col" className="px-6 py-4 font-bold w-[25%]">Bidang</th>
                    <th scope="col" className="px-6 py-4 font-bold text-right w-[27%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {filteredList.map((item) => {
                    const isBusy = actionLoadingId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 text-base">
                            {item.nama_entitas}
                          </p>
                          {item.tahun_berdiri && (
                            <p className="text-xs text-gray-500">
                              Berdiri: {item.tahun_berdiri}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-800">
                          {getLabelJenisEntitas(item.jenis_entitas)}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-700">
                          {item.bidang_utama}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Kelola Galeri & Produk */}
                            <Link
                              href={`/admin/kelompok-tani-bumnag/${item.id}`}
                              className="rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4] cursor-pointer"
                              title="Kelola foto galeri & produk"
                            >
                              Galeri & Produk
                            </Link>

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
    </div>
  )
}
