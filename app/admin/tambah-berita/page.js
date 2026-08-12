"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import ConfirmModal from "@/components/ui/ConfirmModal"

function formatTanggal(nilai) {
  if (!nilai) {
    return "Tanggal tidak tersedia"
  }

  return new Date(nilai).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function potongTeks(teks, batas = 120) {
  if (!teks) {
    return ""
  }

  if (teks.length <= batas) {
    return teks
  }

  return `${teks.slice(0, batas).trim()}...`
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

export default function TambahBerita() {
  const formRef = useRef(null)
  const fileInputRef = useRef(null)

  const [judul, setJudul] = useState("")
  const [konten, setKonten] = useState("")
  const [fotoFile, setFotoFile] = useState(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState("")

  const [beritaList, setBeritaList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [pesanSukses, setPesanSukses] = useState(null)
  const [pesanError, setPesanError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const periksaSesi = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      window.location.href = "/login"
      return null
    }

    return session
  }

  const fetchBerita = async () => {
    setLoadingData(true)

    const session = await periksaSesi()

    if (!session) {
      setLoadingData(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("berita")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      })

    if (fetchError) {
      console.error("fetchBerita error:", fetchError)
      setPesanError(fetchError.message || "Gagal memuat data berita.")
      setLoadingData(false)
      return
    }

    setBeritaList(data || [])
    setLoadingData(false)
  }

  useEffect(() => {
    fetchBerita()
  }, [])

  // Auto dismiss success toast message after 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  // Logout otomatis jika admin tidak aktif selama 5 menit.
  useEffect(() => {
    let timeoutId

    const logoutOtomatis = async () => {
      await keluarDariAdmin("Auto logout error")
    }

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(
        logoutOtomatis,
        5 * 60 * 1000
      )
    }

    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
    ]

    events.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [])

  const filteredBeritaList = useMemo(() => {
    const kataKunci = searchQuery
      .trim()
      .toLowerCase()

    if (!kataKunci) {
      return beritaList
    }

    return beritaList.filter((item) => {
      const judulBerita = String(
        item.judul || ""
      ).toLowerCase()

      const isiBerita = String(
        item.konten || ""
      ).toLowerCase()

      return (
        judulBerita.includes(kataKunci) ||
        isiBerita.includes(kataKunci)
      )
    })
  }, [beritaList, searchQuery])

  const resetForm = () => {
    setJudul("")
    setKonten("")
    setFotoFile(null)
    setExistingFotoUrl("")
    setEditingId(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleOpenTambah = () => {
    resetForm()
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleBatalForm = () => {
    resetForm()
    setIsFormOpen(false)
  }

  const uploadFotoBerita = async () => {
    if (!fotoFile) {
      return existingFotoUrl || ""
    }

    if (!fotoFile.type.startsWith("image/")) {
      throw new Error("File yang dipilih harus berupa gambar.")
    }

    if (fotoFile.size > 2 * 1024 * 1024) {
      throw new Error("Ukuran foto terlalu besar. Maksimal 2 MB.")
    }

    const namaAman = fotoFile.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "-")

    const namaFile = `${Date.now()}-${namaAman}`

    const { error: uploadError } = await supabase
      .storage
      .from("foto-berita")
      .upload(namaFile, fotoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: fotoFile.type,
      })

    if (uploadError) {
      throw new Error(`Gagal mengunggah foto: ${uploadError.message}`)
    }

    const { data: publicData } = supabase
      .storage
      .from("foto-berita")
      .getPublicUrl(namaFile)

    return publicData?.publicUrl || ""
  }

  const simpanBerita = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setPesanSukses(null)
    setPesanError(null)

    if (!judul.trim()) {
      setPesanError("Judul berita wajib diisi.")
      return
    }

    if (!konten.trim()) {
      setPesanError("Isi berita wajib diisi.")
      return
    }

    setLoading(true)

    const session = await periksaSesi()

    if (!session) {
      setLoading(false)
      return
    }

    try {
      const fotoUrlToSave = await uploadFotoBerita()

      let simpanError = null

      if (editingId) {
        const { error: updateError } = await supabase
          .from("berita")
          .update({
            judul: judul.trim(),
            konten: konten.trim(),
            foto_url: fotoUrlToSave || null,
          })
          .eq("id", editingId)

        simpanError = updateError
      } else {
        const { error: insertError } = await supabase
          .from("berita")
          .insert([
            {
              judul: judul.trim(),
              konten: konten.trim(),
              foto_url: fotoUrlToSave || null,
              created_at: new Date().toISOString(),
            },
          ])

        simpanError = insertError
      }

      if (simpanError) {
        throw simpanError
      }

      setPesanSukses(
        editingId
          ? "Berita berhasil diperbarui."
          : "Berita berhasil dipublikasikan."
      )

      handleBatalForm()
      await fetchBerita()
    } catch (simpanError) {
      console.error("simpanBerita error:", simpanError)
      setPesanError(simpanError?.message || "Gagal menyimpan berita.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setPesanSukses(null)
    setPesanError(null)

    setEditingId(item.id)
    setJudul(item.judul || "")
    setKonten(item.konten || "")
    setExistingFotoUrl(item.foto_url || "")
    setFotoFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleDelete = (item) => {
    if (loading) return
    setDeleteTarget(item)
  }

  const executeDelete = async (item) => {
    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    const { error: deleteError } = await supabase
      .from("berita")
      .delete()
      .eq("id", item.id)

    if (deleteError) {
      console.error("hapus berita error:", deleteError)
      const msg = `Gagal menghapus berita: ${deleteError.message}`
      setPesanError(msg)
      setLoading(false)
      return
    }

    const msg = `Berita "${item.judul}" berhasil dihapus.`
    setPesanSukses(msg)

    if (editingId === item.id) {
      handleBatalForm()
    }

    await fetchBerita()
    setLoading(false)
  }

  const handleLogout = async () => {
    setLoading(true)
    await keluarDariAdmin("Logout error")
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
                  Kelola Berita Nagari
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Publikasi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola pengumuman, berita resmi &amp; artikel Nagari Aia Manggih Barat.
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
                <span>Tambah Berita Baru</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-200 hover:text-white font-semibold px-4 py-2.5 text-xs sm:text-sm border border-red-500/30 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
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
      </header>

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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        {/* SECTION 1: Form Tambah / Edit Berita (Krem Header, Body Putih) */}
        {isFormOpen && (
          <div ref={formRef} id="form-berita-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {editingId ? "Edit Berita" : "Tambah Berita Baru"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingId
                  ? "Ubah informasi berita Nagari."
                  : "Lengkapi judul, isi, dan foto berita Nagari."}
              </p>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={simpanBerita} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Judul Berita <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Masukkan judul berita..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Isi Berita <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Tuliskan isi berita Nagari di sini..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Foto Berita <span className="text-xs font-normal text-gray-500">(Opsional, maksimal 2 MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFotoFile(file)
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white file:mr-3 file:rounded-md file:border-0 file:bg-[#2c1b01] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                />

                {fotoFile && (
                  <p className="mt-2 text-xs font-medium text-green-700">
                    Foto baru dipilih: <strong>{fotoFile.name}</strong>
                  </p>
                )}

                {existingFotoUrl && !fotoFile && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs text-gray-500 font-medium">
                      Foto yang sedang digunakan:
                    </p>
                    <img
                      src={existingFotoUrl}
                      alt="Foto berita saat ini"
                      className="h-40 w-full max-w-sm rounded-xl border border-gray-200 object-cover shadow-xs"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Foto lama akan tetap digunakan jika tidak memilih foto baru.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Buttons (Batal & Simpan) */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  disabled={loading}
                  className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : editingId ? (
                    <span>Simpan Perubahan</span>
                  ) : (
                    <span>Publikasikan Berita</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 2: Tabel Daftar Berita (Outer Card Konsisten) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header Section Krem/White + Search Box */}
          <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Daftar Berita
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Menampilkan seluruh berita Nagari.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari judul atau isi berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-8 text-xs text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white cursor-pointer"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Hapus pencarian"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold w-[15%]">PREVIEW</th>
                  <th scope="col" className="px-6 py-4 font-bold w-[45%]">JUDUL BERITA</th>
                  <th scope="col" className="px-6 py-4 font-bold w-[20%]">DITAMBAHKAN</th>
                  <th scope="col" className="px-6 py-4 font-bold text-right w-[20%]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {loadingData ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-gray-500">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
                      <p className="text-sm font-medium">Memuat data berita...</p>
                    </td>
                  </tr>
                ) : beritaList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      <p className="text-base font-semibold text-gray-700">Belum ada berita.</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Gunakan tombol &quot;Tambah Berita Baru&quot; di bagian atas untuk mempublikasikan berita pertama.
                      </p>
                    </td>
                  </tr>
                ) : filteredBeritaList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      <p className="text-base font-semibold text-gray-700">Tidak ada berita yang cocok dengan pencarian.</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coba kata kunci pencarian yang berbeda.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBeritaList.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        editingId === item.id ? "bg-[#f0e8db]/30" : ""
                      }`}
                    >
                      {/* Preview */}
                      <td className="py-4 px-6">
                        {item.foto_url ? (
                          <div className="relative h-14 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-xs">
                            <img
                              src={item.foto_url}
                              alt={item.judul}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                            </svg>
                          </div>
                        )}
                      </td>

                      {/* Judul Berita */}
                      <td className="py-4 px-6 text-gray-900">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                          {item.judul}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {potongTeks(item.konten)}
                        </p>
                      </td>

                      {/* Ditambahkan */}
                      <td className="py-4 px-6 text-gray-600">
                        <span className="text-xs">
                          {formatTanggal(item.created_at)}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-6 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          {/* Tombol 1: Edit */}
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            disabled={loading}
                            className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                          >
                            Edit
                          </button>

                          {/* Tombol 2: Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={loading}
                            className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Berita?"
        message={
          <>
            Apakah Anda yakin ingin menghapus berita <strong>&quot;{deleteTarget?.judul}&quot;</strong>?
            <br />
            Data berita akan dihapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={loading}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeDelete(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}