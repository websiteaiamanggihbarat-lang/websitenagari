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
      .from("pendataan_sarana_pendidikan")
      .select("*")
      .order("tahun_pendataan", { ascending: false })
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("fetch pendataan sarana pendidikan error:", fetchError)
      setError(fetchError.message || "Gagal memuat periode pendataan.")
      setLoadingPendataan(false)
      return
    }

    setPendataanList(data || [])
    setLoadingPendataan(false)
  }

  useEffect(() => {
    fetchPendataan()
  }, [])

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
    const { name, value, type, checked } = event.target

    setFormPendataan((formSebelumnya) => {
      const formBaru = {
        ...formSebelumnya,
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

  const simpanPendataan = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const tahun = keAngka(formPendataan.tahun_pendataan)

    if (tahun < 1900 || tahun > 2100) {
      alert("Tahun pendataan harus berada antara 1900 dan 2100.")
      return
    }

    if (!formPendataan.sumber_data.trim()) {
      alert("Sumber data wajib diisi.")
      return
    }

    if (formPendataan.is_active && formPendataan.status_publikasi !== "dipublikasikan") {
      alert("Pendataan aktif harus berstatus Dipublikasikan.")
      return
    }

    setLoading(true)
    setError("")

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
      is_active: Boolean(formPendataan.is_active),
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
      } else {
        const { error: insertError } = await supabase
          .from("pendataan_sarana_pendidikan")
          .insert([dataPendataan])

        if (insertError) {
          throw insertError
        }
      }

      alert(
        editingPendataanId
          ? "Pendataan sarana pendidikan berhasil diperbarui!"
          : "Pendataan sarana pendidikan berhasil ditambahkan!"
      )

      resetFormPendataan()
      await fetchPendataan()
    } catch (simpanError) {
      console.error("simpan pendataan error:", simpanError)

      if (simpanError?.code === "23505") {
        alert(
          "Data pendataan untuk tahun tersebut sudah tersedia. Gunakan tombol Edit pada data yang sudah ada."
        )
      } else {
        alert(
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
    setEditingPendataanId(item.id)

    setFormPendataan({
      tahun_pendataan: item.tahun_pendataan?.toString() || "",
      sumber_data: item.sumber_data || "",
      keterangan: item.keterangan || "",
      status_publikasi: item.status_publikasi || "draft",
      is_active: Boolean(item.is_active),
    })

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
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

      alert("Pendataan sarana pendidikan berhasil dihapus.")

      if (editingPendataanId === item.id) {
        resetFormPendataan()
      }

      await fetchPendataan()
    } catch (hapusError) {
      console.error("hapus pendataan error:", hapusError)

      alert(
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] py-6 sm:py-8">
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto px-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg p-2 transition-colors hover:bg-white/60"
              title="Kembali ke Dashboard Admin"
            >
              <svg
                className="h-6 w-6 text-gray-700"
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
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                Kelola Periode Pendataan Sarana Pendidikan
              </h1>

              <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                Kelola periode tahun pendataan dan pilih tahun untuk mengelola sekolah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#b6a587]" />

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* SECTION 1: Form Tambah / Edit Pendataan (Full Width) */}
      <div className="w-full max-w-5xl mx-auto px-4 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900">
            {editingPendataanId ? "Edit Periode Pendataan" : "Tambah Periode Pendataan"}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Buat atau ubah periode tahun pendataan sarana pendidikan Nagari.
          </p>

          <form onSubmit={simpanPendataan} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tahun Pendataan
              </label>

              <input
                type="number"
                min="1900"
                max="2100"
                name="tahun_pendataan"
                value={formPendataan.tahun_pendataan}
                onChange={ubahFormPendataan}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sumber Data
              </label>

              <input
                type="text"
                name="sumber_data"
                value={formPendataan.sumber_data}
                onChange={ubahFormPendataan}
                placeholder="Contoh: Survei Lapangan Pemnag 2026"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Keterangan
              </label>

              <textarea
                name="keterangan"
                rows={3}
                value={formPendataan.keterangan}
                onChange={ubahFormPendataan}
                placeholder="Catatan tambahan mengenai periode pendataan ini..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Publikasi
              </label>

              <select
                name="status_publikasi"
                value={formPendataan.status_publikasi}
                onChange={ubahFormPendataan}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
              >
                <option value="draft">Draft (Belum Dipublikasikan)</option>
                <option value="dipublikasikan">Dipublikasikan</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formPendataan.is_active}
                disabled={formPendataan.status_publikasi === "draft"}
                onChange={ubahFormPendataan}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">
                  Tampilkan sebagai data aktif di website publik
                </span>
                {formPendataan.status_publikasi === "draft" && (
                  <span className="text-xs text-amber-600 block">
                    Pendataan berstatus draft tidak dapat dijadikan pendataan aktif.
                  </span>
                )}
              </div>
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] flex-1 rounded-lg bg-[#2c1b01] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2604] disabled:opacity-60"
              >
                {loading
                  ? "Menyimpan..."
                  : editingPendataanId
                  ? "Simpan Perubahan Pendataan"
                  : "Tambah Pendataan"}
              </button>

              {editingPendataanId && (
                <button
                  type="button"
                  onClick={resetFormPendataan}
                  className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 2: Riwayat Pendataan (Full Width) */}
      <div className="w-full max-w-5xl mx-auto px-4 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Riwayat Periode Pendataan
              </h2>
              <p className="text-xs text-gray-500">
                Pilih periode untuk mengelola daftar sekolah, fasilitas, dan kegiatan
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPendataan}
              disabled={loadingPendataan}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          {loadingPendataan ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Memuat riwayat pendataan...
            </p>
          ) : pendataanList.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Belum ada periode pendataan. Silakan buat periode pendataan baru di atas.
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
                  <div className="space-y-1">
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

                    {item.keterangan && (
                      <p className="text-xs text-gray-500">
                        {item.keterangan}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <Link
                      href={`/admin/sarana-pendidikan/${item.id}`}
                      className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-[#2c1b01] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3a2604] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Kelola Sarana Sekolah</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => mulaiEditPendataan(item)}
                      className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-white hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => hapusPendataan(item)}
                      disabled={loading}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
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