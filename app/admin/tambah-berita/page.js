"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

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

function potongTeks(teks, batas = 180) {
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
  const [judul, setJudul] = useState("")
  const [konten, setKonten] = useState("")
  const [fotoFile, setFotoFile] = useState(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState("")

  const [beritaList, setBeritaList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")

  const fileInputRef = useRef(null)

  const periksaSesi = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      alert("Sesi admin tidak terbaca. Silakan login ulang.")
      window.location.href = "/login"
      return null
    }

    return session
  }

  const fetchBerita = async () => {
    setLoadingData(true)
    setError("")

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

      setError(
        fetchError.message ||
          "Gagal memuat data berita."
      )

      setLoadingData(false)
      return
    }

    setBeritaList(data || [])
    setLoadingData(false)
  }

  useEffect(() => {
    fetchBerita()
  }, [])

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

  const uploadFotoBerita = async () => {
    if (!fotoFile) {
      return existingFotoUrl || ""
    }

    if (!fotoFile.type.startsWith("image/")) {
      throw new Error(
        "File yang dipilih harus berupa gambar."
      )
    }

    if (fotoFile.size > 2 * 1024 * 1024) {
      throw new Error(
        "Ukuran foto terlalu besar. Maksimal 2 MB."
      )
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
      throw new Error(
        `Gagal mengunggah foto: ${uploadError.message}`
      )
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

    if (!judul.trim()) {
      alert("Judul berita wajib diisi.")
      return
    }

    if (!konten.trim()) {
      alert("Isi berita wajib diisi.")
      return
    }

    setLoading(true)
    setError("")

    const session = await periksaSesi()

    if (!session) {
      setLoading(false)
      return
    }

    try {
      const fotoUrlToSave =
        await uploadFotoBerita()

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

      alert(
        editingId
          ? "Berita berhasil diperbarui!"
          : "Berita berhasil dipublikasikan!"
      )

      resetForm()
      await fetchBerita()
    } catch (simpanError) {
      console.error(
        "simpanBerita error:",
        simpanError
      )

      alert(
        simpanError?.message ||
          "Gagal menyimpan berita."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setJudul(item.judul || "")
    setKonten(item.konten || "")
    setExistingFotoUrl(item.foto_url || "")
    setFotoFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const handleDelete = async (item) => {
    if (loading) {
      return
    }

    const session = await periksaSesi()

    if (!session) {
      return
    }

    const konfirmasi = window.confirm(
      `Yakin ingin menghapus berita "${item.judul}"?`
    )

    if (!konfirmasi) {
      return
    }

    setLoading(true)
    setError("")

    const { error: deleteError } = await supabase
      .from("berita")
      .delete()
      .eq("id", item.id)

    if (deleteError) {
      console.error(
        "hapus berita error:",
        deleteError
      )

      alert(
        `Gagal menghapus berita: ${deleteError.message}`
      )

      setLoading(false)
      return
    }

    alert("Berita berhasil dihapus.")

    if (editingId === item.id) {
      resetForm()
    }

    await fetchBerita()
    setLoading(false)
  }

  const handleLogout = async () => {
    setLoading(true)
    await keluarDariAdmin("Logout error")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Link
                href="/admin"
                className="rounded-lg p-2 transition-colors hover:bg-white/50"
                title="Kembali ke Admin Panel"
              >
                <svg
                  className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6"
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

              <div className="min-w-0 flex-1">
                <h1 className="break-words text-lg font-bold text-gray-900 sm:text-xl md:text-2xl lg:text-3xl">
                  {editingId
                    ? "Edit Berita"
                    : "Kelola Berita"}
                </h1>

                <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                  Tambah, edit, dan hapus berita Nagari
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
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

              Logout
            </button>
          </div>

          <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#b6a587] sm:w-24" />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 md:gap-6 lg:grid-cols-12">
          {/* Form berita */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5 md:p-6">
              <h2 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg md:text-xl">
                {editingId
                  ? "Edit Data Berita"
                  : "Form Berita Baru"}
              </h2>

              <p className="mb-5 text-xs text-gray-500 sm:text-sm">
                Judul dan isi berita wajib diisi. Foto bersifat opsional.
              </p>

              <form
                onSubmit={simpanBerita}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Judul Berita
                  </label>

                  <input
                    type="text"
                    placeholder="Masukkan judul berita"
                    value={judul}
                    onChange={(event) =>
                      setJudul(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2c1b01] sm:px-4 sm:py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Isi Berita
                  </label>

                  <textarea
                    placeholder="Tuliskan isi berita di sini..."
                    value={konten}
                    onChange={(event) =>
                      setKonten(event.target.value)
                    }
                    rows={12}
                    className="min-h-[240px] w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-base transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2c1b01] sm:px-4 sm:py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Foto Berita{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (opsional, maksimal 2 MB)
                    </span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0] ||
                        null

                      setFotoFile(file)
                    }}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-2 py-2 text-xs file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#2c1b01] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#3a2604] sm:px-3 sm:py-2.5 sm:text-sm sm:file:mr-4 sm:file:px-4 sm:file:py-2.5 sm:file:text-sm"
                  />

                  {fotoFile && (
                    <p className="mt-2 break-words text-xs text-green-700">
                      Foto baru dipilih:{" "}
                      <strong>{fotoFile.name}</strong>
                    </p>
                  )}

                  {existingFotoUrl &&
                    !fotoFile && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs text-gray-500">
                          Foto yang sedang digunakan:
                        </p>

                        <img
                          src={existingFotoUrl}
                          alt="Foto berita saat ini"
                          className="h-36 w-full rounded-lg border border-gray-200 object-cover"
                        />

                        <p className="mt-2 text-xs text-gray-500">
                          Foto lama akan tetap digunakan jika tidak memilih foto baru.
                        </p>
                      </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] flex-1 rounded-lg bg-gradient-to-r from-[#2c1b01] to-[#1a1200] py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-[#3a2604] hover:to-[#100b00] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-base"
                  >
                    {loading
                      ? "Menyimpan..."
                      : editingId
                        ? "Simpan Perubahan"
                        : "Publikasikan Berita"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="min-h-[44px] rounded-lg bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-60 sm:px-6 sm:py-2.5 sm:text-base"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Daftar berita */}
          <div className="lg:col-span-7">
            <div className="flex min-h-[650px] max-h-[950px] flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-lg sm:p-5 md:p-6">
              <div className="mb-4 flex-shrink-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 sm:text-lg md:text-xl">
                      Daftar Berita
                    </h2>

                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                      {searchQuery
                        ? `${filteredBeritaList.length} dari ${beritaList.length} berita`
                        : `${beritaList.length} berita tersedia`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchBerita}
                    disabled={
                      loading || loadingData
                    }
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60 sm:px-4 sm:text-sm"
                  >
                    <svg
                      className="h-4 w-4"
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

                    Refresh
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari judul atau isi berita..."
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-base transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2c1b01] sm:text-sm"
                  />

                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
                      onClick={() =>
                        setSearchQuery("")
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                      aria-label="Hapus pencarian"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loadingData && (
                <div className="flex flex-1 flex-col items-center justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#2c1b01]" />

                  <p className="mt-4 text-sm text-gray-500">
                    Memuat data berita...
                  </p>
                </div>
              )}

              {!loadingData &&
                beritaList.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                      />
                    </svg>

                    <p className="mt-4 text-sm text-gray-500">
                      Belum ada berita.
                    </p>
                  </div>
                )}

              {!loadingData &&
                beritaList.length > 0 &&
                filteredBeritaList.length ===
                  0 && (
                  <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
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

                    <p className="mt-4 text-sm text-gray-500">
                      Tidak ada berita yang cocok dengan pencarian.
                    </p>
                  </div>
                )}

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 sm:pr-2">
                {!loadingData &&
                  filteredBeritaList.map(
                    (item) => (
                      <article
                        id={`berita-${item.id}`}
                        key={item.id}
                        className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                          editingId === item.id
                            ? "border-yellow-400 bg-yellow-50/40"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row">
                          {item.foto_url && (
                            <img
                              src={item.foto_url}
                              alt={item.judul}
                              className="h-44 w-full flex-shrink-0 rounded-lg border border-gray-200 object-cover sm:h-32 sm:w-44"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h3 className="break-words text-base font-bold text-gray-900 sm:text-lg">
                                  {item.judul}
                                </h3>

                                <p className="mt-1 text-xs text-gray-500">
                                  {formatTanggal(
                                    item.created_at
                                  )}
                                </p>
                              </div>

                              <div className="flex w-full gap-2 sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(item)
                                  }
                                  disabled={loading}
                                  className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-yellow-600 disabled:opacity-60 sm:flex-none"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>

                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(item)
                                  }
                                  disabled={loading}
                                  className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 sm:flex-none"
                                >
                                  <svg
                                    className="h-4 w-4"
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

                                  Hapus
                                </button>
                              </div>
                            </div>

                            <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                              {potongTeks(
                                item.konten
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}