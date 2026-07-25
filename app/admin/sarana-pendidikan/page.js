"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

const FORM_SARANA_AWAL = {
  nama_sarana: "",
  tingkat_pendidikan: "PAUD",
  jenis_pengelolaan: "",
  alamat: "",
  jumlah_siswa: "0",
  jumlah_guru: "0",
  jumlah_staf: "0",
  status_operasional: "aktif",
  nomor_kontak: "",
  lokasi_peta: "",
  keterangan: "",
  urutan: "0",
  is_active: true,
}

const SARAN_FASILITAS = [
  "Ruang Kelas",
  "Kamar Mandi",
  "Musala",
  "Perpustakaan",
  "UKS",
  "Laboratorium",
  "Kantin",
  "Lapangan",
  "Ruang Guru",
  "Ruang Kepala Sekolah",
]

const PILIHAN_TINGKAT = [
  "PAUD",
  "TK",
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "SLB",
  "Lainnya",
]

const PILIHAN_PENGELOLAAN = [
  "Negeri",
  "Swasta",
  "Lainnya",
]

const PILIHAN_STATUS_OPERASIONAL = [
  {
    value: "aktif",
    label: "Aktif",
  },
  {
    value: "tidak_aktif",
    label: "Tidak Aktif",
  },
  {
    value: "dalam_pembangunan",
    label: "Dalam Pembangunan",
  },
  {
    value: "lainnya",
    label: "Lainnya",
  },
]

function keAngka(nilai) {
  const angka = Number(nilai)
  return Number.isFinite(angka) ? angka : 0
}

function formatAngka(nilai) {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function formatStatusOperasional(nilai) {
  return (
    PILIHAN_STATUS_OPERASIONAL.find(
      (status) => status.value === nilai
    )?.label || nilai
  )
}

function buatNamaFileAman(namaFile) {
  return String(namaFile || "foto")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
}

function ambilPathFotoDariUrl(fotoUrl) {
  if (!fotoUrl) {
    return null
  }

  const penanda =
    `/storage/v1/object/public/${BUCKET_FOTO}/`

  const posisi = fotoUrl.indexOf(penanda)

  if (posisi === -1) {
    return null
  }

  const pathDenganQuery = fotoUrl.slice(
    posisi + penanda.length
  )

  const pathTanpaQuery =
    pathDenganQuery.split("?")[0]

  try {
    return decodeURIComponent(pathTanpaQuery)
  } catch {
    return pathTanpaQuery
  }
}

async function hapusFotoDariStorage(fotoUrl) {
  const pathFoto = ambilPathFotoDariUrl(fotoUrl)

  if (!pathFoto) {
    return
  }

  const { error } = await supabase.storage
    .from(BUCKET_FOTO)
    .remove([pathFoto])

  if (error) {
    console.error(
      "Gagal menghapus foto dari Storage:",
      error
    )
  }
}

async function keluarDariAdmin(
  labelError = "Logout error"
) {
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
      window.location.href =
        `/login?logout=success&t=${Date.now()}`
    }
  } catch (error) {
    console.error(labelError, error)

    window.location.href =
      `/login?logout=success&t=${Date.now()}`
  }
}

export default function SaranaPendidikanAdmin() {
  const [formPendataan, setFormPendataan] = useState(
    FORM_PENDATAAN_AWAL
  )

  const [formSarana, setFormSarana] = useState(
    FORM_SARANA_AWAL
  )

  const [formFasilitasList, setFormFasilitasList] = useState([])
  const [existingFasilitasIds, setExistingFasilitasIds] = useState([])
  const [loadingFasilitas, setLoadingFasilitas] = useState(false)

  const [pendataanList, setPendataanList] = useState([])
  const [saranaList, setSaranaList] = useState([])

  const [pendataanTerpilihId, setPendataanTerpilihId] =
    useState("")

  const [editingPendataanId, setEditingPendataanId] =
    useState(null)

  const [editingSaranaId, setEditingSaranaId] =
    useState(null)

  const [fotoFile, setFotoFile] = useState(null)
  const [existingFotoUrl, setExistingFotoUrl] =
    useState("")

  const [previewFotoUrl, setPreviewFotoUrl] =
    useState("")

  const [searchQuery, setSearchQuery] = useState("")

  const [loading, setLoading] = useState(false)

  const [loadingPendataan, setLoadingPendataan] =
    useState(true)

  const [loadingSarana, setLoadingSarana] =
    useState(false)

  const [error, setError] = useState("")

  const fileInputRef = useRef(null)

  const pendataanTerpilih = useMemo(() => {
    return (
      pendataanList.find(
        (item) => item.id === pendataanTerpilihId
      ) || null
    )
  }, [pendataanList, pendataanTerpilihId])

  const saranaTersaring = useMemo(() => {
    const kataKunci = searchQuery
      .trim()
      .toLowerCase()

    if (!kataKunci) {
      return saranaList
    }

    return saranaList.filter((item) => {
      return [
        item.nama_sarana,
        item.tingkat_pendidikan,
        item.jenis_pengelolaan,
        item.alamat,
        item.nomor_kontak,
        item.status_operasional,
        item.keterangan,
      ].some((nilai) =>
        String(nilai || "")
          .toLowerCase()
          .includes(kataKunci)
      )
    })
  }, [saranaList, searchQuery])

  const ringkasanTingkat = useMemo(() => {
    return saranaList
      .filter(
        (item) =>
          item.is_active &&
          item.status_operasional === "aktif"
      )
      .reduce((hasil, item) => {
        const tingkat =
          item.tingkat_pendidikan || "Lainnya"

        hasil[tingkat] =
          (hasil[tingkat] || 0) + 1

        return hasil
      }, {})
  }, [saranaList])

  const totalSiswa = useMemo(() => {
    return saranaList
      .filter((item) => item.is_active)
      .reduce(
        (total, item) =>
          total + keAngka(item.jumlah_siswa),
        0
      )
  }, [saranaList])

  const totalGuru = useMemo(() => {
    return saranaList
      .filter((item) => item.is_active)
      .reduce(
        (total, item) =>
          total + keAngka(item.jumlah_guru),
        0
      )
  }, [saranaList])

  const totalStaf = useMemo(() => {
    return saranaList
      .filter((item) => item.is_active)
      .reduce(
        (total, item) =>
          total + keAngka(item.jumlah_staf),
        0
      )
  }, [saranaList])

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

  const fetchPendataan = async (
    idYangDipilih = null
  ) => {
    setLoadingPendataan(true)
    setError("")

    const session = await periksaSesi()

    if (!session) {
      setLoadingPendataan(false)
      return
    }

    const { data, error: fetchError } =
      await supabase
        .from("pendataan_sarana_pendidikan")
        .select("*")
        .order("tahun_pendataan", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        })

    if (fetchError) {
      console.error(
        "fetch pendataan sarana pendidikan error:",
        fetchError
      )

      setError(
        fetchError.message ||
          "Gagal memuat periode pendataan."
      )

      setLoadingPendataan(false)
      return
    }

    const daftar = data || []

    setPendataanList(daftar)

    let idPilihan = idYangDipilih

    if (
      !idPilihan ||
      !daftar.some(
        (item) => item.id === idPilihan
      )
    ) {
      if (
        pendataanTerpilihId &&
        daftar.some(
          (item) =>
            item.id === pendataanTerpilihId
        )
      ) {
        idPilihan = pendataanTerpilihId
      } else {
        idPilihan =
          daftar.find(
            (item) => item.is_active
          )?.id ||
          daftar[0]?.id ||
          ""
      }
    }

    setPendataanTerpilihId(idPilihan || "")
    setLoadingPendataan(false)
  }

  const fetchSarana = async (pendataanId) => {
    if (!pendataanId) {
      setSaranaList([])
      return
    }

    setLoadingSarana(true)
    setError("")

    const session = await periksaSesi()

    if (!session) {
      setLoadingSarana(false)
      return
    }

    const { data, error: fetchError } =
      await supabase
        .from("sarana_pendidikan")
        .select("*")
        .eq("pendataan_id", pendataanId)
        .order("urutan", {
          ascending: true,
        })
        .order("nama_sarana", {
          ascending: true,
        })

    if (fetchError) {
      console.error(
        "fetch sarana pendidikan error:",
        fetchError
      )

      setError(
        fetchError.message ||
          "Gagal memuat daftar sarana pendidikan."
      )

      setLoadingSarana(false)
      return
    }

    setSaranaList(data || [])
    setLoadingSarana(false)
  }

  useEffect(() => {
    fetchPendataan()
  }, [])

  useEffect(() => {
    fetchSarana(pendataanTerpilihId)

    setEditingSaranaId(null)
    setFormSarana({
      ...FORM_SARANA_AWAL,
    })

    setFotoFile(null)
    setExistingFotoUrl("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [pendataanTerpilihId])

  useEffect(() => {
    if (!fotoFile) {
      setPreviewFotoUrl(existingFotoUrl || "")
      return
    }

    const objectUrl =
      URL.createObjectURL(fotoFile)

    setPreviewFotoUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [fotoFile, existingFotoUrl])

  // Logout otomatis apabila admin tidak aktif selama 5 menit.
  useEffect(() => {
    let timeoutId

    const logoutOtomatis = async () => {
      await keluarDariAdmin(
        "Auto logout error"
      )
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
      window.addEventListener(
        event,
        resetTimer
      )
    )

    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      events.forEach((event) =>
        window.removeEventListener(
          event,
          resetTimer
        )
      )
    }
  }, [])

  const ubahFormPendataan = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormPendataan((formSebelumnya) => {
      const formBaru = {
        ...formSebelumnya,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      }

      if (
        name === "status_publikasi" &&
        value === "draft"
      ) {
        formBaru.is_active = false
      }

      return formBaru
    })
  }

  const ubahFormSarana = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormSarana((formSebelumnya) => ({
      ...formSebelumnya,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }))
  }

  const resetFormPendataan = () => {
    setFormPendataan({
      ...FORM_PENDATAAN_AWAL,

      tahun_pendataan:
        new Date().getFullYear().toString(),
    })

    setEditingPendataanId(null)
  }

  const resetFormSarana = () => {
    setFormSarana({
      ...FORM_SARANA_AWAL,
    })

    setEditingSaranaId(null)
    setFormFasilitasList([])
    setExistingFasilitasIds([])
    setLoadingFasilitas(false)
    setFotoFile(null)
    setExistingFotoUrl("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const tambahBarisFasilitas = () => {
    const tempId =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`

    setFormFasilitasList((prev) => [
      ...prev,
      {
        tempId,
        nama_fasilitas: "",
        jumlah: "1",
        urutan: (prev.length + 1).toString(),
        is_active: true,
      },
    ])
  }

  const ubahBarisFasilitas = (index, field, value) => {
    setFormFasilitasList((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        [field]: value,
      }
      return copy
    })
  }

  const hapusBarisFasilitas = (index) => {
    setFormFasilitasList((prev) => prev.filter((_, i) => i !== index))
  }

  const simpanPendataan = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const tahun = keAngka(
      formPendataan.tahun_pendataan
    )

    if (tahun < 1900 || tahun > 2100) {
      alert(
        "Tahun pendataan harus berada antara 1900 dan 2100."
      )
      return
    }

    if (!formPendataan.sumber_data.trim()) {
      alert("Sumber data wajib diisi.")
      return
    }

    if (
      formPendataan.is_active &&
      formPendataan.status_publikasi !==
        "dipublikasikan"
    ) {
      alert(
        "Pendataan aktif harus berstatus Dipublikasikan."
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

    const dataPendataan = {
      tahun_pendataan: tahun,

      sumber_data:
        formPendataan.sumber_data.trim(),

      keterangan:
        formPendataan.keterangan.trim() ||
        null,

      status_publikasi:
        formPendataan.status_publikasi,

      is_active: Boolean(
        formPendataan.is_active
      ),
    }

    try {
      let dataTersimpan

      if (editingPendataanId) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from(
            "pendataan_sarana_pendidikan"
          )
          .update(dataPendataan)
          .eq("id", editingPendataanId)
          .select("*")
          .single()

        if (updateError) {
          throw updateError
        }

        dataTersimpan = data
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from(
            "pendataan_sarana_pendidikan"
          )
          .insert([dataPendataan])
          .select("*")
          .single()

        if (insertError) {
          throw insertError
        }

        dataTersimpan = data
      }

      alert(
        editingPendataanId
          ? "Pendataan sarana pendidikan berhasil diperbarui!"
          : "Pendataan sarana pendidikan berhasil ditambahkan!"
      )

      resetFormPendataan()

      await fetchPendataan(
        dataTersimpan.id
      )
    } catch (simpanError) {
      console.error(
        "simpan pendataan error:",
        simpanError
      )

      if (simpanError?.code === "23505") {
        alert(
          "Data pendataan untuk tahun tersebut sudah tersedia. Gunakan tombol Edit pada data yang sudah ada."
        )
      } else {
        alert(
          `Gagal menyimpan pendataan: ${
            simpanError?.message ||
            "Terjadi kesalahan."
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
      tahun_pendataan:
        item.tahun_pendataan?.toString() ||
        "",

      sumber_data:
        item.sumber_data || "",

      keterangan:
        item.keterangan || "",

      status_publikasi:
        item.status_publikasi || "draft",

      is_active:
        Boolean(item.is_active),
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
      const {
        data: daftarFoto,
        error: fotoError,
      } = await supabase
        .from("sarana_pendidikan")
        .select("foto_url")
        .eq("pendataan_id", item.id)

      if (fotoError) {
        console.error(
          "Gagal membaca daftar foto:",
          fotoError
        )
      }

      const {
        error: hapusError,
      } = await supabase
        .from(
          "pendataan_sarana_pendidikan"
        )
        .delete()
        .eq("id", item.id)

      if (hapusError) {
        throw hapusError
      }

      const daftarPath = (
        daftarFoto || []
      )
        .map((foto) =>
          ambilPathFotoDariUrl(
            foto.foto_url
          )
        )
        .filter(Boolean)

      if (daftarPath.length > 0) {
        const {
          error: hapusFotoError,
        } = await supabase.storage
          .from(BUCKET_FOTO)
          .remove(daftarPath)

        if (hapusFotoError) {
          console.error(
            "Sebagian foto gagal dibersihkan:",
            hapusFotoError
          )
        }
      }

      alert(
        "Pendataan sarana pendidikan berhasil dihapus."
      )

      if (
        editingPendataanId === item.id
      ) {
        resetFormPendataan()
      }

      if (
        pendataanTerpilihId === item.id
      ) {
        setPendataanTerpilihId("")
        setSaranaList([])
      }

      await fetchPendataan()
    } catch (hapusError) {
      console.error(
        "hapus pendataan error:",
        hapusError
      )

      alert(
        `Gagal menghapus pendataan: ${
          hapusError?.message ||
          "Terjadi kesalahan."
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  const pilihFoto = (event) => {
    const file =
      event.target.files?.[0] || null

    if (!file) {
      setFotoFile(null)
      return
    }

    const tipeYangDiizinkan = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    if (
      !tipeYangDiizinkan.includes(
        file.type
      )
    ) {
      alert(
        "Format foto harus JPG, PNG, atau WEBP."
      )

      event.target.value = ""
      setFotoFile(null)
      return
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      alert(
        "Ukuran foto maksimal 2 MB."
      )

      event.target.value = ""
      setFotoFile(null)
      return
    }

    setFotoFile(file)
  }

  const uploadFoto = async (
    pendataanId
  ) => {
    if (!fotoFile) {
      return {
        fotoUrl:
          existingFotoUrl || null,

        pathBaru: null,
      }
    }

    const namaAman =
      buatNamaFileAman(
        fotoFile.name
      )

    const kodeUnik =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : Math.random()
            .toString(36)
            .slice(2)

    const pathFoto =
      `${pendataanId}/${Date.now()}-${kodeUnik}-${namaAman}`

    const {
      error: uploadError,
    } = await supabase.storage
      .from(BUCKET_FOTO)
      .upload(pathFoto, fotoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: fotoFile.type,
      })

    if (uploadError) {
      throw new Error(
        `Gagal mengunggah foto: ${uploadError.message}`
      )
    }

    const {
      data: publicData,
    } = supabase.storage
      .from(BUCKET_FOTO)
      .getPublicUrl(pathFoto)

    return {
      fotoUrl:
        publicData?.publicUrl || null,

      pathBaru: pathFoto,
    }
  }

  const simpanSarana = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    if (!pendataanTerpilihId) {
      alert(
        "Pilih atau buat tahun pendataan terlebih dahulu."
      )
      return
    }

    if (!formSarana.nama_sarana.trim()) {
      alert("Nama sarana wajib diisi.")
      return
    }

    if (!formSarana.alamat.trim()) {
      alert("Alamat wajib diisi.")
      return
    }

    const jumlahSiswa = keAngka(
      formSarana.jumlah_siswa
    )

    const jumlahGuru = keAngka(
      formSarana.jumlah_guru
    )

    const jumlahStaf = keAngka(
      formSarana.jumlah_staf
    )

    const urutan = keAngka(
      formSarana.urutan
    )

    if (
      jumlahSiswa < 0 ||
      jumlahGuru < 0 ||
      jumlahStaf < 0 ||
      urutan < 0
    ) {
      alert(
        "Jumlah siswa, jumlah guru, jumlah staf, dan urutan tidak boleh kurang dari nol."
      )
      return
    }

    // Validasi Fasilitas (Cek Duplikat Nama)
    const namaMap = new Set()
    for (let i = 0; i < formFasilitasList.length; i++) {
      const itemFas = formFasilitasList[i]
      const namaTrim = (itemFas.nama_fasilitas || "").trim().toLowerCase()
      const jml = keAngka(itemFas.jumlah)

      if (namaTrim.length > 0 && jml >= 1) {
        if (namaMap.has(namaTrim)) {
          alert(
            `Nama sarana/fasilitas "${itemFas.nama_fasilitas.trim()}" ditulis lebih dari satu kali. Mohon gabungkan atau ubah nama duplikat.`
          )
          return
        }
        namaMap.add(namaTrim)
      }
    }

    if (
      formSarana.lokasi_peta.trim()
    ) {
      try {
        const url = new URL(
          formSarana.lokasi_peta.trim()
        )

        if (
          !["http:", "https:"].includes(
            url.protocol
          )
        ) {
          throw new Error()
        }
      } catch {
        alert(
          "Tautan lokasi peta harus berupa URL yang valid, misalnya https://maps.google.com/..."
        )
        return
      }
    }

    setLoading(true)
    setError("")

    const session = await periksaSesi()

    if (!session) {
      setLoading(false)
      return
    }

    let pathFotoBaru = null

    try {
      const hasilUpload =
        await uploadFoto(
          pendataanTerpilihId
        )

      pathFotoBaru =
        hasilUpload.pathBaru

      const dataSarana = {
        pendataan_id:
          pendataanTerpilihId,

        nama_sarana:
          formSarana.nama_sarana.trim(),

        tingkat_pendidikan:
          formSarana.tingkat_pendidikan,

        jenis_pengelolaan:
          formSarana.jenis_pengelolaan ||
          null,

        alamat:
          formSarana.alamat.trim(),

        jumlah_siswa:
          jumlahSiswa,

        jumlah_guru:
          jumlahGuru,

        jumlah_staf:
          jumlahStaf,

        status_operasional:
          formSarana.status_operasional,

        nomor_kontak:
          formSarana.nomor_kontak.trim() ||
          null,

        lokasi_peta:
          formSarana.lokasi_peta.trim() ||
          null,

        foto_url:
          hasilUpload.fotoUrl,

        keterangan:
          formSarana.keterangan.trim() ||
          null,

        urutan,

        is_active:
          Boolean(formSarana.is_active),
      }

      let errorFasilitas = false

      if (editingSaranaId) {
        const {
          error: updateError,
        } = await supabase
          .from("sarana_pendidikan")
          .update(dataSarana)
          .eq("id", editingSaranaId)

        if (updateError) {
          throw updateError
        }

        // Sinkronisasi Aman Fasilitas saat Edit
        const fasilitasValidForm = formFasilitasList
          .map((f, index) => ({
            id: f.id || null,
            nama_fasilitas: f.nama_fasilitas.trim(),
            jumlah: keAngka(f.jumlah),
            urutan: index + 1,
            is_active: Boolean(f.is_active ?? true),
          }))
          .filter((f) => f.nama_fasilitas.length > 0 && f.jumlah >= 1)

        const currentFormFasilitasIds = fasilitasValidForm
          .map((f) => f.id)
          .filter(Boolean)

        // 1. Update fasilitas lama yang ada di form
        const itemsToUpdate = fasilitasValidForm.filter((f) => Boolean(f.id))
        for (const itemUpd of itemsToUpdate) {
          const { error: errUpd } = await supabase
            .from("fasilitas_sarana_pendidikan")
            .update({
              nama_fasilitas: itemUpd.nama_fasilitas,
              jumlah: itemUpd.jumlah,
              urutan: itemUpd.urutan,
              is_active: itemUpd.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemUpd.id)
            .eq("sarana_pendidikan_id", editingSaranaId)

          if (errUpd) {
            console.error("Error update fasilitas:", errUpd)
            errorFasilitas = true
          }
        }

        // 2. Insert fasilitas baru (belum punya ID)
        const itemsToInsert = fasilitasValidForm
          .filter((f) => !f.id)
          .map((f) => ({
            sarana_pendidikan_id: editingSaranaId,
            nama_fasilitas: f.nama_fasilitas,
            jumlah: f.jumlah,
            urutan: f.urutan,
            is_active: f.is_active,
          }))

        if (itemsToInsert.length > 0) {
          const { error: errIns } = await supabase
            .from("fasilitas_sarana_pendidikan")
            .insert(itemsToInsert)

          if (errIns) {
            console.error("Error insert fasilitas baru:", errIns)
            errorFasilitas = true
          }
        }

        // 3. Hapus fasilitas lama yang sudah tidak ada di form (atau jumlah < 1)
        const idsToDelete = existingFasilitasIds.filter(
          (id) => !currentFormFasilitasIds.includes(id)
        )

        if (idsToDelete.length > 0 && !errorFasilitas) {
          const { error: errDel } = await supabase
            .from("fasilitas_sarana_pendidikan")
            .delete()
            .in("id", idsToDelete)
            .eq("sarana_pendidikan_id", editingSaranaId)

          if (errDel) {
            console.error("Error hapus fasilitas lama:", errDel)
            errorFasilitas = true
          }
        }
      } else {
        const {
          data: sekolahBaru,
          error: insertError,
        } = await supabase
          .from("sarana_pendidikan")
          .insert([dataSarana])
          .select("id")
          .single()

        if (insertError) {
          throw insertError
        }

        const sekolahIdBaru = sekolahBaru.id

        const fasilitasValid = formFasilitasList
          .map((f, index) => ({
            sarana_pendidikan_id: sekolahIdBaru,
            nama_fasilitas: f.nama_fasilitas.trim(),
            jumlah: keAngka(f.jumlah),
            urutan: index + 1,
            is_active: true,
          }))
          .filter((f) => f.nama_fasilitas.length > 0 && f.jumlah >= 1)

        if (fasilitasValid.length > 0) {
          const { error: errFas } = await supabase
            .from("fasilitas_sarana_pendidikan")
            .insert(fasilitasValid)

          if (errFas) {
            console.error("Gagal menyimpan fasilitas baru:", errFas)
            errorFasilitas = true
          }
        }
      }

      if (
        editingSaranaId &&
        fotoFile &&
        existingFotoUrl &&
        existingFotoUrl !==
          hasilUpload.fotoUrl
      ) {
        await hapusFotoDariStorage(
          existingFotoUrl
        )
      }

      if (errorFasilitas) {
        alert("Data sekolah berhasil disimpan, namun sebagian atau seluruh sarana/fasilitas gagal disimpan.")
      } else {
        alert(
          editingSaranaId
            ? "Sarana pendidikan berhasil diperbarui!"
            : "Sarana pendidikan berhasil ditambahkan!"
        )
      }

      resetFormSarana()

      await fetchSarana(
        pendataanTerpilihId
      )
    } catch (simpanError) {
      console.error(
        "simpan sarana pendidikan error:",
        simpanError
      )

      if (pathFotoBaru) {
        await supabase.storage
          .from(BUCKET_FOTO)
          .remove([pathFotoBaru])
      }

      if (simpanError?.code === "23505") {
        alert(
          "Nama sarana tersebut sudah tersedia pada tahun pendataan yang dipilih."
        )
      } else {
        alert(
          `Gagal menyimpan sarana pendidikan: ${
            simpanError?.message ||
            "Terjadi kesalahan."
          }`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const mulaiEditSarana = async (item) => {
    setEditingSaranaId(item.id)
    setLoadingFasilitas(true)

    setFormSarana({
      nama_sarana:
        item.nama_sarana || "",

      tingkat_pendidikan:
        item.tingkat_pendidikan ||
        "PAUD",

      jenis_pengelolaan:
        item.jenis_pengelolaan || "",

      alamat:
        item.alamat || "",

      jumlah_siswa:
        item.jumlah_siswa?.toString() ||
        "0",

      jumlah_guru:
        item.jumlah_guru?.toString() ||
        "0",

      jumlah_staf:
        item.jumlah_staf?.toString() ||
        "0",

      status_operasional:
        item.status_operasional ||
        "aktif",

      nomor_kontak:
        item.nomor_kontak || "",

      lokasi_peta:
        item.lokasi_peta || "",

      keterangan:
        item.keterangan || "",

      urutan:
        item.urutan?.toString() ||
        "0",

      is_active:
        Boolean(item.is_active),
    })

    setExistingFotoUrl(
      item.foto_url || ""
    )

    setFotoFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    try {
      const { data: fasilitasData, error: fasilitasError } = await supabase
        .from("fasilitas_sarana_pendidikan")
        .select("*")
        .eq("sarana_pendidikan_id", item.id)
        .order("urutan", { ascending: true })
        .order("nama_fasilitas", { ascending: true })

      if (fasilitasError) {
        console.error("Gagal mengambil fasilitas:", fasilitasError)
        setFormFasilitasList([])
        setExistingFasilitasIds([])
      } else {
        const listFasilitas = (fasilitasData || []).map((f) => ({
          id: f.id,
          tempId: f.id,
          nama_fasilitas: f.nama_fasilitas || "",
          jumlah: (f.jumlah ?? 1).toString(),
          urutan: (f.urutan ?? 1).toString(),
          is_active: Boolean(f.is_active ?? true),
        }))
        setFormFasilitasList(listFasilitas)
        setExistingFasilitasIds((fasilitasData || []).map((f) => f.id))
      }
    } catch (err) {
      console.error("Error mengambil fasilitas sekolah:", err)
      setFormFasilitasList([])
      setExistingFasilitasIds([])
    } finally {
      setLoadingFasilitas(false)
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const hapusSarana = async (item) => {
    if (loading) {
      return
    }

    const session = await periksaSesi()

    if (!session) {
      return
    }

    const yakin = window.confirm(
      `Yakin ingin menghapus "${item.nama_sarana}"?`
    )

    if (!yakin) {
      return
    }

    setLoading(true)

    try {
      const {
        error: hapusError,
      } = await supabase
        .from("sarana_pendidikan")
        .delete()
        .eq("id", item.id)

      if (hapusError) {
        throw hapusError
      }

      if (item.foto_url) {
        await hapusFotoDariStorage(
          item.foto_url
        )
      }

      alert(
        "Sarana pendidikan berhasil dihapus."
      )

      if (
        editingSaranaId === item.id
      ) {
        resetFormSarana()
      }

      await fetchSarana(
        pendataanTerpilihId
      )
    } catch (hapusError) {
      console.error(
        "hapus sarana pendidikan error:",
        hapusError
      )

      alert(
        `Gagal menghapus sarana pendidikan: ${
          hapusError?.message ||
          "Terjadi kesalahan."
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)

    await keluarDariAdmin(
      "Logout error"
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4 sm:py-5 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="rounded-lg p-2 transition-colors hover:bg-white/60"
                title="Kembali ke Admin Panel"
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
                  Kelola Sarana Pendidikan
                </h1>

                <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                  Kelola pendataan tahunan dan daftar sekolah Nagari
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              Logout
            </button>
          </div>

          <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#b6a587]" />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          {/* Kolom pendataan */}
          <div className="space-y-5 xl:col-span-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900">
                {editingPendataanId
                  ? "Edit Pendataan"
                  : "Tambah Pendataan"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Satu pendataan digunakan untuk satu tahun.
              </p>

              <form
                onSubmit={simpanPendataan}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tahun Pendataan
                  </label>

                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    name="tahun_pendataan"
                    value={
                      formPendataan.tahun_pendataan
                    }
                    onChange={
                      ubahFormPendataan
                    }
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
                    value={
                      formPendataan.sumber_data
                    }
                    onChange={
                      ubahFormPendataan
                    }
                    placeholder="Contoh: Pendataan Nagari 2026"
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
                    value={
                      formPendataan.keterangan
                    }
                    onChange={
                      ubahFormPendataan
                    }
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status Publikasi
                  </label>

                  <select
                    name="status_publikasi"
                    value={
                      formPendataan.status_publikasi
                    }
                    onChange={
                      ubahFormPendataan
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
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
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${
                    formPendataan.status_publikasi ===
                    "dipublikasikan"
                      ? "cursor-pointer border-gray-300 bg-white"
                      : "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      formPendataan.is_active
                    }
                    onChange={
                      ubahFormPendataan
                    }
                    disabled={
                      formPendataan.status_publikasi !==
                      "dipublikasikan"
                    }
                  />

                  <span className="text-sm font-medium text-gray-700">
                    Tampilkan sebagai data aktif di Beranda
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] flex-1 rounded-lg bg-[#2c1b01] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2604] disabled:opacity-60"
                  >
                    {loading
                      ? "Menyimpan..."
                      : editingPendataanId
                        ? "Simpan Perubahan"
                        : "Tambah Pendataan"}
                  </button>

                  {editingPendataanId && (
                    <button
                      type="button"
                      onClick={
                        resetFormPendataan
                      }
                      className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Riwayat pendataan */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-gray-900">
                    Riwayat Pendataan
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Pilih tahun untuk mengelola sekolah.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fetchPendataan()
                  }
                  disabled={
                    loading ||
                    loadingPendataan
                  }
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              {loadingPendataan ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Memuat pendataan...
                </p>
              ) : pendataanList.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Belum ada tahun pendataan.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {pendataanList.map(
                    (item) => (
                      <article
                        key={item.id}
                        className={`rounded-lg border p-3 ${
                          item.id ===
                          pendataanTerpilihId
                            ? "border-[#6b4b1d] bg-[#f7f2e8]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setPendataanTerpilihId(
                              item.id
                            )
                          }
                          className="w-full text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-gray-900">
                              Tahun{" "}
                              {
                                item.tahun_pendataan
                              }
                            </strong>

                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                item.status_publikasi ===
                                "dipublikasikan"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.status_publikasi ===
                              "dipublikasikan"
                                ? "Dipublikasikan"
                                : "Draft"}
                            </span>

                            {item.is_active && (
                              <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                                Aktif
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-gray-600">
                            {
                              item.sumber_data
                            }
                          </p>
                        </button>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              mulaiEditPendataan(
                                item
                              )
                            }
                            className="flex-1 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              hapusPendataan(
                                item
                              )
                            }
                            disabled={loading}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Hapus
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Kolom sarana */}
          <div className="space-y-5 xl:col-span-8">
            {!pendataanTerpilih ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
                <h2 className="font-bold text-gray-900">
                  Belum ada pendataan yang dipilih
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Buat atau pilih tahun pendataan untuk menambahkan sekolah.
                </p>
              </div>
            ) : (
              <>
                {/* Ringkasan */}
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Pendataan Tahun{" "}
                        {
                          pendataanTerpilih.tahun_pendataan
                        }
                      </h2>

                      <p className="mt-1 text-sm text-gray-600">
                        Sumber:{" "}
                        <strong>
                          {
                            pendataanTerpilih.sumber_data
                          }
                        </strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f0e8db] px-3 py-1 text-xs font-semibold text-[#2c1b01]">
                        {
                          saranaList.length
                        }{" "}
                        sekolah
                      </span>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {formatAngka(
                          totalSiswa
                        )}{" "}
                        siswa
                      </span>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {formatAngka(
                          totalGuru
                        )}{" "}
                        guru
                      </span>

                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        {formatAngka(
                          totalStaf
                        )}{" "}
                        staf
                      </span>
                    </div>
                  </div>

                  {Object.keys(
                    ringkasanTingkat
                  ).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                      {Object.entries(
                        ringkasanTingkat
                      ).map(
                        ([
                          tingkat,
                          jumlah,
                        ]) => (
                          <span
                            key={tingkat}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                          >
                            <strong>
                              {tingkat}
                            </strong>
                            : {jumlah}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Form sarana */}
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingSaranaId
                      ? "Edit Sarana Pendidikan"
                      : "Tambah Sarana Pendidikan"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Setiap sekolah disimpan sebagai satu data tersendiri.
                  </p>

                  <form
                    onSubmit={simpanSarana}
                    className="mt-5 space-y-5"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Nama Sarana
                        </label>

                        <input
                          type="text"
                          name="nama_sarana"
                          value={
                            formSarana.nama_sarana
                          }
                          onChange={
                            ubahFormSarana
                          }
                          placeholder="Contoh: SD Negeri 01 Aia Manggih Barat"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Tingkat Pendidikan
                        </label>

                        <select
                          name="tingkat_pendidikan"
                          value={
                            formSarana.tingkat_pendidikan
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        >
                          {PILIHAN_TINGKAT.map(
                            (tingkat) => (
                              <option
                                key={tingkat}
                                value={tingkat}
                              >
                                {tingkat}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jenis Pengelolaan
                        </label>

                        <select
                          name="jenis_pengelolaan"
                          value={
                            formSarana.jenis_pengelolaan
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        >
                          <option value="">
                            Tidak dicantumkan
                          </option>

                          {PILIHAN_PENGELOLAAN.map(
                            (jenis) => (
                              <option
                                key={jenis}
                                value={jenis}
                              >
                                {jenis}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Kondisi/Status
                        </label>

                        <select
                          name="status_operasional"
                          value={
                            formSarana.status_operasional
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        >
                          {PILIHAN_STATUS_OPERASIONAL.map(
                            (status) => (
                              <option
                                key={
                                  status.value
                                }
                                value={
                                  status.value
                                }
                              >
                                {
                                  status.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Alamat
                      </label>

                      <textarea
                        name="alamat"
                        rows={3}
                        value={
                          formSarana.alamat
                        }
                        onChange={
                          ubahFormSarana
                        }
                        placeholder="Contoh: Jorong Padang Sarai..."
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jumlah Siswa
                        </label>

                        <input
                          type="number"
                          min="0"
                          name="jumlah_siswa"
                          value={
                            formSarana.jumlah_siswa
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jumlah Guru
                        </label>

                        <input
                          type="number"
                          min="0"
                          name="jumlah_guru"
                          value={
                            formSarana.jumlah_guru
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jumlah Staf
                        </label>

                        <input
                          type="number"
                          min="0"
                          name="jumlah_staf"
                          value={
                            formSarana.jumlah_staf
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Urutan Tampil
                        </label>

                        <input
                          type="number"
                          min="0"
                          name="urutan"
                          value={
                            formSarana.urutan
                          }
                          onChange={
                            ubahFormSarana
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Nomor Kontak
                        </label>

                        <input
                          type="text"
                          name="nomor_kontak"
                          value={
                            formSarana.nomor_kontak
                          }
                          onChange={
                            ubahFormSarana
                          }
                          placeholder="Contoh: 08xx-xxxx-xxxx"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Tautan Google Maps
                        </label>

                        <input
                          type="url"
                          name="lokasi_peta"
                          value={
                            formSarana.lokasi_peta
                          }
                          onChange={
                            ubahFormSarana
                          }
                          placeholder="https://maps.google.com/..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                        />
                      </div>
                    </div>

                    {/* Seksi Daftar Sarana Sekolah (Fasilitas) */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Daftar Sarana Sekolah
                          </h3>
                          <p className="text-xs text-gray-500">
                            Fasilitas pendukung seperti ruang kelas, laboratorium, perpustakaan, dll.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={tambahBarisFasilitas}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#2c1b01] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3a2604] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>+ Tambah Sarana</span>
                        </button>
                      </div>

                      <datalist id="saran-fasilitas-list">
                        {SARAN_FASILITAS.map((saran) => (
                          <option key={saran} value={saran} />
                        ))}
                      </datalist>

                      {loadingFasilitas ? (
                        <p className="py-4 text-center text-xs text-gray-500">
                          Memuat sarana sekolah...
                        </p>
                      ) : formFasilitasList.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                          <p className="text-xs text-gray-500">
                            Belum ada rincian sarana/fasilitas ditambahkan. Klik tombol "+ Tambah Sarana" untuk menambah.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formFasilitasList.map((item, index) => (
                            <div
                              key={item.tempId || item.id || index}
                              className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm"
                            >
                              <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                {index + 1}.
                              </span>

                              <div className="flex-1 min-w-[160px]">
                                <input
                                  type="text"
                                  list="saran-fasilitas-list"
                                  placeholder="Nama sarana (mis. Ruang Kelas)"
                                  value={item.nama_fasilitas}
                                  onChange={(e) =>
                                    ubahBarisFasilitas(index, "nama_fasilitas", e.target.value)
                                  }
                                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>

                              <div className="w-28 flex items-center gap-1">
                                <span className="text-xs text-gray-500">Jumlah:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.jumlah}
                                  onChange={(e) =>
                                    ubahBarisFasilitas(index, "jumlah", e.target.value)
                                  }
                                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => hapusBarisFasilitas(index)}
                                className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                                title="Hapus baris ini"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Foto Sekolah
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          (opsional, maksimal 2 MB)
                        </span>
                      </label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={pilihFoto}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#2c1b01] file:px-4 file:py-2 file:font-semibold file:text-white"
                      />

                      {previewFotoUrl && (
                        <div className="mt-3">
                          <img
                            src={
                              previewFotoUrl
                            }
                            alt="Pratinjau sarana pendidikan"
                            className="h-52 w-full rounded-lg border border-gray-200 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Keterangan
                      </label>

                      <textarea
                        name="keterangan"
                        rows={3}
                        value={
                          formSarana.keterangan
                        }
                        onChange={
                          ubahFormSarana
                        }
                        placeholder="Tambahkan informasi lain bila diperlukan..."
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-3">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={
                          formSarana.is_active
                        }
                        onChange={
                          ubahFormSarana
                        }
                      />

                      <span className="text-sm font-medium text-gray-700">
                        Aktifkan sarana ini untuk ditampilkan
                      </span>
                    </label>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={loading}
                        className="min-h-[44px] flex-1 rounded-lg bg-[#2c1b01] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2604] disabled:opacity-60"
                      >
                        {loading
                          ? "Menyimpan..."
                          : editingSaranaId
                            ? "Simpan Perubahan"
                            : "Tambah Sarana"}
                      </button>

                      {editingSaranaId && (
                        <button
                          type="button"
                          onClick={
                            resetFormSarana
                          }
                          className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Daftar sarana */}
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Daftar Sarana Pendidikan
                      </h2>

                      <p className="mt-1 text-xs text-gray-500">
                        {
                          saranaTersaring.length
                        }{" "}
                        dari{" "}
                        {
                          saranaList.length
                        }{" "}
                        data
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        fetchSarana(
                          pendataanTerpilihId
                        )
                      }
                      disabled={
                        loading ||
                        loadingSarana
                      }
                      className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                    >
                      Refresh
                    </button>
                  </div>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Cari nama, tingkat, alamat, atau status..."
                    className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                  />

                  {loadingSarana ? (
                    <p className="py-10 text-center text-sm text-gray-500">
                      Memuat sarana pendidikan...
                    </p>
                  ) : saranaTersaring.length ===
                    0 ? (
                    <p className="py-10 text-center text-sm text-gray-500">
                      Belum ada sarana pendidikan pada pendataan ini.
                    </p>
                  ) : (
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {saranaTersaring.map(
                        (item) => (
                          <article
                            key={item.id}
                            className={`overflow-hidden rounded-xl border ${
                              editingSaranaId ===
                              item.id
                                ? "border-yellow-400 bg-yellow-50/30"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            {item.foto_url ? (
                              <img
                                src={
                                  item.foto_url
                                }
                                alt={
                                  item.nama_sarana
                                }
                                className="h-44 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-32 items-center justify-center bg-gray-100 text-sm text-gray-400">
                                Belum ada foto
                              </div>
                            )}

                            <div className="p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#f0e8db] px-2.5 py-1 text-xs font-semibold text-[#2c1b01]">
                                  {
                                    item.tingkat_pendidikan
                                  }
                                </span>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    item.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {item.is_active
                                    ? "Aktif"
                                    : "Tidak Aktif"}
                                </span>

                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  {formatStatusOperasional(
                                    item.status_operasional
                                  )}
                                </span>
                              </div>

                              <h3 className="mt-3 text-lg font-bold text-gray-900">
                                {
                                  item.nama_sarana
                                }
                              </h3>

                              <p className="mt-1 text-xs text-gray-500">
                                {item.jenis_pengelolaan ||
                                  "Jenis pengelolaan tidak dicantumkan"}
                              </p>

                              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                                {
                                  item.alamat
                                }
                              </p>

                              <div className="mt-4 grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-blue-50 p-2.5 text-center">
                                  <p className="text-[11px] text-gray-500">
                                    Siswa
                                  </p>

                                  <p className="mt-0.5 font-bold text-blue-700">
                                    {formatAngka(
                                      item.jumlah_siswa
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-green-50 p-2.5 text-center">
                                  <p className="text-[11px] text-gray-500">
                                    Guru
                                  </p>

                                  <p className="mt-0.5 font-bold text-green-700">
                                    {formatAngka(
                                      item.jumlah_guru
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-purple-50 p-2.5 text-center">
                                  <p className="text-[11px] text-gray-500">
                                    Staf
                                  </p>

                                  <p className="mt-0.5 font-bold text-purple-700">
                                    {formatAngka(
                                      item.jumlah_staf
                                    )}
                                  </p>
                                </div>
                              </div>

                              {item.nomor_kontak && (
                                <p className="mt-3 text-sm text-gray-600">
                                  Kontak:{" "}
                                  <strong>
                                    {
                                      item.nomor_kontak
                                    }
                                  </strong>
                                </p>
                              )}

                              {item.lokasi_peta && (
                                <a
                                  href={
                                    item.lokasi_peta
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:underline"
                                >
                                  Buka lokasi peta
                                </a>
                              )}

                              {item.keterangan && (
                                <p className="mt-3 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                                  {
                                    item.keterangan
                                  }
                                </p>
                              )}

                              <p className="mt-3 text-xs text-gray-400">
                                Urutan tampil:{" "}
                                {
                                  item.urutan
                                }
                              </p>

                              <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    mulaiEditSarana(
                                      item
                                    )
                                  }
                                  className="flex-1 rounded-lg bg-yellow-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-yellow-600"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    hapusSarana(
                                      item
                                    )
                                  }
                                  disabled={
                                    loading
                                  }
                                  className="flex-1 rounded-lg bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}