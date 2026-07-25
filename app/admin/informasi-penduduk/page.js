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
  is_active: false,
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

function formatBulanTahun(nilai) {
  if (!nilai) {
    return "-"
  }

  const [tahun, bulan] = nilai.split("-")

  return new Date(
    Number(tahun),
    Number(bulan) - 1,
    1
  ).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
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

  const [kelompokUsia, setKelompokUsia] = useState(
    KELOMPOK_USIA_AWAL
  )

  const [dataPendudukList, setDataPendudukList] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")

  const [jenisFilter, setJenisFilter] = useState("terbaru")
  const [filterHari, setFilterHari] = useState("")
  const [filterBulan, setFilterBulan] = useState("")
  const [filterTahun, setFilterTahun] = useState("")
  const [filterTanggalMulai, setFilterTanggalMulai] =
    useState("")
  const [filterTanggalSelesai, setFilterTanggalSelesai] =
    useState("")

  const totalKelompokUsia = useMemo(() => {
    return kelompokUsia.reduce(
      (total, kelompok) =>
        total + keAngka(kelompok.jumlah),
      0
    )
  }, [kelompokUsia])

  const totalJenisKelamin = useMemo(() => {
    return (
      keAngka(form.jumlah_laki_laki) +
      keAngka(form.jumlah_perempuan)
    )
  }, [
    form.jumlah_laki_laki,
    form.jumlah_perempuan,
  ])

  const filterRentangTidakValid =
    jenisFilter === "rentang" &&
    filterTanggalMulai &&
    filterTanggalSelesai &&
    filterTanggalSelesai < filterTanggalMulai

  const filterSudahDipilih = useMemo(() => {
    if (jenisFilter === "terbaru") {
      return true
    }

    if (jenisFilter === "hari") {
      return Boolean(filterHari)
    }

    if (jenisFilter === "bulan") {
      return Boolean(filterBulan)
    }

    if (jenisFilter === "tahun") {
      return Boolean(filterTahun)
    }

    if (jenisFilter === "rentang") {
      return Boolean(
        filterTanggalMulai &&
          filterTanggalSelesai &&
          filterTanggalSelesai >= filterTanggalMulai
      )
    }

    return false
  }, [
    jenisFilter,
    filterHari,
    filterBulan,
    filterTahun,
    filterTanggalMulai,
    filterTanggalSelesai,
  ])

  const hasilFilter = useMemo(() => {
    const dataTerurut = [...dataPendudukList].sort(
      (dataA, dataB) =>
        String(dataB.tanggal_data || "").localeCompare(
          String(dataA.tanggal_data || "")
        )
    )

    if (jenisFilter === "terbaru") {
      return dataTerurut
    }

    if (!filterSudahDipilih) {
      return []
    }

    if (jenisFilter === "hari") {
      return dataTerurut.filter(
        (item) => item.tanggal_data === filterHari
      )
    }

    if (jenisFilter === "bulan") {
      return dataTerurut.filter((item) =>
        String(item.tanggal_data || "").startsWith(
          filterBulan
        )
      )
    }

    if (jenisFilter === "tahun") {
      return dataTerurut.filter((item) =>
        String(item.tanggal_data || "").startsWith(
          `${filterTahun}-`
        )
      )
    }

    if (jenisFilter === "rentang") {
      return dataTerurut.filter((item) => {
        const tanggal = String(item.tanggal_data || "")

        return (
          tanggal >= filterTanggalMulai &&
          tanggal <= filterTanggalSelesai
        )
      })
    }

    return dataTerurut
  }, [
    dataPendudukList,
    jenisFilter,
    filterSudahDipilih,
    filterHari,
    filterBulan,
    filterTahun,
    filterTanggalMulai,
    filterTanggalSelesai,
  ])

  // Riwayat selalu menampilkan satu data saja.
  // Data yang dipilih adalah data paling akhir sesuai filter.
  const dataTerpilih = hasilFilter[0] || null

  const keteranganFilter = useMemo(() => {
    if (jenisFilter === "terbaru") {
      return "Data terbaru dari seluruh riwayat"
    }

    if (jenisFilter === "hari") {
      return filterHari
        ? `Data tanggal ${formatTanggal(filterHari)}`
        : "Pilih tanggal terlebih dahulu"
    }

    if (jenisFilter === "bulan") {
      return filterBulan
        ? `Data terakhir pada ${formatBulanTahun(
            filterBulan
          )}`
        : "Pilih bulan dan tahun terlebih dahulu"
    }

    if (jenisFilter === "tahun") {
      return filterTahun
        ? `Data terakhir pada tahun ${filterTahun}`
        : "Masukkan tahun terlebih dahulu"
    }

    if (jenisFilter === "rentang") {
      if (!filterTanggalMulai || !filterTanggalSelesai) {
        return "Pilih tanggal mulai dan tanggal selesai"
      }

      if (filterRentangTidakValid) {
        return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
      }

      return `Data terakhir antara ${formatTanggal(
        filterTanggalMulai
      )} sampai ${formatTanggal(filterTanggalSelesai)}`
    }

    return ""
  }, [
    jenisFilter,
    filterHari,
    filterBulan,
    filterTahun,
    filterTanggalMulai,
    filterTanggalSelesai,
    filterRentangTidakValid,
  ])

  const periksaSesi = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      alert(
        "Sesi admin tidak terbaca. Silakan login ulang."
      )

      window.location.href = "/login"
      return null
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

    const {
      data: dataUtama,
      error: dataUtamaError,
    } = await supabase
      .from("informasi_penduduk")
      .select("*")
      .order("tanggal_data", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })

    if (dataUtamaError) {
      console.error(
        "fetch informasi_penduduk error:",
        dataUtamaError
      )

      setError(
        dataUtamaError.message ||
          "Gagal memuat informasi penduduk."
      )

      setLoadingData(false)
      return
    }

    const daftarId = (dataUtama || []).map(
      (item) => item.id
    )

    let dataKelompok = []

    if (daftarId.length > 0) {
      const {
        data,
        error: kelompokError,
      } = await supabase
        .from("kelompok_usia_penduduk")
        .select("*")
        .in("informasi_penduduk_id", daftarId)
        .order("urutan", {
          ascending: true,
        })

      if (kelompokError) {
        console.error(
          "fetch kelompok_usia_penduduk error:",
          kelompokError
        )

        setError(
          kelompokError.message ||
            "Gagal memuat kelompok usia."
        )

        setLoadingData(false)
        return
      }

      dataKelompok = data || []
    }

    const hasilGabungan = (dataUtama || []).map(
      (item) => ({
        ...item,

        kelompok_usia: dataKelompok
          .filter(
            (kelompok) =>
              kelompok.informasi_penduduk_id ===
              item.id
          )
          .sort(
            (kelompokA, kelompokB) =>
              kelompokA.urutan - kelompokB.urutan
          ),
      })
    )

    setDataPendudukList(hasilGabungan)
    setLoadingData(false)
  }

  useEffect(() => {
    fetchDataPenduduk()
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

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    )

    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      )
    }
  }, [])

  const ubahForm = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setForm((formSebelumnya) => {
      const formBaru = {
        ...formSebelumnya,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      }

      // Data draft tidak boleh dijadikan aktif.
      if (
        name === "status_publikasi" &&
        value === "draft"
      ) {
        formBaru.is_active = false
      }

      return formBaru
    })
  }

  const ubahJumlahKelompok = (
    index,
    nilai
  ) => {
    setKelompokUsia(
      (kelompokSebelumnya) =>
        kelompokSebelumnya.map(
          (kelompok, posisi) =>
            posisi === index
              ? {
                  ...kelompok,
                  jumlah: nilai,
                }
              : kelompok
        )
    )
  }

  const resetForm = () => {
    setForm({
      ...FORM_AWAL,
    })

    setKelompokUsia(
      KELOMPOK_USIA_AWAL.map(
        (kelompok) => ({
          ...kelompok,
        })
      )
    )

    setEditingId(null)
  }

  const resetFilter = () => {
    setJenisFilter("terbaru")
    setFilterHari("")
    setFilterBulan("")
    setFilterTahun("")
    setFilterTanggalMulai("")
    setFilterTanggalSelesai("")
  }

  const simpanDataPenduduk = async (
    event
  ) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const jumlahPenduduk = keAngka(
      form.jumlah_penduduk
    )

    const jumlahLakiLaki = keAngka(
      form.jumlah_laki_laki
    )

    const jumlahPerempuan = keAngka(
      form.jumlah_perempuan
    )

    const jumlahKK = keAngka(
      form.jumlah_kk
    )

    if (!form.tanggal_data) {
      alert("Tanggal data wajib diisi.")
      return
    }

    if (!form.sumber_data.trim()) {
      alert("Sumber data wajib diisi.")
      return
    }

    if (jumlahPenduduk <= 0) {
      alert(
        "Jumlah penduduk harus lebih dari nol."
      )
      return
    }

    if (
      jumlahLakiLaki +
        jumlahPerempuan !==
      jumlahPenduduk
    ) {
      alert(
        "Jumlah laki-laki dan perempuan harus sama dengan jumlah penduduk."
      )
      return
    }

    if (
      totalKelompokUsia !==
      jumlahPenduduk
    ) {
      alert(
        "Total Anak-anak, Usia produktif, dan Lansia harus sama dengan jumlah penduduk."
      )
      return
    }

    if (jumlahKK < 0) {
      alert(
        "Jumlah kepala keluarga tidak boleh kurang dari nol."
      )
      return
    }

    if (
      form.is_active &&
      form.status_publikasi !==
        "dipublikasikan"
    ) {
      alert(
        "Data aktif harus berstatus Dipublikasikan."
      )
      return
    }

    setLoading(true)
    setError("")

    const session = await periksaSesi()

    if (!session) {
      setLoading(false)
      return
    }

    const dataUtama = {
      tanggal_data:
        form.tanggal_data,

      sumber_data:
        form.sumber_data.trim(),

      jumlah_penduduk:
        jumlahPenduduk,

      jumlah_laki_laki:
        jumlahLakiLaki,

      jumlah_perempuan:
        jumlahPerempuan,

      jumlah_kk:
        jumlahKK,

      keterangan:
        form.keterangan.trim() ||
        null,

      status_publikasi:
        form.status_publikasi,

      is_active:
        Boolean(form.is_active),
    }

    let informasiPendudukId =
      editingId

    const sedangMenambah =
      !editingId

    try {
      if (editingId) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from(
            "informasi_penduduk"
          )
          .update(dataUtama)
          .eq("id", editingId)
          .select("id")
          .single()

        if (updateError) {
          throw updateError
        }

        informasiPendudukId =
          data.id
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from(
            "informasi_penduduk"
          )
          .insert([dataUtama])
          .select("id")
          .single()

        if (insertError) {
          throw insertError
        }

        informasiPendudukId =
          data.id
      }

      const rincianUsia =
        kelompokUsia.map(
          (kelompok) => ({
            informasi_penduduk_id:
              informasiPendudukId,

            nama_kelompok:
              kelompok.nama_kelompok,

            rentang_usia:
              kelompok.rentang_usia,

            jumlah:
              keAngka(
                kelompok.jumlah
              ),

            urutan:
              kelompok.urutan,
          })
        )

      const {
        error: kelompokError,
      } = await supabase
        .from(
          "kelompok_usia_penduduk"
        )
        .upsert(rincianUsia, {
          onConflict:
            "informasi_penduduk_id,nama_kelompok",
        })

      if (kelompokError) {
        if (
          sedangMenambah &&
          informasiPendudukId
        ) {
          await supabase
            .from(
              "informasi_penduduk"
            )
            .delete()
            .eq(
              "id",
              informasiPendudukId
            )
        }

        throw kelompokError
      }

      alert(
        editingId
          ? "Informasi penduduk berhasil diperbarui!"
          : "Informasi penduduk berhasil ditambahkan!"
      )

      resetForm()
      resetFilter()

      await fetchDataPenduduk()
    } catch (simpanError) {
      console.error(
        "simpan informasi penduduk error:",
        simpanError
      )

      if (
        simpanError?.code ===
        "23505"
      ) {
        alert(
          "Gagal menyimpan: data pada tanggal tersebut sudah tersedia. Gunakan tombol Edit pada data yang sudah ada."
        )
      } else if (
        simpanError?.code ===
        "23514"
      ) {
        alert(
          "Gagal menyimpan karena data yang dimasukkan tidak memenuhi aturan database."
        )
      } else if (
        simpanError?.code ===
        "23502"
      ) {
        alert(
          `Gagal menyimpan karena ada kolom wajib yang belum terisi: ${
            simpanError?.message ||
            ""
          }`
        )
      } else {
        alert(
          `Gagal menyimpan data: ${
            simpanError?.message ||
            "Terjadi kesalahan."
          }`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const mulaiEdit = (item) => {
    setEditingId(item.id)

    setForm({
      tanggal_data:
        item.tanggal_data || "",

      sumber_data:
        item.sumber_data || "",

      jumlah_penduduk:
        item.jumlah_penduduk?.toString() ||
        "",

      jumlah_laki_laki:
        item.jumlah_laki_laki?.toString() ||
        "",

      jumlah_perempuan:
        item.jumlah_perempuan?.toString() ||
        "",

      jumlah_kk:
        item.jumlah_kk?.toString() ||
        "",

      keterangan:
        item.keterangan || "",

      status_publikasi:
        item.status_publikasi ||
        "draft",

      is_active:
        Boolean(item.is_active),
    })

    setKelompokUsia(
      KELOMPOK_USIA_AWAL.map(
        (kelompokDefault) => {
          const kelompokTersimpan =
            (
              item.kelompok_usia ||
              []
            ).find(
              (kelompok) =>
                kelompok.nama_kelompok ===
                kelompokDefault.nama_kelompok
            )

          return {
            ...kelompokDefault,

            jumlah:
              kelompokTersimpan?.jumlah?.toString() ||
              "",
          }
        }
      )
    )

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const batalEdit = () => {
    resetForm()
  }

  const hapusData = async (
    item
  ) => {
    const session =
      await periksaSesi()

    if (!session) {
      return
    }

    const tambahanPeringatan =
      item.is_active
        ? "\n\nData ini sedang aktif di Beranda."
        : ""

    const yakin = window.confirm(
      `Yakin ingin menghapus informasi penduduk tanggal ${formatTanggal(
        item.tanggal_data
      )}?${tambahanPeringatan}`
    )

    if (!yakin) {
      return
    }

    setLoading(true)

    const {
      error: hapusError,
    } = await supabase
      .from(
        "informasi_penduduk"
      )
      .delete()
      .eq("id", item.id)

    if (hapusError) {
      console.error(
        "hapus informasi penduduk error:",
        hapusError
      )

      alert(
        `Gagal menghapus data: ${hapusError.message}`
      )

      setLoading(false)
      return
    }

    alert(
      "Informasi penduduk berhasil dihapus."
    )

    if (editingId === item.id) {
      resetForm()
    }

    await fetchDataPenduduk()
    setLoading(false)
  }

  const handleLogout = async () => {
    setLoading(true)
    await keluarDariAdmin(
      "Logout error"
    )
  }

  const anakAnak = dataTerpilih
    ? ambilJumlahKelompok(
        dataTerpilih,
        "Anak-anak"
      )
    : 0

  const usiaProduktif = dataTerpilih
    ? ambilJumlahKelompok(
        dataTerpilih,
        "Usia produktif"
      )
    : 0

  const lansia = dataTerpilih
    ? ambilJumlahKelompok(
        dataTerpilih,
        "Lansia"
      )
    : 0

  const dataTerpilihSesuai = dataTerpilih
    ? keAngka(
        dataTerpilih.jumlah_laki_laki
      ) +
        keAngka(
          dataTerpilih.jumlah_perempuan
        ) ===
        keAngka(
          dataTerpilih.jumlah_penduduk
        ) &&
      anakAnak +
        usiaProduktif +
        lansia ===
        keAngka(
          dataTerpilih.jumlah_penduduk
        )
    : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-white/50 rounded-lg transition-colors touch-manipulation"
                title="Kembali ke Dashboard"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
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
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  {editingId
                    ? "Edit Informasi Penduduk"
                    : "Kelola Informasi Penduduk"}
                </h1>

                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Kelola data penduduk berdasarkan tanggal pencatatan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 sm:py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
              disabled={loading}
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

          <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] rounded-full" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 md:gap-6 items-start">
          {/* Form data */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">
                {editingId
                  ? "Edit Data Penduduk"
                  : "Form Data Penduduk"}
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 mb-5">
                Masukkan kondisi data penduduk pada satu tanggal pencatatan.
              </p>

              <form
                onSubmit={
                  simpanDataPenduduk
                }
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Data
                  </label>

                  <input
                    type="date"
                    name="tanggal_data"
                    value={
                      form.tanggal_data
                    }
                    onChange={ubahForm}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sumber Data
                  </label>

                  <input
                    type="text"
                    name="sumber_data"
                    placeholder="Contoh: Data Sensus Nagari"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                    value={
                      form.sumber_data
                    }
                    onChange={ubahForm}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Penduduk
                    </label>

                    <input
                      type="number"
                      name="jumlah_penduduk"
                      min="0"
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                      value={
                        form.jumlah_penduduk
                      }
                      onChange={ubahForm}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah KK
                    </label>

                    <input
                      type="number"
                      name="jumlah_kk"
                      min="0"
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                      value={
                        form.jumlah_kk
                      }
                      onChange={ubahForm}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Laki-laki
                    </label>

                    <input
                      type="number"
                      name="jumlah_laki_laki"
                      min="0"
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                      value={
                        form.jumlah_laki_laki
                      }
                      onChange={ubahForm}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perempuan
                    </label>

                    <input
                      type="number"
                      name="jumlah_perempuan"
                      min="0"
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                      value={
                        form.jumlah_perempuan
                      }
                      onChange={ubahForm}
                      required
                    />
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-3 text-sm ${
                    form.jumlah_penduduk &&
                    totalJenisKelamin !==
                      keAngka(
                        form.jumlah_penduduk
                      )
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  Total laki-laki + perempuan:{" "}
                  <strong>
                    {formatAngka(
                      totalJenisKelamin
                    )}
                  </strong>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Kelompok Usia
                  </h3>

                  <p className="text-xs text-gray-500 mb-4">
                    Total kelompok usia harus sama dengan jumlah penduduk.
                  </p>

                  <div className="space-y-3">
                    {kelompokUsia.map(
                      (
                        kelompok,
                        index
                      ) => (
                        <div
                          key={
                            kelompok.nama_kelompok
                          }
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-3 items-end">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {
                                  kelompok.nama_kelompok
                                }
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                {
                                  kelompok.rentang_usia
                                }
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Jumlah
                              </label>

                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={
                                  kelompok.jumlah
                                }
                                onChange={(
                                  event
                                ) =>
                                  ubahJumlahKelompok(
                                    index,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all bg-white"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div
                    className={`mt-3 rounded-lg border p-3 text-sm ${
                      form.jumlah_penduduk &&
                      totalKelompokUsia !==
                        keAngka(
                          form.jumlah_penduduk
                        )
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    Total kelompok usia:{" "}
                    <strong>
                      {formatAngka(
                        totalKelompokUsia
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan
                  </label>

                  <textarea
                    name="keterangan"
                    rows={3}
                    placeholder="Tambahkan keterangan bila diperlukan..."
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all text-base"
                    value={
                      form.keterangan
                    }
                    onChange={ubahForm}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Publikasi
                  </label>

                  <select
                    name="status_publikasi"
                    value={
                      form.status_publikasi
                    }
                    onChange={ubahForm}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="dipublikasikan">
                      Dipublikasikan
                    </option>
                  </select>
                </div>

                <label
                  className={`w-full min-h-[48px] flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    form.status_publikasi ===
                    "dipublikasikan"
                      ? "border-gray-300 bg-white cursor-pointer"
                      : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-70"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      form.is_active
                    }
                    onChange={ubahForm}
                    disabled={
                      form.status_publikasi !==
                      "dipublikasikan"
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    Tampilkan sebagai data aktif di Beranda
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white font-semibold py-3 rounded-lg hover:from-[#3a2604] hover:to-[#100b00] transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    disabled={loading}
                  >
                    {loading
                      ? "Menyimpan..."
                      : editingId
                        ? "Simpan Perubahan"
                        : "Tambah Data Penduduk"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={batalEdit}
                      className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base min-h-[44px]"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Riwayat */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                    Riwayat Informasi Penduduk
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Pilih periode untuk menampilkan satu data terakhir yang tersedia.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    fetchDataPenduduk
                  }
                  className="px-3 sm:px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]"
                  disabled={
                    loading ||
                    loadingData
                  }
                >
                  <svg
                    className="w-4 h-4"
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

              {/* Filter */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Filter
                    </label>

                    <select
                      value={
                        jenisFilter
                      }
                      onChange={(
                        event
                      ) =>
                        setJenisFilter(
                          event.target
                            .value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    >
                      <option value="terbaru">
                        Data terbaru
                      </option>

                      <option value="hari">
                        Per hari
                      </option>

                      <option value="bulan">
                        Per bulan
                      </option>

                      <option value="tahun">
                        Per tahun
                      </option>

                      <option value="rentang">
                        Rentang tanggal
                      </option>
                    </select>
                  </div>

                  {jenisFilter ===
                    "hari" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Tanggal
                      </label>

                      <input
                        type="date"
                        value={
                          filterHari
                        }
                        onChange={(
                          event
                        ) =>
                          setFilterHari(
                            event.target
                              .value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                      />
                    </div>
                  )}

                  {jenisFilter ===
                    "bulan" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Bulan
                      </label>

                      <input
                        type="month"
                        value={
                          filterBulan
                        }
                        onChange={(
                          event
                        ) =>
                          setFilterBulan(
                            event.target
                              .value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                      />
                    </div>
                  )}

                  {jenisFilter ===
                    "tahun" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tahun
                      </label>

                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        placeholder="Contoh: 2026"
                        value={
                          filterTahun
                        }
                        onChange={(
                          event
                        ) =>
                          setFilterTahun(
                            event.target
                              .value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                      />
                    </div>
                  )}

                  {jenisFilter ===
                    "rentang" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dari Tanggal
                        </label>

                        <input
                          type="date"
                          value={
                            filterTanggalMulai
                          }
                          onChange={(
                            event
                          ) =>
                            setFilterTanggalMulai(
                              event
                                .target
                                .value
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sampai Tanggal
                        </label>

                        <input
                          type="date"
                          min={
                            filterTanggalMulai ||
                            undefined
                          }
                          value={
                            filterTanggalSelesai
                          }
                          onChange={(
                            event
                          ) =>
                            setFilterTanggalSelesai(
                              event
                                .target
                                .value
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={
                        resetFilter
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-lg border p-3 text-sm ${
                    filterRentangTidakValid
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  <p className="font-semibold">
                    {
                      keteranganFilter
                    }
                  </p>

                  {filterSudahDipilih &&
                    !filterRentangTidakValid && (
                      <p className="mt-1">
                        {
                          hasilFilter.length
                        }{" "}
                        data ditemukan.
                        Riwayat menampilkan
                        satu data paling
                        akhir.
                      </p>
                    )}
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loadingData && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2c1b01]" />

                  <p className="text-gray-500 text-sm mt-4">
                    Memuat informasi penduduk...
                  </p>
                </div>
              )}

              {!loadingData &&
                !filterSudahDipilih && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      Lengkapi pilihan filter untuk melihat data.
                    </p>
                  </div>
                )}

              {!loadingData &&
                filterSudahDipilih &&
                !dataTerpilih && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      Tidak ada informasi penduduk pada periode yang dipilih.
                    </p>
                  </div>
                )}

              {!loadingData &&
                dataTerpilih && (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full min-w-[1450px] border-collapse text-sm">
                        <thead className="bg-[#2c1b01] text-white">
                          <tr>
                            <th className="px-4 py-3 text-left whitespace-nowrap">
                              Tanggal
                            </th>

                            <th className="px-4 py-3 text-left whitespace-nowrap">
                              Sumber
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              Penduduk
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              Laki-laki
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              Perempuan
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              KK
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              Anak
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              Produktif
                            </th>

                            <th className="px-4 py-3 text-right whitespace-nowrap">
                              Lansia
                            </th>

                            <th className="px-4 py-3 text-center whitespace-nowrap">
                              Status
                            </th>

                            <th className="px-4 py-3 text-center whitespace-nowrap">
                              Aktif
                            </th>

                            <th className="px-4 py-3 text-left min-w-[220px]">
                              Keterangan
                            </th>

                            <th className="px-4 py-3 text-center whitespace-nowrap">
                              Aksi
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr className="bg-white hover:bg-gray-50">
                            <td className="border-t border-gray-200 px-4 py-4 font-semibold whitespace-nowrap">
                              {formatTanggal(
                                dataTerpilih.tanggal_data
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 min-w-[180px]">
                              {
                                dataTerpilih.sumber_data
                              }
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right font-semibold">
                              {formatAngka(
                                dataTerpilih.jumlah_penduduk
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right">
                              {formatAngka(
                                dataTerpilih.jumlah_laki_laki
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right">
                              {formatAngka(
                                dataTerpilih.jumlah_perempuan
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right">
                              {formatAngka(
                                dataTerpilih.jumlah_kk
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right">
                              {formatAngka(
                                anakAnak
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right">
                              {formatAngka(
                                usiaProduktif
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-right">
                              {formatAngka(
                                lansia
                              )}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  dataTerpilih.status_publikasi ===
                                  "dipublikasikan"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {dataTerpilih.status_publikasi ===
                                "dipublikasikan"
                                  ? "Dipublikasikan"
                                  : "Draft"}
                              </span>
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  dataTerpilih.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {dataTerpilih.is_active
                                  ? "Ya"
                                  : "Tidak"}
                              </span>
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4 text-gray-600">
                              {dataTerpilih.keterangan ||
                                "-"}
                            </td>

                            <td className="border-t border-gray-200 px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    mulaiEdit(
                                      dataTerpilih
                                    )
                                  }
                                  className="px-3 py-2 rounded-lg bg-yellow-500 text-white text-xs font-semibold hover:bg-yellow-600 transition-colors"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    hapusData(
                                      dataTerpilih
                                    )
                                  }
                                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                                  disabled={
                                    loading
                                  }
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div
                      className={`mt-4 rounded-lg border p-3 text-sm ${
                        dataTerpilihSesuai
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {dataTerpilihSesuai
                        ? "Total jenis kelamin dan kelompok usia sesuai dengan jumlah penduduk."
                        : "Periksa kembali total jenis kelamin atau kelompok usia."}
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}