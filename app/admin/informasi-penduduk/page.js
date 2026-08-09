"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const FORM_AWAL = {
  tanggal_data: "",
  sumber_data: "",
  jumlah_penduduk: "",
  jumlah_laki_laki: "",
  jumlah_perempuan: "",
  jumlah_kk: "",
  keterangan: "",
  status_publikasi: "draft",
  is_active: true,
}

const KELOMPOK_USIA_AWAL = [
  {
    nama_kelompok: "Anak-anak",
    rentang_usia: "0–14 tahun",
    jumlah: "",
    urutan: 1,
  },
  {
    nama_kelompok: "Usia produktif",
    rentang_usia: "15–64 tahun",
    jumlah: "",
    urutan: 2,
  },
  {
    nama_kelompok: "Lansia",
    rentang_usia: "65 tahun ke atas",
    jumlah: "",
    urutan: 3,
  },
]

function keAngka(nilai) {
  const angka = Number(nilai)
  return Number.isFinite(angka) ? angka : 0
}

function formatAngka(nilai) {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function formatTanggal(nilai) {
  if (!nilai) {
    return "-"
  }

  return new Date(`${nilai}T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  )
}

function ambilJumlahKelompok(item, namaKelompok) {
  const kelompok = (item?.kelompok_usia || []).find(
    (data) => data.nama_kelompok === namaKelompok
  )

  return keAngka(kelompok?.jumlah)
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

export default function InformasiPendudukAdmin() {
  const [form, setForm] = useState(FORM_AWAL)
  const [kelompokUsia, setKelompokUsia] = useState(KELOMPOK_USIA_AWAL)
  const [dataPendudukList, setDataPendudukList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [pesanSukses, setPesanSukses] = useState(null)
  const [processingToggleId, setProcessingToggleId] = useState(null)

  const [jenisFilter, setJenisFilter] = useState("terbaru")
  const [filterHari, setFilterHari] = useState("")
  const [filterBulan, setFilterBulan] = useState("")
  const [filterTahun, setFilterTahun] = useState("")
  const [filterTanggalMulai, setFilterTanggalMulai] = useState("")
  const [filterTanggalSelesai, setFilterTanggalSelesai] = useState("")

  // Auto dismiss pesanSukses setelah 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timer = setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [pesanSukses])

  const totalKelompokUsia = useMemo(() => {
    return kelompokUsia.reduce(
      (total, kelompok) => total + keAngka(kelompok.jumlah),
      0
    )
  }, [kelompokUsia])

  const totalJenisKelamin = useMemo(() => {
    return (
      keAngka(form.jumlah_laki_laki) +
      keAngka(form.jumlah_perempuan)
    )
  }, [form.jumlah_laki_laki, form.jumlah_perempuan])

  const hasilFilter = useMemo(() => {
    const dataTerurut = [...dataPendudukList].sort((dataA, dataB) => {
      const cmpTanggal = String(dataB.tanggal_data || "").localeCompare(
        String(dataA.tanggal_data || "")
      )
      if (cmpTanggal !== 0) return cmpTanggal
      return String(dataB.created_at || "").localeCompare(
        String(dataA.created_at || "")
      )
    })

    if (jenisFilter === "terbaru" || jenisFilter === "semua") {
      return dataTerurut
    }

    if (jenisFilter === "hari") {
      if (!filterHari) return dataTerurut
      return dataTerurut.filter((item) => item.tanggal_data === filterHari)
    }

    if (jenisFilter === "bulan") {
      if (!filterBulan) return dataTerurut
      return dataTerurut.filter((item) =>
        String(item.tanggal_data || "").startsWith(filterBulan)
      )
    }

    if (jenisFilter === "tahun") {
      if (!filterTahun) return dataTerurut
      return dataTerurut.filter((item) =>
        String(item.tanggal_data || "").startsWith(`${filterTahun}-`)
      )
    }

    if (jenisFilter === "rentang") {
      if (!filterTanggalMulai || !filterTanggalSelesai) return dataTerurut
      return dataTerurut.filter((item) => {
        const tanggal = String(item.tanggal_data || "")
        return (
          tanggal >= filterTanggalMulai && tanggal <= filterTanggalSelesai
        )
      })
    }

    return dataTerurut
  }, [
    dataPendudukList,
    jenisFilter,
    filterHari,
    filterBulan,
    filterTahun,
    filterTanggalMulai,
    filterTanggalSelesai,
  ])

  const periksaSesi = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      alert("Sesi admin tidak terbaca. Silakan login ulang.")
      window.location.href = "/login"
      return false
    }

    return session
  }

  const fetchDataPenduduk = async () => {
    setLoadingData(true)
    setError("")

    const session = await periksaSesi()
    if (!session) {
      setLoadingData(false)
      return
    }

    const { data: dataUtama, error: dataUtamaError } = await supabase
      .from("informasi_penduduk")
      .select("*")
      .order("tanggal_data", { ascending: false })
      .order("created_at", { ascending: false })

    if (dataUtamaError) {
      console.error("fetch informasi_penduduk error:", dataUtamaError)
      setError(dataUtamaError.message || "Gagal memuat informasi penduduk.")
      setLoadingData(false)
      return
    }

    const daftarId = (dataUtama || []).map((item) => item.id)
    let dataKelompok = []

    if (daftarId.length > 0) {
      const { data, error: kelompokError } = await supabase
        .from("kelompok_usia_penduduk")
        .select("*")
        .in("informasi_penduduk_id", daftarId)
        .order("urutan", { ascending: true })

      if (kelompokError) {
        console.error("fetch kelompok_usia_penduduk error:", kelompokError)
        setError(kelompokError.message || "Gagal memuat kelompok usia.")
        setLoadingData(false)
        return
      }

      dataKelompok = data || []
    }

    const hasilGabungan = (dataUtama || []).map((item) => ({
      ...item,
      kelompok_usia: dataKelompok
        .filter((kelompok) => kelompok.informasi_penduduk_id === item.id)
        .sort((kelompokA, kelompokB) => kelompokA.urutan - kelompokB.urutan),
    }))

    setDataPendudukList(hasilGabungan)
    setLoadingData(false)
  }

  useEffect(() => {
    fetchDataPenduduk()
  }, [])

  // Auto Logout 5 menit
  useEffect(() => {
    let timeoutId
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

  const ubahForm = (event) => {
    const { name, value, type, checked } = event.target
    setForm((formSebelumnya) => ({
      ...formSebelumnya,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const ubahJumlahKelompok = (index, nilai) => {
    setKelompokUsia((kelompokSebelumnya) =>
      kelompokSebelumnya.map((kelompok, posisi) =>
        posisi === index ? { ...kelompok, jumlah: nilai } : kelompok
      )
    )
  }

  const resetForm = () => {
    setForm({ ...FORM_AWAL })
    setKelompokUsia(KELOMPOK_USIA_AWAL.map((kelompok) => ({ ...kelompok })))
    setEditingId(null)
  }

  const handleOpenTambah = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    resetForm()
    setIsFormOpen(false)
  }

  const handleQuickToggleActive = async (item) => {
    if (loading || processingToggleId) return
    const session = await periksaSesi()
    if (!session) return

    const newActiveState = !item.is_active

    setPesanSukses(null)
    setError("")
    setProcessingToggleId(item.id)

    try {
      const { error: toggleError } = await supabase
        .from("informasi_penduduk")
        .update({ is_active: newActiveState })
        .eq("id", item.id)

      if (toggleError) {
        throw toggleError
      }

      setPesanSukses(
        newActiveState
          ? "Data penduduk berhasil diaktifkan."
          : "Data penduduk berhasil dinonaktifkan."
      )

      await fetchDataPenduduk()
    } catch (toggleErr) {
      console.error("handleQuickToggleActive error:", toggleErr)
      setError(toggleErr?.message || "Gagal mengubah status aktif data penduduk.")
    } finally {
      setProcessingToggleId(null)
    }
  }

  const simpanDataPenduduk = async (event) => {
    event.preventDefault()
    if (loading) return

    const jumlahPenduduk = keAngka(form.jumlah_penduduk)
    const jumlahLakiLaki = keAngka(form.jumlah_laki_laki)
    const jumlahPerempuan = keAngka(form.jumlah_perempuan)
    const jumlahKK = keAngka(form.jumlah_kk)

    if (!form.tanggal_data) {
      setError("Tanggal data wajib diisi.")
      return
    }

    if (!form.sumber_data.trim()) {
      setError("Sumber data wajib diisi.")
      return
    }

    if (jumlahPenduduk <= 0) {
      setError("Jumlah penduduk harus lebih dari nol.")
      return
    }

    if (jumlahLakiLaki + jumlahPerempuan !== jumlahPenduduk) {
      setError("Jumlah laki-laki dan perempuan harus sama dengan jumlah penduduk.")
      return
    }

    if (totalKelompokUsia !== jumlahPenduduk) {
      setError("Total Anak-anak, Usia produktif, dan Lansia harus sama dengan jumlah penduduk.")
      return
    }

    if (jumlahKK < 0) {
      setError("Jumlah kepala keluarga tidak boleh kurang dari nol.")
      return
    }

    setLoading(true)
    setError("")
    setPesanSukses(null)

    const session = await periksaSesi()
    if (!session) {
      setLoading(false)
      return
    }

    // Preserve is_active if editing, or default true if new create
    const targetIsActive = editingId
      ? (dataPendudukList.find((d) => d.id === editingId)?.is_active ?? true)
      : true

    const dataUtama = {
      tanggal_data: form.tanggal_data,
      sumber_data: form.sumber_data.trim(),
      jumlah_penduduk: jumlahPenduduk,
      jumlah_laki_laki: jumlahLakiLaki,
      jumlah_perempuan: jumlahPerempuan,
      jumlah_kk: jumlahKK,
      keterangan: form.keterangan.trim() || null,
      status_publikasi: form.status_publikasi,
      is_active: targetIsActive,
    }

    let informasiPendudukId = editingId
    const sedangMenambah = !editingId

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("informasi_penduduk")
          .update(dataUtama)
          .eq("id", editingId)

        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from("informasi_penduduk")
          .insert(dataUtama)
          .select("id")
          .single()

        if (insertError) throw insertError
        informasiPendudukId = data.id
      }

      // Upsert Kelompok Usia
      for (const kelompok of kelompokUsia) {
        const dataKelompok = {
          informasi_penduduk_id: informasiPendudukId,
          nama_kelompok: kelompok.nama_kelompok,
          rentang_usia: kelompok.rentang_usia,
          jumlah: keAngka(kelompok.jumlah),
          urutan: kelompok.urutan,
        }

        const { error: upsertKelompokError } = await supabase
          .from("kelompok_usia_penduduk")
          .upsert(dataKelompok, {
            onConflict: "informasi_penduduk_id,nama_kelompok",
          })

        if (upsertKelompokError) throw upsertKelompokError
      }

      setPesanSukses(
        sedangMenambah
          ? "Data penduduk berhasil ditambahkan."
          : "Data penduduk berhasil diperbarui."
      )

      handleBatalForm()
      await fetchDataPenduduk()
    } catch (err) {
      console.error("simpanDataPenduduk error:", err)
      setError(err?.message || "Gagal menyimpan data penduduk.")
    } finally {
      setLoading(false)
    }
  }

  const mulaiEdit = (item) => {
    setEditingId(item.id)
    setForm({
      tanggal_data: item.tanggal_data || "",
      sumber_data: item.sumber_data || "",
      jumlah_penduduk: item.jumlah_penduduk?.toString() || "",
      jumlah_laki_laki: item.jumlah_laki_laki?.toString() || "",
      jumlah_perempuan: item.jumlah_perempuan?.toString() || "",
      jumlah_kk: item.jumlah_kk?.toString() || "",
      keterangan: item.keterangan || "",
      status_publikasi: item.status_publikasi || "draft",
      is_active: Boolean(item.is_active),
    })

    setKelompokUsia(
      KELOMPOK_USIA_AWAL.map((kelompokDefault) => {
        const kelompokTersimpan = (item.kelompok_usia || []).find(
          (kelompok) => kelompok.nama_kelompok === kelompokDefault.nama_kelompok
        )
        return {
          ...kelompokDefault,
          jumlah: kelompokTersimpan?.jumlah?.toString() || "",
        }
      })
    )

    setIsFormOpen(true)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const hapusData = async (item) => {
    const session = await periksaSesi()
    if (!session) return

    const tambahanPeringatan = item.is_active
      ? "\n\nData ini sedang aktif di Beranda."
      : ""

    const yakin = window.confirm(
      `Yakin ingin menghapus informasi penduduk tanggal ${formatTanggal(
        item.tanggal_data
      )}?${tambahanPeringatan}`
    )

    if (!yakin) return

    setLoading(true)
    setError("")
    setPesanSukses(null)

    try {
      const { error: hapusError } = await supabase
        .from("informasi_penduduk")
        .delete()
        .eq("id", item.id)

      if (hapusError) throw hapusError

      setPesanSukses("Informasi penduduk berhasil dihapus.")
      if (editingId === item.id) {
        handleBatalForm()
      }
      await fetchDataPenduduk()
    } catch (err) {
      console.error("hapusData error:", err)
      setError(err?.message || "Gagal menghapus data.")
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
      {/* Top Header Navigation (Cokelat Tua Solid) */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-6">
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
                Kelola Informasi Penduduk
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola data penduduk berdasarkan tanggal pencatatan
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
                <span>Tambah Data Penduduk</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Global Toast Sukses */}
        {pesanSukses && (
          <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl font-semibold shadow-xs">
            {pesanSukses}
          </div>
        )}

        {/* Global Toast Error */}
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl font-semibold shadow-xs">
            {error}
          </div>
        )}

        {/* FORM DATA PENDUDUK (Tampil Saat isFormOpen = true) */}
        {isFormOpen && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2c1b01]">
                  {editingId ? "Edit Data Penduduk" : "Tambah Data Penduduk Baru"}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Lengkapi data kependudukan Nagari Aia Manggih Barat.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBatalForm}
                disabled={loading}
                aria-label="Tutup form data penduduk"
                className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none disabled:opacity-50 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={simpanDataPenduduk} className="p-6 space-y-6">
              {/* Baris Pertama: Tanggal & Sumber Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tanggal Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggal_data"
                    value={form.tanggal_data}
                    onChange={ubahForm}
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
                    placeholder="Contoh: Data Sensus Nagari"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    value={form.sumber_data}
                    onChange={ubahForm}
                    onFocus={(e) => e.currentTarget.select()}
                    required
                  />
                </div>
              </div>

              {/* Baris Kedua: Statistik Penduduk (4 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jumlah Penduduk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="jumlah_penduduk"
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    value={form.jumlah_penduduk}
                    onChange={ubahForm}
                    onFocus={(e) => e.currentTarget.select()}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jumlah KK <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="jumlah_kk"
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    value={form.jumlah_kk}
                    onChange={ubahForm}
                    onFocus={(e) => e.currentTarget.select()}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Laki-laki <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="jumlah_laki_laki"
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    value={form.jumlah_laki_laki}
                    onChange={ubahForm}
                    onFocus={(e) => e.currentTarget.select()}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Perempuan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="jumlah_perempuan"
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    value={form.jumlah_perempuan}
                    onChange={ubahForm}
                    onFocus={(e) => e.currentTarget.select()}
                    required
                  />
                </div>
              </div>

              {/* Panel Validasi Jenis Kelamin */}
              <div
                className={`rounded-xl border p-4 text-xs font-semibold ${
                  form.jumlah_penduduk &&
                  totalJenisKelamin !== keAngka(form.jumlah_penduduk)
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                Total laki-laki + perempuan:{" "}
                <strong>{formatAngka(totalJenisKelamin)}</strong>
              </div>

              {/* Kelompok Usia */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Kelompok Usia
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Total kelompok usia harus sama dengan jumlah penduduk.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {kelompokUsia.map((kelompok, index) => (
                    <div
                      key={kelompok.nama_kelompok}
                      className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {kelompok.nama_kelompok}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {kelompok.rentang_usia}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={kelompok.jumlah}
                          onChange={(event) =>
                            ubahJumlahKelompok(index, event.target.value)
                          }
                          onFocus={(e) => e.currentTarget.select()}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Panel Validasi Kelompok Usia */}
                <div
                  className={`mt-4 rounded-xl border p-4 text-xs font-semibold ${
                    form.jumlah_penduduk &&
                    totalKelompokUsia !== keAngka(form.jumlah_penduduk)
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  Total kelompok usia:{" "}
                  <strong>{formatAngka(totalKelompokUsia)}</strong>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  rows={3}
                  placeholder="Tambahkan keterangan bila diperlukan..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                  value={form.keterangan}
                  onChange={ubahForm}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>

              {/* Status Publikasi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status Publikasi
                </label>
                <select
                  name="status_publikasi"
                  value={form.status_publikasi}
                  onChange={ubahForm}
                  className="w-full sm:w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="dipublikasikan">Dipublikasikan</option>
                </select>
              </div>

              {/* Action Buttons (Batal & Simpan Cokelat Tua) */}
              <div className="pt-4 border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RIWAYAT INFORMASI PENDUDUK */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Section Header dengan Filter Compact */}
          <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Riwayat Informasi Penduduk
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Menampilkan seluruh riwayat data informasi penduduk Nagari.
              </p>
            </div>

            {/* Filter Compact Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                TAMPILKAN:
              </label>
              <select
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white shadow-xs focus:border-[#6b4b1d] focus:outline-none cursor-pointer"
              >
                <option value="terbaru">Data Terbaru</option>
                <option value="semua">Semua Riwayat</option>
                <option value="hari">Per Hari</option>
                <option value="bulan">Per Bulan</option>
                <option value="tahun">Per Tahun</option>
                <option value="rentang">Rentang Tanggal</option>
              </select>

              {jenisFilter === "hari" && (
                <input
                  type="date"
                  value={filterHari}
                  onChange={(e) => setFilterHari(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 bg-white"
                />
              )}

              {jenisFilter === "bulan" && (
                <input
                  type="month"
                  value={filterBulan}
                  onChange={(e) => setFilterBulan(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 bg-white"
                />
              )}

              {jenisFilter === "tahun" && (
                <input
                  type="number"
                  placeholder="Tahun"
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 bg-white"
                />
              )}

              {jenisFilter === "rentang" && (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={filterTanggalMulai}
                    onChange={(e) => setFilterTanggalMulai(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 bg-white"
                  />
                  <span className="text-xs text-gray-500">-</span>
                  <input
                    type="date"
                    value={filterTanggalSelesai}
                    onChange={(e) => setFilterTanggalSelesai(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loadingData ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <svg className="animate-spin w-8 h-8 text-amber-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm">Memuat data informasi penduduk...</p>
            </div>
          ) : hasilFilter.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-3 text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-semibold text-gray-700">Belum ada riwayat data informasi penduduk yang ditemukan.</p>
            </div>
          ) : (
            /* Tabel Riwayat Data */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01] border-b border-gray-200 font-bold">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left whitespace-nowrap">
                      TANGGAL
                    </th>
                    <th scope="col" className="px-4 py-4 text-left">
                      SUMBER
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      PENDUDUK
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      LAKI-LAKI
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      PEREMPUAN
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      KK
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      ANAK
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      PRODUKTIF
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      LANSIA
                    </th>
                    <th scope="col" className="px-4 py-4 text-center whitespace-nowrap">
                      STATUS PUBLIKASI
                    </th>
                    <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {hasilFilter.map((item) => {
                    const anakAnak = ambilJumlahKelompok(item, "Anak-anak")
                    const usiaProduktif = ambilJumlahKelompok(item, "Usia produktif")
                    const lansia = ambilJumlahKelompok(item, "Lansia")
                    const isToggleLoading = processingToggleId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 align-middle">
                          {formatTanggal(item.tanggal_data)}
                        </td>
                        <td className="px-4 py-4 text-gray-700 align-middle">
                          <p className="truncate max-w-xs">{item.sumber_data}</p>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900 whitespace-nowrap align-middle">
                          {formatAngka(item.jumlah_penduduk)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 whitespace-nowrap align-middle">
                          {formatAngka(item.jumlah_laki_laki)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 whitespace-nowrap align-middle">
                          {formatAngka(item.jumlah_perempuan)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 whitespace-nowrap align-middle">
                          {formatAngka(item.jumlah_kk)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 whitespace-nowrap align-middle">
                          {formatAngka(anakAnak)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 whitespace-nowrap align-middle">
                          {formatAngka(usiaProduktif)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 whitespace-nowrap align-middle">
                          {formatAngka(lansia)}
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap align-middle">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.status_publikasi === "dipublikasikan"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.status_publikasi === "dipublikasikan"
                              ? "Dipublikasikan"
                              : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right align-middle">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => mulaiEdit(item)}
                              disabled={loading || isToggleLoading}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              Edit
                            </button>

                            {/* Aktifkan / Nonaktifkan */}
                            <button
                              type="button"
                              onClick={() => handleQuickToggleActive(item)}
                              disabled={loading || isToggleLoading}
                              aria-label={`${item.is_active ? "Nonaktifkan" : "Aktifkan"} data tanggal ${item.tanggal_data}`}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap ${
                                item.is_active
                                  ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {isToggleLoading ? (
                                item.is_active ? "Menonaktifkan..." : "Mengaktifkan..."
                              ) : item.is_active ? (
                                "Nonaktifkan"
                              ) : (
                                "Aktifkan"
                              )}
                            </button>

                            {/* Hapus */}
                            <button
                              type="button"
                              onClick={() => hapusData(item)}
                              disabled={loading || isToggleLoading}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer whitespace-nowrap"
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