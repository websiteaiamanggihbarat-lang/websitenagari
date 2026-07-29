"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { BUCKET_FOTO_KESEHATAN, PendataanKesehatan } from "@/lib/kesehatan"

const FORM_PENDATAAN_AWAL = {
  tahun_pendataan: new Date().getFullYear().toString(),
  sumber_data: "",
  wc_septic_tanah: "0",
  wc_tanpa_septic: "0",
  mck_sungai: "0",
  status_publikasi: "draft",
  is_active: false,
  keterangan: "",
}

function keAngka(nilai: any): number {
  const angka = Number(nilai)
  return Number.isFinite(angka) ? angka : 0
}

function formatAngka(nilai: any): string {
  return Number(nilai || 0).toLocaleString("id-ID")
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
  const [formPendataan, setFormPendataan] = useState(FORM_PENDATAAN_AWAL)
  const [pendataanList, setPendataanList] = useState<PendataanKesehatan[]>([])
  const [editingPendataanId, setEditingPendataanId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingPendataan, setLoadingPendataan] = useState(true)
  const [error, setError] = useState("")

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

  const fetchPendataan = async () => {
    setLoadingPendataan(true)
    setError("")

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
      setError(fetchError.message || "Gagal memuat periode pendataan kesehatan.")
      setLoadingPendataan(false)
      return
    }

    setPendataanList(data || [])
    setLoadingPendataan(false)
  }

  useEffect(() => {
    fetchPendataan()
  }, [])

  // Auto logout timer (5 menit inactivity)
  useEffect(() => {
    let timeoutId: number

    const logoutOtomatis = async () => {
      await keluarDariAdmin("Auto logout error")
    }

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = window.setTimeout(logoutOtomatis, 5 * 60 * 1000)
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart"]
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [])

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
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    resetFormPendataan()
    setIsFormOpen(false)
  }

  const simpanPendataan = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    const tahun = keAngka(formPendataan.tahun_pendataan)
    const wcSeptic = keAngka(formPendataan.wc_septic_tanah)
    const wcTanpaSeptic = keAngka(formPendataan.wc_tanpa_septic)
    const mckSungai = keAngka(formPendataan.mck_sungai)

    if (tahun < 1900 || tahun > 2100) {
      alert("Tahun pendataan harus berada antara 1900 dan 2100.")
      return
    }

    if (!formPendataan.sumber_data.trim()) {
      alert("Sumber data wajib diisi.")
      return
    }

    if (wcSeptic < 0 || wcTanpaSeptic < 0 || mckSungai < 0) {
      alert("Jumlah angka sanitasi lingkungan tidak boleh kurang dari 0.")
      return
    }

    if (
      formPendataan.status_publikasi !== "draft" &&
      formPendataan.status_publikasi !== "dipublikasikan"
    ) {
      alert("Status publikasi hanya boleh Draft atau Dipublikasikan.")
      return
    }

    if (formPendataan.is_active && formPendataan.status_publikasi === "draft") {
      alert("Periode pendataan berstatus draft tidak boleh dijadikan periode aktif.")
      return
    }

    setLoading(true)
    setError("")

    const session = await periksaSesi()
    if (!session) {
      setLoading(false)
      return
    }

    let previousActiveIds: string[] = []
    let hasDeactivatedPrevious = false

    try {
      // 1. Jika diaktifkan, baca dan simpan ID seluruh periode yang saat ini aktif
      if (formPendataan.is_active) {
        let queryPrevious = supabase
          .from("pendataan_kesehatan")
          .select("id")
          .eq("is_active", true)

        if (editingPendataanId) {
          queryPrevious = queryPrevious.neq("id", editingPendataanId)
        }

        const { data: previousActiveList, error: errFetchPrevious } = await queryPrevious
        if (errFetchPrevious) {
          console.error("Gagal membaca periode aktif sebelumnya:", errFetchPrevious)
        }

        previousActiveIds = (previousActiveList || []).map((p) => p.id)

        // 2. Nonaktifkan periode lama
        if (previousActiveIds.length > 0) {
          const { error: errDeactivate } = await supabase
            .from("pendataan_kesehatan")
            .update({ is_active: false })
            .in("id", previousActiveIds)

          if (errDeactivate) {
            throw new Error(`Gagal menonaktifkan periode aktif lama: ${errDeactivate.message}`)
          }

          hasDeactivatedPrevious = true
        }
      }

      const dataPayload = {
        tahun_pendataan: tahun,
        sumber_data: formPendataan.sumber_data.trim(),
        wc_septic_tanah: wcSeptic,
        wc_tanpa_septic: wcTanpaSeptic,
        mck_sungai: mckSungai,
        status_publikasi: formPendataan.status_publikasi,
        is_active: Boolean(formPendataan.is_active),
        keterangan: formPendataan.keterangan.trim() || null,
      }

      // 3. Jalankan insert atau update periode baru
      if (editingPendataanId) {
        const { error: updateError } = await supabase
          .from("pendataan_kesehatan")
          .update(dataPayload)
          .eq("id", editingPendataanId)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("pendataan_kesehatan")
          .insert([dataPayload])

        if (insertError) throw insertError
      }

      alert(
        editingPendataanId
          ? "Periode pendataan kesehatan berhasil diperbarui!"
          : "Periode pendataan kesehatan berhasil ditambahkan!"
      )

      resetFormPendataan()
      setIsFormOpen(false)
      await fetchPendataan()
    } catch (simpanError: any) {
      console.error("simpan pendataan kesehatan error:", simpanError)

      // 4. Rollback jika insert/update periode baru gagal
      if (hasDeactivatedPrevious && previousActiveIds.length > 0) {
        try {
          const { error: rollbackError } = await supabase
            .from("pendataan_kesehatan")
            .update({ is_active: true })
            .in("id", previousActiveIds)

          if (rollbackError) {
            console.error("Rollback periode aktif gagal:", rollbackError)
            alert(
              `Gagal menyimpan periode pendataan baru (${
                simpanError?.message || "Terjadi kesalahan"
              }), dan GAGAL memulihkan status periode aktif sebelumnya: ${
                rollbackError.message
              }. Silakan periksa status di tabel riwayat pendataan.`
            )
          } else {
            alert(
              `Gagal menyimpan periode pendataan baru: ${
                simpanError?.message || "Terjadi kesalahan"
              }. Status periode aktif sebelumnya telah dipulihkan.`
            )
          }
        } catch (rollbackCatchErr: any) {
          console.error("Rollback exception:", rollbackCatchErr)
          alert(
            `Gagal menyimpan periode pendataan baru (${
              simpanError?.message || "Terjadi kesalahan"
            }), dan GAGAL memulihkan status periode aktif sebelumnya (${
              rollbackCatchErr?.message || "Terjadi kesalahan rollback"
            }). Silakan periksa status di tabel riwayat pendataan.`
          )
        }
      } else {
        if (
          simpanError?.code === "23505" ||
          simpanError?.message?.includes("uq_kes_pendataan_single_active") ||
          simpanError?.message?.includes("idx_pendataan_kesehatan_single_active")
        ) {
          alert(
            "Sudah ada periode pendataan kesehatan lain yang aktif (uq_kes_pendataan_single_active). Nonaktifkan periode aktif tersebut terlebih dahulu."
          )
        } else {
          alert(
            `Gagal menyimpan pendataan kesehatan: ${
              simpanError?.message || "Terjadi kesalahan."
            }`
          )
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const mulaiEditPendataan = (item: PendataanKesehatan) => {
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

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  const hapusPendataan = async (item: PendataanKesehatan) => {
    if (loading) return

    const session = await periksaSesi()
    if (!session) return

    const yakin = window.confirm(
      `Yakin ingin menghapus pendataan kesehatan tahun ${item.tahun_pendataan}?\n\nSeluruh sarana kesehatan pada tahun tersebut juga akan terhapus dari database.`
    )
    if (!yakin) return

    setLoading(true)

    try {
      // 1. Baca seluruh sarana_kesehatan berdasarkan pendataan_id
      const { data: listSarana, error: errFetchSarana } = await supabase
        .from("sarana_kesehatan")
        .select("id, foto_url, storage_path")
        .eq("pendataan_id", item.id)

      if (errFetchSarana) {
        console.error("Gagal membaca daftar sarana kesehatan:", errFetchSarana)
      }

      // 2. Kumpulkan seluruh storage_path / path foto yang tidak kosong
      const listPath: string[] = []
      if (listSarana && listSarana.length > 0) {
        for (const s of listSarana) {
          const path = s.storage_path || ambilPathFotoDariUrl(s.foto_url)
          if (path) {
            listPath.push(path)
          }
        }
      }

      // 3. Hapus seluruh file terkait dari bucket foto-sarana-kesehatan terlebih dahulu
      if (listPath.length > 0) {
        const { error: errDelStorage } = await supabase.storage
          .from(BUCKET_FOTO_KESEHATAN)
          .remove(listPath)

        if (errDelStorage) {
          console.error("Gagal menghapus file Storage:", errDelStorage)
          alert(
            `Gagal menghapus foto dari Storage: ${errDelStorage.message}\n\nPenghapusan pendataan dibatalkan. Record database tidak dihapus.`
          )
          setLoading(false)
          return
        }
      }

      // 4. Baru hapus record pendataan_kesehatan dari database setelah Storage bersih
      const { error: hapusDbError } = await supabase
        .from("pendataan_kesehatan")
        .delete()
        .eq("id", item.id)

      if (hapusDbError) {
        console.error("Gagal menghapus record pendataan dari database:", hapusDbError)
        if (listPath.length > 0) {
          alert(
            `Record pendataan gagal dihapus dari database: ${hapusDbError.message}.\n\nNamun, file foto sarana kesehatan terkait sudah terhapus dari Storage.`
          )
        } else {
          alert(`Gagal menghapus pendataan kesehatan: ${hapusDbError.message}`)
        }
        setLoading(false)
        return
      }

      alert("Periode pendataan kesehatan berhasil dihapus.")

      if (editingPendataanId === item.id) {
        handleBatalForm()
      }

      await fetchPendataan()
    } catch (hapusError: any) {
      console.error("hapus pendataan kesehatan error:", hapusError)
      alert(
        `Gagal menghapus pendataan kesehatan: ${
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
      <div className="bg-[#2c1b01] text-white shadow-md mb-6">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
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
                Kelola Periode Pendataan Kesehatan
              </h1>

              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola periode tahun pendataan, indikator sanitasi lingkungan, dan sarana kesehatan
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
                + Tambah Periode Kesehatan
              </button>
            )}

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

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SECTION 1: Form Tambah / Edit Pendataan (Tampil Hanya Saat isFormOpen = true) */}
        {isFormOpen && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPendataanId
                    ? "Edit Periode Pendataan Kesehatan"
                    : "Tambah Periode Pendataan Kesehatan"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingPendataanId
                    ? "Perbarui periode pendataan dan indikator sanitasi lingkungan."
                    : "Buat periode tahun pendataan dan masukkan indikator sanitasi lingkungan Nagari."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleBatalForm}
                aria-label="Tutup form periode pendataan kesehatan"
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={simpanPendataan} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Tahun Pendataan
                  </label>

                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    name="tahun_pendataan"
                    value={formPendataan.tahun_pendataan}
                    onChange={ubahFormPendataan}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Sumber Data
                  </label>

                  <input
                    type="text"
                    name="sumber_data"
                    value={formPendataan.sumber_data}
                    onChange={ubahFormPendataan}
                    placeholder="Contoh: Pendataan Kader Kesehatan Nagari 2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    required
                  />
                </div>
              </div>

              {/* 3 Angka Sanitasi Lingkungan */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Indikator Sanitasi Lingkungan Masyarakat
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Angka rekapitulasi rumah dan fasilitas sanitasi warga nagari.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      WC dengan Septic Tank
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="wc_septic_tanah"
                      value={formPendataan.wc_septic_tanah}
                      onChange={ubahFormPendataan}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      WC tanpa Septic Tank
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="wc_tanpa_septic"
                      value={formPendataan.wc_tanpa_septic}
                      onChange={ubahFormPendataan}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      MCK di Aliran Sungai
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="mck_sungai"
                      value={formPendataan.mck_sungai}
                      onChange={ubahFormPendataan}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Keterangan
                </label>

                <textarea
                  name="keterangan"
                  rows={3}
                  value={formPendataan.keterangan}
                  onChange={ubahFormPendataan}
                  placeholder="Catatan tambahan mengenai periode pendataan kesehatan ini..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Status Publikasi
                </label>

                <select
                  name="status_publikasi"
                  value={formPendataan.status_publikasi}
                  onChange={ubahFormPendataan}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                >
                  <option value="draft">Draft (Belum Dipublikasikan)</option>
                  <option value="dipublikasikan">Dipublikasikan</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-3 bg-gray-50/50">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formPendataan.is_active}
                  disabled={formPendataan.status_publikasi === "draft"}
                  onChange={ubahFormPendataan}
                  className="h-4 w-4 text-[#2c1b01] rounded"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">
                    Tampilkan sebagai data aktif di website publik
                  </span>
                  {formPendataan.status_publikasi === "draft" && (
                    <span className="text-xs text-amber-600 block">
                      Pendataan berstatus draft tidak dapat dijadikan pendataan aktif.
                    </span>
                  )}
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#2c1b01] hover:bg-[#3a2604] text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading
                    ? "Menyimpan..."
                    : editingPendataanId
                    ? "Simpan Perubahan"
                    : "Tambah Pendataan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 2: Riwayat Pendataan Kesehatan */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Riwayat Periode Pendataan Kesehatan
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pilih periode untuk mengelola daftar sarana, fasilitas, dan tenaga kesehatan
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPendataan}
              disabled={loadingPendataan}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60 cursor-pointer transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingPendataan ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Memuat riwayat pendataan kesehatan...
            </p>
          ) : pendataanList.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Belum ada periode pendataan kesehatan. Gunakan tombol &quot;+ Tambah Periode Kesehatan&quot; untuk membuat data baru.
            </p>
          ) : (
            <div className="space-y-3">
              {pendataanList.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    editingPendataanId === item.id
                      ? "border-[#2c1b01] bg-[#f0e8db]/30 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">
                        Tahun {item.tahun_pendataan}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.status_publikasi === "dipublikasikan"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status_publikasi === "dipublikasikan"
                          ? "Dipublikasikan"
                          : "Draft"}
                      </span>
                      {item.is_active && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Aktif
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600">
                      Sumber: <strong>{item.sumber_data}</strong>
                    </p>

                    {/* 3 Angka Sanitasi Lingkungan */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-700 pt-1">
                      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                        WC Septic: <strong>{formatAngka(item.wc_septic_tanah)}</strong>
                      </span>
                      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                        WC Tanpa Septic: <strong>{formatAngka(item.wc_tanpa_septic)}</strong>
                      </span>
                      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                        MCK Sungai: <strong>{formatAngka(item.mck_sungai)}</strong>
                      </span>
                    </div>

                    {item.keterangan && (
                      <p className="text-xs text-gray-500 pt-0.5">
                        {item.keterangan}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <Link
                      href={`/admin/kesehatan/${item.id}`}
                      className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-[#2c1b01] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3a2604] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Kelola Sarana Kesehatan</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => mulaiEditPendataan(item)}
                      className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-white hover:bg-yellow-600 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => hapusPendataan(item)}
                      disabled={loading}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
