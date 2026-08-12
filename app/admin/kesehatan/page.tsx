"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { BUCKET_FOTO_KESEHATAN, PendataanKesehatan } from "@/lib/kesehatan"
import ConfirmModal from "@/components/ui/ConfirmModal"

const FORM_PENDATAAN_AWAL = {
  tahun_pendataan: new Date().getFullYear().toString(),
  sumber_data: "",
  wc_septic_tanah: "",
  wc_tanpa_septic: "",
  mck_sungai: "",
  status_publikasi: "draft",
  is_active: false,
  keterangan: "",
}

function keAngka(nilai: unknown): number {
  const angka = Number(nilai)
  return Number.isFinite(angka) ? angka : 0
}

function ambilPathFotoDariUrl(fotoUrl: string | null | undefined): string | null {
  if (!fotoUrl) return null
  const penanda = `/storage/v1/object/public/${BUCKET_FOTO_KESEHATAN}/`
  const posisi = fotoUrl.indexOf(penanda)
  if (posisi === -1) return null
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

export default function KesehatanAdminIndex() {
  const formRef = useRef<HTMLDivElement | null>(null)

  const [formPendataan, setFormPendataan] = useState(FORM_PENDATAAN_AWAL)
  const [pendataanList, setPendataanList] = useState<PendataanKesehatan[]>([])
  const [editingPendataanId, setEditingPendataanId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingPendataan, setLoadingPendataan] = useState(true)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PendataanKesehatan | null>(null)

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

    const session = await periksaSesi()
    if (!session) {
      setLoadingPendataan(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("pendataan_kesehatan")
      .select("*")
      .order("tahun_pendataan", { ascending: false })
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("fetch pendataan kesehatan error:", fetchError)
      setPesanError(fetchError.message || "Gagal memuat periode pendataan kesehatan.")
      setLoadingPendataan(false)
      return
    }

    setPendataanList(data || [])
    setLoadingPendataan(false)
  }

  useEffect(() => {
    fetchPendataan()
  }, [])

  // Auto dismiss success toast message after 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  const ubahFormPendataan = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target
    const checked = (event.target as HTMLInputElement).checked

    setFormPendataan((prev) => {
      const formBaru = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }

      if (name === "status_publikasi" && value === "draft") {
        formBaru.is_active = false
      }

      return formBaru
    })
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

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleBatalForm = () => {
    resetFormPendataan()
    setIsFormOpen(false)
  }

  const simpanPendataan = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    setPesanSukses(null)
    setPesanError(null)

    const tahun = keAngka(formPendataan.tahun_pendataan)
    const wcSeptic = keAngka(formPendataan.wc_septic_tanah)
    const wcTanpaSeptic = keAngka(formPendataan.wc_tanpa_septic)
    const mckSungai = keAngka(formPendataan.mck_sungai)

    if (tahun < 1900 || tahun > 2100) {
      setPesanError("Tahun pendataan harus berada antara 1900 dan 2100.")
      return
    }

    if (!formPendataan.sumber_data.trim()) {
      setPesanError("Sumber data wajib diisi.")
      return
    }

    if (wcSeptic < 0 || wcTanpaSeptic < 0 || mckSungai < 0) {
      setPesanError("Jumlah angka sanitasi lingkungan tidak boleh kurang dari 0.")
      return
    }

    if (
      formPendataan.status_publikasi !== "draft" &&
      formPendataan.status_publikasi !== "dipublikasikan"
    ) {
      setPesanError("Status publikasi hanya boleh Draft atau Dipublikasikan.")
      return
    }

    setLoading(true)

    const session = await periksaSesi()
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const dataPayload = {
        tahun_pendataan: tahun,
        sumber_data: formPendataan.sumber_data.trim(),
        wc_septic_tanah: wcSeptic,
        wc_tanpa_septic: wcTanpaSeptic,
        mck_sungai: mckSungai,
        status_publikasi: formPendataan.status_publikasi,
        is_active: formPendataan.status_publikasi === "draft" ? false : Boolean(formPendataan.is_active),
        keterangan: formPendataan.keterangan.trim() || null,
      }

      if (editingPendataanId) {
        const { error: updateError } = await supabase
          .from("pendataan_kesehatan")
          .update(dataPayload)
          .eq("id", editingPendataanId)

        if (updateError) throw updateError
        setPesanSukses("Periode pendataan kesehatan berhasil diperbarui.")
      } else {
        const { error: insertError } = await supabase
          .from("pendataan_kesehatan")
          .insert([dataPayload])

        if (insertError) throw insertError
        setPesanSukses("Periode pendataan kesehatan berhasil ditambahkan.")
      }

      handleBatalForm()
      await fetchPendataan()
    } catch (simpanError: unknown) {
      console.error("simpan pendataan kesehatan error:", simpanError)
      const err = simpanError as { code?: string; message?: string }

      if (err?.code === "23505") {
        setPesanError("Data pendataan untuk tahun tersebut sudah ada.")
      } else {
        setPesanError(`Gagal menyimpan periode pendataan: ${err?.message || "Terjadi kesalahan."}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const mulaiEditPendataan = (item: PendataanKesehatan) => {
    setPesanSukses(null)
    setPesanError(null)

    setEditingPendataanId(item.id)
    setFormPendataan({
      tahun_pendataan: item.tahun_pendataan?.toString() || "",
      sumber_data: item.sumber_data || "",
      wc_septic_tanah: (item.wc_septic_tanah ?? 0).toString(),
      wc_tanpa_septic: (item.wc_tanpa_septic ?? 0).toString(),
      mck_sungai: (item.mck_sungai ?? 0).toString(),
      status_publikasi: item.status_publikasi || "draft",
      is_active: Boolean(item.is_active),
      keterangan: item.keterangan || "",
    })

    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleToggleActive = async (item: PendataanKesehatan) => {
    if (loading) return

    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      const statusBaru = !item.is_active
      const { error: errToggle } = await supabase
        .from("pendataan_kesehatan")
        .update({ is_active: statusBaru })
        .eq("id", item.id)

      if (errToggle) {
        setPesanError(`Gagal mengubah status aktif periode: ${errToggle.message}`)
      } else {
        setPesanSukses(
          statusBaru
            ? `Periode pendataan kesehatan tahun ${item.tahun_pendataan} berhasil diaktifkan.`
            : `Periode pendataan kesehatan tahun ${item.tahun_pendataan} berhasil dinonaktifkan.`
        )
      }

      await fetchPendataan()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat mengubah status periode: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const hapusPendataan = (item: PendataanKesehatan) => {
    if (loading) return
    setDeleteTarget(item)
  }

  const executeHapusPendataan = async (item: PendataanKesehatan) => {
    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      // 1. Ambil daftar sarana untuk hapus foto di Storage
      const { data: saranaList, error: errSarana } = await supabase
        .from("sarana_kesehatan")
        .select("id, storage_path, foto_url")
        .eq("pendataan_id", item.id)

      if (errSarana) {
        console.error("Gagal membaca sarana kesehatan untuk cleanup:", errSarana)
      }

      const saranaIds = (saranaList || []).map((s) => s.id)

      // 2. Hapus rincian anak
      if (saranaIds.length > 0) {
        await supabase.from("fasilitas_sarana_kesehatan").delete().in("sarana_kesehatan_id", saranaIds)
        await supabase.from("tenaga_kesehatan_sarana").delete().in("sarana_kesehatan_id", saranaIds)
        await supabase.from("indikator_tambahan_kesehatan").delete().in("sarana_kesehatan_id", saranaIds)
      }

      // 3. Hapus foto Storage
      const listStoragePaths: string[] = []
      ;(saranaList || []).forEach((s) => {
        const pathFoto = s.storage_path || ambilPathFotoDariUrl(s.foto_url)
        if (pathFoto) listStoragePaths.push(pathFoto)
      })

      if (listStoragePaths.length > 0) {
        await supabase.storage.from(BUCKET_FOTO_KESEHATAN).remove(listStoragePaths)
      }

      // 4. Hapus sarana kesehatan
      await supabase.from("sarana_kesehatan").delete().eq("pendataan_id", item.id)

      // 5. Hapus record pendataan utama
      const { error: hapusError } = await supabase
        .from("pendataan_kesehatan")
        .delete()
        .eq("id", item.id)

      if (hapusError) {
        const msg = `Gagal menghapus periode pendataan: ${hapusError.message}`
        setPesanError(msg)
      } else {
        const msg = `Periode pendataan kesehatan tahun ${item.tahun_pendataan} berhasil dihapus.`
        setPesanSukses(msg)
      }

      if (editingPendataanId === item.id) {
        handleBatalForm()
      }

      await fetchPendataan()
    } catch (hapusErr: unknown) {
      console.error("hapus pendataan error:", hapusErr)
      const err = hapusErr as { message?: string }
      const msg = `Gagal menghapus periode pendataan: ${err?.message || "Terjadi kesalahan."}`
      setPesanError(msg)
    } finally {
      setLoading(false)
    }
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
                  Kelola Kesehatan
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Kesehatan Warga
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola periode tahun pendataan, indikator sanitasi &amp; posyandu Nagari Aia Manggih Barat.
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
                <span>Tambah Periode Kesehatan</span>
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
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{pesanError}</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: Form Tambah / Edit Pendataan (Krem Header, Body Putih) */}
        {isFormOpen && (
          <div ref={formRef} id="form-kesehatan-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {editingPendataanId
                  ? "Edit Periode Pendataan Kesehatan"
                  : "Tambah Periode Pendataan Kesehatan"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingPendataanId
                  ? "Ubah data periode pendataan kesehatan Nagari."
                  : "Buat periode tahun pendataan dan masukkan indikator sanitasi lingkungan Nagari."}
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
                    placeholder="Contoh: Pendataan Kader Kesehatan Nagari 2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    required
                  />
                </div>
              </div>

              {/* Subsection: 3 Angka Sanitasi Lingkungan */}
              <div className="rounded-xl border border-gray-200 bg-[#f7f2e8]/40 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-[#2c1b01]">
                    Indikator Sanitasi Lingkungan Masyarakat
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Angka rekapitulasi rumah dan fasilitas sanitasi warga nagari.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      WC dengan Septic Tank
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="wc_septic_tanah"
                      value={formPendataan.wc_septic_tanah}
                      onChange={ubahFormPendataan}
                      onFocus={(e) => e.currentTarget.select()}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      WC tanpa Septic Tank
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="wc_tanpa_septic"
                      value={formPendataan.wc_tanpa_septic}
                      onChange={ubahFormPendataan}
                      onFocus={(e) => e.currentTarget.select()}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      MCK di Aliran Sungai
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="mck_sungai"
                      value={formPendataan.mck_sungai}
                      onChange={ubahFormPendataan}
                      onFocus={(e) => e.currentTarget.select()}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Keterangan */}
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
                  placeholder="Catatan tambahan mengenai periode pendataan kesehatan ini..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                />
              </div>

              {/* Status Publikasi */}
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

              {/* Footer Buttons (Single Batal Button) */}
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

        {/* SECTION 2: Tabel Riwayat Periode Pendataan Kesehatan (Section Header + Tabel) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Section Header Putih (Konsisten dengan Admin Sarana Pendidikan) */}
          <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Riwayat Periode Pendataan Kesehatan
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Menampilkan seluruh periode pendataan kesehatan Nagari.
              </p>
            </div>
          </div>

          {loadingPendataan ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
              <p className="text-sm font-medium">Memuat riwayat pendataan kesehatan...</p>
            </div>
          ) : pendataanList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-base font-semibold text-gray-700">Belum Ada Periode Pendataan Kesehatan</p>
              <p className="text-xs text-gray-500 mt-1">
                Gunakan tombol &quot;Tambah Periode Kesehatan&quot; untuk mendaftarkan periode pendataan baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold w-[30%]">Periode</th>
                    <th scope="col" className="px-6 py-4 font-bold w-[20%]">Status Publikasi</th>
                    <th scope="col" className="px-6 py-4 font-bold text-right w-[50%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {pendataanList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900 text-base">
                        Tahun {item.tahun_pendataan}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                            item.status_publikasi === "dipublikasikan"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status_publikasi === "dipublikasikan" ? "bg-blue-600" : "bg-gray-400"
                            }`}
                          ></span>
                          {item.status_publikasi === "dipublikasikan" ? "Dipublikasikan" : "Draft"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          {/* Tombol 1: Kelola Sarana Kesehatan */}
                          <Link
                            href={`/admin/kesehatan/${item.id}`}
                            className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4] cursor-pointer whitespace-nowrap flex-shrink-0"
                            title="Kelola sarana, fasilitas & tenaga kesehatan"
                          >
                            Kelola Sarana Kesehatan
                          </Link>

                          {/* Tombol 2: Edit */}
                          <button
                            type="button"
                            onClick={() => mulaiEditPendataan(item)}
                            disabled={loading}
                            className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                          >
                            Edit
                          </button>

                          {/* Tombol 3: Toggle Aktifkan / Nonaktifkan */}
                          {item.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              disabled={loading}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                              title="Nonaktifkan periode pendataan dari website publik"
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              disabled={loading}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                              title="Aktifkan periode pendataan untuk website publik"
                            >
                              Aktifkan
                            </button>
                          )}

                          {/* Tombol 4: Hapus */}
                          <button
                            type="button"
                            onClick={() => hapusPendataan(item)}
                            disabled={loading}
                            className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Periode Pendataan Kesehatan?"
        message={
          <>
            Apakah Anda yakin ingin menghapus periode pendataan tahun <strong>{deleteTarget?.tahun_pendataan}</strong>?
            <br />
            Seluruh data sarana, fasilitas, dan tenaga kesehatan terkait pada tahun tersebut akan terhapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={loading}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeHapusPendataan(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
