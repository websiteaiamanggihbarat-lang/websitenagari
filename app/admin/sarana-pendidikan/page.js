"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const BUCKET_FOTO = "foto-sarana-pendidikan"

const FORM_PENDATAAN_AWAL = {
  tahun_pendataan: new Date().getFullYear().toString(),
  sumber_data: "",
  keterangan: "",
  status_publikasi: "draft",
  is_active: false,
}

function keAngka(nilai) {
  const angka = Number(nilai)
  return Number.isFinite(angka) ? angka : 0
}

function ambilPathFotoDariUrl(fotoUrl) {
  if (!fotoUrl) {
    return null
  }

  const penanda = `/storage/v1/object/public/${BUCKET_FOTO}/`
  const posisi = fotoUrl.indexOf(penanda)

  if (posisi === -1) {
    return null
  }

  const pathDenganQuery = fotoUrl.slice(posisi + penanda.length)
  const pathTanpaQuery = pathDenganQuery.split("?")[0]

  try {
    return decodeURIComponent(pathTanpaQuery)
  } catch {
    return pathTanpaQuery
  }
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

export default function SaranaPendidikanAdminIndex() {
  const [formPendataan, setFormPendataan] = useState(FORM_PENDATAAN_AWAL)
  const [pendataanList, setPendataanList] = useState([])
  const [editingPendataanId, setEditingPendataanId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingPendataan, setLoadingPendataan] = useState(true)

  const [pesanSukses, setPesanSukses] = useState(null)
  const [pesanError, setPesanError] = useState(null)

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

  const fetchPendataan = async () => {
    setLoadingPendataan(true)
    setPesanError(null)

    const session = await periksaSesi()

    if (!session) {
      setLoadingPendataan(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("pendataan_sarana_pendidikan")
      .select("*")
      .order("tahun_pendataan", { ascending: false })
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("fetch pendataan sarana pendidikan error:", fetchError)
      setPesanError(fetchError.message || "Gagal memuat periode pendataan.")
      setPendataanList([])
    } else {
      setPendataanList(data || [])
    }
    setLoadingPendataan(false)
  }

  useEffect(() => {
    fetchPendataan()
  }, [])

  // Auto dismiss notification toast message after 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  // Logout otomatis apabila admin tidak aktif selama 5 menit.
  useEffect(() => {
    let timeoutId

    const logoutOtomatis = async () => {
      await keluarDariAdmin("Auto logout error")
    }

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(logoutOtomatis, 5 * 60 * 1000)
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart"]

    events.forEach((event) => window.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [])

  const ubahFormPendataan = (event) => {
    const { name, value } = event.target
    setFormPendataan((formSebelumnya) => ({
      ...formSebelumnya,
      [name]: value,
    }))
  }

  const resetFormPendataan = () => {
    setFormPendataan({
      ...FORM_PENDATAAN_AWAL,
      tahun_pendataan: new Date().getFullYear().toString(),
    })
    setEditingPendataanId(null)
  }

  const handleOpenTambah = () => {
    resetFormPendataan()
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    resetFormPendataan()
    setIsFormOpen(false)
  }

  const simpanPendataan = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setPesanSukses(null)
    setPesanError(null)

    const tahun = keAngka(formPendataan.tahun_pendataan)

    if (tahun < 1900 || tahun > 2100) {
      setPesanError("Tahun pendataan harus berada antara 1900 dan 2100.")
      return
    }

    if (!formPendataan.sumber_data.trim()) {
      setPesanError("Sumber data wajib diisi.")
      return
    }

    setLoading(true)

    const session = await periksaSesi()

    if (!session) {
      setLoading(false)
      return
    }

    const dataPendataan = {
      tahun_pendataan: tahun,
      sumber_data: formPendataan.sumber_data.trim(),
      keterangan: formPendataan.keterangan.trim() || null,
      status_publikasi: formPendataan.status_publikasi,
    }

    if (editingPendataanId) {
      dataPendataan.is_active = Boolean(formPendataan.is_active)
    } else {
      dataPendataan.is_active = false
    }

    try {
      if (editingPendataanId) {
        const { error: updateError } = await supabase
          .from("pendataan_sarana_pendidikan")
          .update(dataPendataan)
          .eq("id", editingPendataanId)

        if (updateError) {
          throw updateError
        }
        setPesanSukses("Periode pendataan sarana pendidikan berhasil diperbarui.")
      } else {
        const { error: insertError } = await supabase
          .from("pendataan_sarana_pendidikan")
          .insert([dataPendataan])

        if (insertError) {
          throw insertError
        }
        setPesanSukses("Periode pendataan sarana pendidikan berhasil ditambahkan.")
      }

      resetFormPendataan()
      setIsFormOpen(false)
      await fetchPendataan()
    } catch (simpanError) {
      console.error("simpan pendataan error:", simpanError)

      if (simpanError?.code === "23505") {
        setPesanError(
          "Data pendataan untuk tahun tersebut sudah tersedia. Gunakan tombol Edit pada data yang sudah ada."
        )
      } else {
        setPesanError(
          `Gagal menyimpan pendataan: ${
            simpanError?.message || "Terjadi kesalahan."
          }`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const mulaiEditPendataan = (item) => {
    setPesanSukses(null)
    setPesanError(null)

    setEditingPendataanId(item.id)
    setFormPendataan({
      tahun_pendataan: item.tahun_pendataan?.toString() || "",
      sumber_data: item.sumber_data || "",
      keterangan: item.keterangan || "",
      status_publikasi: item.status_publikasi || "draft",
      is_active: Boolean(item.is_active),
    })

    setIsFormOpen(true)

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  const handleToggleActivePendataan = async (item) => {
    if (loading) return

    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      const statusBaru = !item.is_active
      const { error: errToggle } = await supabase
        .from("pendataan_sarana_pendidikan")
        .update({ is_active: statusBaru })
        .eq("id", item.id)

      if (errToggle) {
        setPesanError(`Gagal mengubah status aktif periode: ${errToggle.message}`)
      } else {
        setPesanSukses(
          statusBaru
            ? `Periode pendataan pendidikan tahun ${item.tahun_pendataan} berhasil diaktifkan.`
            : `Periode pendataan pendidikan tahun ${item.tahun_pendataan} berhasil dinonaktifkan.`
        )
      }

      await fetchPendataan()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat mengubah status periode: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const hapusPendataan = async (item) => {
    if (loading) {
      return
    }

    const session = await periksaSesi()

    if (!session) {
      return
    }

    const yakin = window.confirm(
      `Yakin ingin menghapus pendataan tahun ${item.tahun_pendataan}?\n\nSeluruh sekolah pada tahun tersebut juga akan terhapus.`
    )

    if (!yakin) {
      return
    }

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      const { data: daftarFoto, error: fotoError } = await supabase
        .from("sarana_pendidikan")
        .select("foto_url")
        .eq("pendataan_id", item.id)

      if (fotoError) {
        console.error("Gagal membaca daftar foto:", fotoError)
      }

      const { error: hapusError } = await supabase
        .from("pendataan_sarana_pendidikan")
        .delete()
        .eq("id", item.id)

      if (hapusError) {
        throw hapusError
      }

      const daftarPath = (daftarFoto || [])
        .map((foto) => ambilPathFotoDariUrl(foto.foto_url))
        .filter(Boolean)

      if (daftarPath.length > 0) {
        const { error: hapusFotoError } = await supabase.storage
          .from(BUCKET_FOTO)
          .remove(daftarPath)

        if (hapusFotoError) {
          console.error("Sebagian foto gagal dibersihkan:", hapusFotoError)
        }
      }

      setPesanSukses("Periode pendataan sarana pendidikan berhasil dihapus.")

      if (editingPendataanId === item.id) {
        handleBatalForm()
      }

      await fetchPendataan()
    } catch (hapusError) {
      console.error("hapus pendataan error:", hapusError)

      setPesanError(
        `Gagal menghapus pendataan: ${
          hapusError?.message || "Terjadi kesalahan."
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await keluarDariAdmin("Logout error")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-8">
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
                Kelola Periode Pendataan Sarana Pendidikan
              </h1>

              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola periode tahun pendataan dan pilih tahun untuk mengelola sekolah.
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
                + Tambah Periode Pendataan
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
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

        {/* SECTION 1: Form Tambah / Edit Pendataan (Tampil Hanya Saat isFormOpen = true) */}
        {isFormOpen && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {editingPendataanId
                  ? "Edit Periode Pendataan"
                  : "Tambah Periode Pendataan"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingPendataanId
                  ? "Ubah data periode pendataan sarana pendidikan Nagari."
                  : "Buat periode tahun pendataan sarana pendidikan Nagari."}
              </p>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={simpanPendataan} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tahun Pendataan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    name="tahun_pendataan"
                    value={formPendataan.tahun_pendataan}
                    onChange={ubahFormPendataan}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Sumber Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sumber_data"
                    value={formPendataan.sumber_data}
                    onChange={ubahFormPendataan}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: Survei Lapangan Pemnag 2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status Publikasi <span className="text-red-500">*</span>
                </label>
                <select
                  name="status_publikasi"
                  value={formPendataan.status_publikasi}
                  onChange={ubahFormPendataan}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                >
                  <option value="draft">Draft (Belum Dipublikasikan)</option>
                  <option value="dipublikasikan">Dipublikasikan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Keterangan <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                </label>
                <textarea
                  name="keterangan"
                  rows={3}
                  value={formPendataan.keterangan}
                  onChange={ubahFormPendataan}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Catatan tambahan mengenai periode pendataan ini..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                />
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
                  ) : editingPendataanId ? (
                    <span>Simpan Perubahan</span>
                  ) : (
                    <span>Tambah Pendataan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 2: Tabel Riwayat Periode Pendataan */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Riwayat Periode Pendataan
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Menampilkan {pendataanList.length} periode pendataan sarana pendidikan Nagari
              </p>
            </div>
          </div>

          {loadingPendataan ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
              <p className="text-sm font-medium">Memuat riwayat pendataan...</p>
            </div>
          ) : pendataanList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-base font-semibold text-gray-700">Belum Ada Periode Pendataan</p>
              <p className="text-xs text-gray-500 mt-1">
                Gunakan tombol &quot;+ Tambah Periode Pendataan&quot; untuk membuat periode pendataan baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold">PERIODE</th>
                    <th scope="col" className="px-6 py-4 font-bold">STATUS PUBLIKASI</th>
                    <th scope="col" className="px-6 py-4 font-bold text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {pendataanList.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        editingPendataanId === item.id ? "bg-[#f0e8db]/30" : ""
                      }`}
                    >
                      <td className="py-4 px-6 font-bold text-gray-900">
                        Tahun {item.tahun_pendataan}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status_publikasi === "dipublikasikan"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {item.status_publikasi === "dipublikasikan"
                            ? "Dipublikasikan"
                            : "Draft"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Tombol 1: Kelola Sarana Sekolah */}
                          <Link
                            href={`/admin/sarana-pendidikan/${item.id}`}
                            className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4] transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>Kelola Sarana Sekolah</span>
                          </Link>

                          {/* Tombol 2: Edit */}
                          <button
                            type="button"
                            onClick={() => mulaiEditPendataan(item)}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                          >
                            Edit
                          </button>

                          {/* Tombol 3: Toggle Aktifkan / Nonaktifkan */}
                          {item.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleToggleActivePendataan(item)}
                              disabled={loading}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                              title="Nonaktifkan periode dari website publik"
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleActivePendataan(item)}
                              disabled={loading}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                              title="Aktifkan periode untuk website publik"
                            >
                              Aktifkan
                            </button>
                          )}

                          {/* Tombol 4: Hapus */}
                          <button
                            type="button"
                            onClick={() => hapusPendataan(item)}
                            disabled={loading}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}