"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

const BUCKET_FOTO = "foto-sarana-pendidikan"

const FORM_SARANA_AWAL = {
  nama_sarana: "",
  tingkat_pendidikan: "PAUD",
  jenis_pengelolaan: "",
  alamat: "",
  jumlah_siswa: "",
  jumlah_guru: "",
  jumlah_staf: "",
  status_operasional: "aktif",
  nomor_kontak: "",
  lokasi_peta: "",
  keterangan: "",
  urutan: "",
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

const SARAN_KEGIATAN = [
  "Pramuka",
  "Tahfiz",
  "Sepak Bola",
  "Bola Voli",
  "Seni Tari",
  "Paskibra",
  "PMR",
  "Drumband",
  "Rohani Islam",
  "English Club",
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

const URUTAN_TINGKAT_LOGIS = [
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
  { value: "aktif", label: "Aktif" },
  { value: "tidak_aktif", label: "Tidak Aktif" },
  { value: "dalam_pembangunan", label: "Dalam Pembangunan" },
  { value: "lainnya", label: "Lainnya" },
]

function keAngka(nilai) {
  const angka = Number(nilai)
  return Number.isFinite(angka) ? angka : 0
}

function formatAngka(nilai) {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function buatNamaFileAman(namaFile) {
  return String(namaFile || "foto")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
}

function ambilPathFotoDariUrl(fotoUrl) {
  if (!fotoUrl) return null
  const penanda = `/storage/v1/object/public/${BUCKET_FOTO}/`
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

async function hapusFotoDariStorage(fotoUrl) {
  const pathFoto = ambilPathFotoDariUrl(fotoUrl)
  if (!pathFoto) return
  const { error } = await supabase.storage.from(BUCKET_FOTO).remove([pathFoto])
  if (error) {
    console.error("Gagal menghapus foto dari Storage:", error)
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

export default function KelolaSaranaDetailAdmin() {
  const params = useParams()
  const pendataanId = Array.isArray(params?.pendataanId)
    ? params.pendataanId[0]
    : params?.pendataanId || ""

  const formRef = useRef(null)
  const fileInputRef = useRef(null)

  const [detailPendataan, setDetailPendataan] = useState(null)
  const [loadingPendataan, setLoadingPendataan] = useState(true)
  const [pendataanError, setPendataanError] = useState("")

  const [formSarana, setFormSarana] = useState(FORM_SARANA_AWAL)
  const [editingSaranaId, setEditingSaranaId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saranaList, setSaranaList] = useState([])

  const [formFasilitasList, setFormFasilitasList] = useState([])
  const [existingFasilitasIds, setExistingFasilitasIds] = useState([])
  const [loadingFasilitas, setLoadingFasilitas] = useState(false)

  const [formKegiatanList, setFormKegiatanList] = useState([])
  const [existingKegiatanIds, setExistingKegiatanIds] = useState([])
  const [loadingKegiatan, setLoadingKegiatan] = useState(false)

  const [fotoFile, setFotoFile] = useState(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState("")
  const [previewFotoUrl, setPreviewFotoUrl] = useState("")

  const [filterTingkat, setFilterTingkat] = useState("semua")
  const [loading, setLoading] = useState(false)
  const [loadingSarana, setLoadingSarana] = useState(true)

  const [pesanSukses, setPesanSukses] = useState(null)
  const [pesanError, setPesanError] = useState(null)
  const { showSuccess, showError } = useToast()
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

  const fetchDetailPendataan = async (id) => {
    if (!id) {
      setDetailPendataan(null)
      setPendataanError("ID Pendataan tidak valid.")
      setLoadingPendataan(false)
      return
    }

    setLoadingPendataan(true)
    setPendataanError("")

    const { data, error: fetchErr } = await supabase
      .from("pendataan_sarana_pendidikan")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr) {
      console.error("fetchDetailPendataan error:", fetchErr)
      setDetailPendataan(null)
      setPendataanError("Gagal membaca data pendataan.")
    } else if (!data) {
      setDetailPendataan(null)
      setPendataanError("Data pendataan tidak ditemukan atau sudah dihapus.")
    } else {
      setDetailPendataan(data)
    }

    setLoadingPendataan(false)
  }

  const fetchSarana = async (id) => {
    if (!id) {
      setSaranaList([])
      setLoadingSarana(false)
      return
    }

    setLoadingSarana(true)

    const session = await periksaSesi()
    if (!session) {
      setLoadingSarana(false)
      return
    }

    // Newest first based on created_at DESC
    const { data, error: fetchError } = await supabase
      .from("sarana_pendidikan")
      .select("*")
      .eq("pendataan_id", id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("fetch sarana error:", fetchError)
      setPesanError(fetchError.message || "Gagal memuat daftar sarana pendidikan.")
      setSaranaList([])
    } else {
      setSaranaList(data || [])
    }
    setLoadingSarana(false)
  }

  useEffect(() => {
    if (pendataanId) {
      fetchDetailPendataan(pendataanId)
      fetchSarana(pendataanId)
    } else {
      setLoadingPendataan(false)
      setPendataanError("ID Pendataan tidak ditemukan pada URL.")
    }
  }, [pendataanId])

  // Auto dismiss success toast message after 4000ms
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  useEffect(() => {
    if (!fotoFile) {
      setPreviewFotoUrl(existingFotoUrl || "")
      return
    }

    const objectUrl = URL.createObjectURL(fotoFile)
    setPreviewFotoUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [fotoFile, existingFotoUrl])

  // Logout otomatis apabila admin tidak aktif selama 5 menit.
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

  // Filtering based on Tingkat Pendidikan
  const saranaTersaring = useMemo(() => {
    if (!filterTingkat || filterTingkat === "semua") {
      return saranaList
    }
    return saranaList.filter((item) => item.tingkat_pendidikan === filterTingkat)
  }, [saranaList, filterTingkat])

  // Count per Tingkat Pendidikan dynamically
  const jumlahPerTingkat = useMemo(() => {
    const counts = {}
    saranaList.forEach((item) => {
      const tingkat = item.tingkat_pendidikan || "Lainnya"
      counts[tingkat] = (counts[tingkat] || 0) + 1
    })
    return counts
  }, [saranaList])

  // Total Siswa, Guru, Staf across all schools in period
  const totalSiswa = useMemo(() => {
    return saranaList.reduce((sum, item) => sum + keAngka(item.jumlah_siswa), 0)
  }, [saranaList])

  const totalGuru = useMemo(() => {
    return saranaList.reduce((sum, item) => sum + keAngka(item.jumlah_guru), 0)
  }, [saranaList])

  const totalStaf = useMemo(() => {
    return saranaList.reduce((sum, item) => sum + keAngka(item.jumlah_staf), 0)
  }, [saranaList])

  const ubahFormSarana = (event) => {
    const { name, value, type, checked } = event.target
    setFormSarana((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const resetFormSarana = () => {
    setFormSarana({ ...FORM_SARANA_AWAL })
    setEditingSaranaId(null)
    setFormFasilitasList([])
    setExistingFasilitasIds([])
    setLoadingFasilitas(false)
    setFormKegiatanList([])
    setExistingKegiatanIds([])
    setLoadingKegiatan(false)
    setFotoFile(null)
    setExistingFotoUrl("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleOpenTambah = () => {
    resetFormSarana()
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleBatalForm = () => {
    resetFormSarana()
    setIsFormOpen(false)
  }

  const tambahBarisFasilitas = () => {
    const tempId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
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
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const hapusBarisFasilitas = (index) => {
    setFormFasilitasList((prev) => prev.filter((_, i) => i !== index))
  }

  const tambahBarisKegiatan = () => {
    const tempId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `temp-keg-${Date.now()}-${Math.random().toString(36).slice(2)}`

    setFormKegiatanList((prev) => [
      ...prev,
      {
        tempId,
        nama_kegiatan: "",
        keterangan: "",
        urutan: (prev.length + 1).toString(),
        is_active: true,
      },
    ])
  }

  const ubahBarisKegiatan = (index, field, value) => {
    setFormKegiatanList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const hapusBarisKegiatan = (index) => {
    setFormKegiatanList((prev) => prev.filter((_, i) => i !== index))
  }

  const pilihFoto = (event) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      setFotoFile(null)
      return
    }

    const tipeYangDiizinkan = ["image/jpeg", "image/png", "image/webp"]
    if (!tipeYangDiizinkan.includes(file.type)) {
      setPesanError("Format foto harus JPG, PNG, atau WEBP.")
      event.target.value = ""
      setFotoFile(null)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setPesanError("Ukuran foto maksimal 2 MB.")
      event.target.value = ""
      setFotoFile(null)
      return
    }

    setFotoFile(file)
  }

  const fetchRincianFasilitasDanKegiatan = async (saranaId) => {
    setLoadingFasilitas(true)
    setLoadingKegiatan(true)

    try {
      const { data: dataFas } = await supabase
        .from("fasilitas_sarana_pendidikan")
        .select("*")
        .eq("sarana_pendidikan_id", saranaId)
        .order("urutan", { ascending: true })

      if (dataFas && dataFas.length > 0) {
        setExistingFasilitasIds(dataFas.map((f) => f.id))
        setFormFasilitasList(
          dataFas.map((f) => ({
            id: f.id,
            nama_fasilitas: f.nama_fasilitas || "",
            jumlah: (f.jumlah ?? 1).toString(),
            urutan: (f.urutan ?? 0).toString(),
            is_active: Boolean(f.is_active ?? true),
          }))
        )
      } else {
        setExistingFasilitasIds([])
        setFormFasilitasList([])
      }

      const { data: dataKeg } = await supabase
        .from("kegiatan_sarana_pendidikan")
        .select("*")
        .eq("sarana_pendidikan_id", saranaId)
        .order("urutan", { ascending: true })

      if (dataKeg && dataKeg.length > 0) {
        setExistingKegiatanIds(dataKeg.map((k) => k.id))
        setFormKegiatanList(
          dataKeg.map((k) => ({
            id: k.id,
            nama_kegiatan: k.nama_kegiatan || "",
            keterangan: k.keterangan || "",
            urutan: (k.urutan ?? 0).toString(),
            is_active: Boolean(k.is_active ?? true),
          }))
        )
      } else {
        setExistingKegiatanIds([])
        setFormKegiatanList([])
      }
    } catch (err) {
      console.error("fetchRincianFasilitasDanKegiatan error:", err)
    } finally {
      setLoadingFasilitas(false)
      setLoadingKegiatan(false)
    }
  }

  const mulaiEditSekolah = (item) => {
    setPesanSukses(null)
    setPesanError(null)

    setEditingSaranaId(item.id)
    setFormSarana({
      nama_sarana: item.nama_sarana || "",
      tingkat_pendidikan: item.tingkat_pendidikan || "PAUD",
      jenis_pengelolaan: item.jenis_pengelolaan || "",
      alamat: item.alamat || "",
      jumlah_siswa: (item.jumlah_siswa ?? 0).toString(),
      jumlah_guru: (item.jumlah_guru ?? 0).toString(),
      jumlah_staf: (item.jumlah_staf ?? 0).toString(),
      status_operasional: item.status_operasional || "aktif",
      nomor_kontak: item.nomor_kontak || "",
      lokasi_peta: item.lokasi_peta || "",
      keterangan: item.keterangan || "",
      urutan: (item.urutan ?? 0).toString(),
      is_active: Boolean(item.is_active ?? true),
    })

    setFotoFile(null)
    setExistingFotoUrl(item.foto_url || "")
    setPreviewFotoUrl(item.foto_url || "")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    fetchRincianFasilitasDanKegiatan(item.id)
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const uploadFoto = async (pId) => {
    if (!fotoFile) {
      return {
        fotoUrl: existingFotoUrl || null,
        pathBaru: null,
      }
    }

    const namaAman = buatNamaFileAman(fotoFile.name)
    const kodeUnik =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    const pathFoto = `${pId}/${Date.now()}-${kodeUnik}-${namaAman}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FOTO)
      .upload(pathFoto, fotoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: fotoFile.type,
      })

    if (uploadError) {
      throw new Error(`Gagal mengunggah foto: ${uploadError.message}`)
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_FOTO)
      .getPublicUrl(pathFoto)

    return {
      fotoUrl: publicData?.publicUrl || null,
      pathBaru: pathFoto,
    }
  }

  const simpanSarana = async (event) => {
    event.preventDefault()
    if (loading) return

    setPesanSukses(null)
    setPesanError(null)

    if (!detailPendataan || !pendataanId) {
      setPesanError("Pendataan tidak valid.")
      return
    }

    if (!formSarana.nama_sarana.trim()) {
      setPesanError("Nama sarana / sekolah wajib diisi.")
      return
    }

    if (!formSarana.alamat.trim()) {
      setPesanError("Alamat wajib diisi.")
      return
    }

    const jumlahSiswa = keAngka(formSarana.jumlah_siswa)
    const jumlahGuru = keAngka(formSarana.jumlah_guru)
    const jumlahStaf = keAngka(formSarana.jumlah_staf)
    const urutan = keAngka(formSarana.urutan)

    if (jumlahSiswa < 0 || jumlahGuru < 0 || jumlahStaf < 0 || urutan < 0) {
      setPesanError("Jumlah siswa, guru, dan staf tidak boleh kurang dari nol.")
      return
    }

    // Validasi Fasilitas (Cek Duplikat Nama)
    if (editingSaranaId) {
      const namaMap = new Set()
      for (let i = 0; i < formFasilitasList.length; i++) {
        const itemFas = formFasilitasList[i]
        const namaTrim = (itemFas.nama_fasilitas || "").trim().toLowerCase()
        const jml = keAngka(itemFas.jumlah)

        if (namaTrim.length > 0 && jml >= 1) {
          if (namaMap.has(namaTrim)) {
            setPesanError(`Nama sarana/fasilitas "${itemFas.nama_fasilitas.trim()}" ditulis lebih dari satu kali. Mohon gabungkan nama duplikat.`)
            return
          }
          namaMap.add(namaTrim)
        }
      }

      // Validasi Kegiatan (Cek Nama Terisi & Duplikat)
      const namaKegiatanMap = new Set()
      for (let i = 0; i < formKegiatanList.length; i++) {
        const itemKeg = formKegiatanList[i]
        const namaTrim = (itemKeg.nama_kegiatan || "").trim()

        if (!namaTrim) {
          setPesanError(`Nama kegiatan pada baris ke-${i + 1} wajib diisi.`)
          return
        }

        const namaLower = namaTrim.toLowerCase()
        if (namaKegiatanMap.has(namaLower)) {
          setPesanError(`Nama kegiatan "${namaTrim}" ditulis lebih dari satu kali. Mohon gabungkan nama duplikat.`)
          return
        }
        namaKegiatanMap.add(namaLower)
      }
    }

    if (formSarana.lokasi_peta.trim()) {
      try {
        const url = new URL(formSarana.lokasi_peta.trim())
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error()
        }
      } catch {
        setPesanError("Tautan lokasi peta harus berupa URL yang valid diawali dengan https://")
        return
      }
    }

    setLoading(true)

    const session = await periksaSesi()
    if (!session) {
      setLoading(false)
      return
    }

    let pathFotoBaru = null

    try {
      const hasilUpload = await uploadFoto(pendataanId)
      pathFotoBaru = hasilUpload.pathBaru

      const dataSarana = {
        pendataan_id: pendataanId,
        nama_sarana: formSarana.nama_sarana.trim(),
        tingkat_pendidikan: formSarana.tingkat_pendidikan,
        jenis_pengelolaan: formSarana.jenis_pengelolaan || null,
        alamat: formSarana.alamat.trim(),
        jumlah_siswa: jumlahSiswa,
        jumlah_guru: jumlahGuru,
        jumlah_staf: jumlahStaf,
        status_operasional: formSarana.status_operasional || "aktif",
        nomor_kontak: formSarana.nomor_kontak.trim() || null,
        lokasi_peta: formSarana.lokasi_peta.trim() || null,
        foto_url: hasilUpload.fotoUrl,
        keterangan: formSarana.keterangan.trim() || null,
        urutan: urutan,
        is_active: Boolean(formSarana.is_active ?? true),
      }

      let activeSaranaId = editingSaranaId

      if (editingSaranaId) {
        const { error: updateError } = await supabase
          .from("sarana_pendidikan")
          .update(dataSarana)
          .eq("id", editingSaranaId)

        if (updateError) throw updateError

        if (fotoFile && existingFotoUrl && existingFotoUrl !== hasilUpload.fotoUrl) {
          await hapusFotoDariStorage(existingFotoUrl)
        }
      } else {
        const { data: saranaBaru, error: insertError } = await supabase
          .from("sarana_pendidikan")
          .insert([dataSarana])
          .select("id")
          .single()

        if (insertError) throw insertError
        activeSaranaId = saranaBaru.id
      }

      // Sync 2 child tables (Fasilitas & Kegiatan) if editing
      if (activeSaranaId && editingSaranaId) {
        // 1. Fasilitas
        const fasValid = formFasilitasList
          .map((f, idx) => ({
            id: f.id || null,
            sarana_pendidikan_id: activeSaranaId,
            nama_fasilitas: (f.nama_fasilitas || "").trim(),
            jumlah: keAngka(f.jumlah),
            urutan: idx + 1,
            is_active: Boolean(f.is_active ?? true),
          }))
          .filter((f) => f.nama_fasilitas.length > 0 && f.jumlah >= 1)

        const currentFasIds = fasValid.map((f) => f.id).filter(Boolean)
        const deletedFasIds = existingFasilitasIds.filter((id) => !currentFasIds.includes(id))

        if (deletedFasIds.length > 0) {
          await supabase.from("fasilitas_sarana_pendidikan").delete().in("id", deletedFasIds)
        }

        for (const fasItem of fasValid) {
          if (fasItem.id) {
            await supabase
              .from("fasilitas_sarana_pendidikan")
              .update({
                nama_fasilitas: fasItem.nama_fasilitas,
                jumlah: fasItem.jumlah,
                urutan: fasItem.urutan,
                is_active: fasItem.is_active,
              })
              .eq("id", fasItem.id)
          } else {
            await supabase.from("fasilitas_sarana_pendidikan").insert({
              sarana_pendidikan_id: activeSaranaId,
              nama_fasilitas: fasItem.nama_fasilitas,
              jumlah: fasItem.jumlah,
              urutan: fasItem.urutan,
              is_active: fasItem.is_active,
            })
          }
        }

        // 2. Kegiatan
        const kegValid = formKegiatanList
          .map((k, idx) => ({
            id: k.id || null,
            sarana_pendidikan_id: activeSaranaId,
            nama_kegiatan: (k.nama_kegiatan || "").trim(),
            keterangan: (k.keterangan || "").trim() || null,
            urutan: idx + 1,
            is_active: Boolean(k.is_active ?? true),
          }))
          .filter((k) => k.nama_kegiatan.length > 0)

        const currentKegIds = kegValid.map((k) => k.id).filter(Boolean)
        const deletedKegIds = existingKegiatanIds.filter((id) => !currentKegIds.includes(id))

        if (deletedKegIds.length > 0) {
          await supabase.from("kegiatan_sarana_pendidikan").delete().in("id", deletedKegIds)
        }

        for (const kegItem of kegValid) {
          if (kegItem.id) {
            await supabase
              .from("kegiatan_sarana_pendidikan")
              .update({
                nama_kegiatan: kegItem.nama_kegiatan,
                keterangan: kegItem.keterangan,
                urutan: kegItem.urutan,
                is_active: kegItem.is_active,
              })
              .eq("id", kegItem.id)
          } else {
            await supabase.from("kegiatan_sarana_pendidikan").insert({
              sarana_pendidikan_id: activeSaranaId,
              nama_kegiatan: kegItem.nama_kegiatan,
              keterangan: kegItem.keterangan,
              urutan: kegItem.urutan,
              is_active: kegItem.is_active,
            })
          }
        }
      }

      setPesanSukses(
        editingSaranaId
          ? "Data sarana pendidikan berhasil diperbarui."
          : "Data sarana pendidikan berhasil ditambahkan."
      )

      handleBatalForm()
      await fetchSarana(pendataanId)
    } catch (simpanErr) {
      console.error("simpan sarana error:", simpanErr)
      if (pathFotoBaru) {
        const { error: cleanupErr } = await supabase.storage
          .from(BUCKET_FOTO)
          .remove([pathFotoBaru])
        if (cleanupErr) {
          console.error("Gagal membersihkan foto baru setelah simpan error:", cleanupErr)
        }
      }
      setPesanError(`Gagal menyimpan sarana pendidikan: ${simpanErr?.message || "Terjadi kesalahan."}`)
    } finally {
      setLoading(false)
    }
  }

  const hapusSekolah = (item) => {
    if (loading) return
    setDeleteTarget(item)
  }

  const executeHapusSekolah = async (item) => {
    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      // 1. Hapus child records
      await supabase.from("fasilitas_sarana_pendidikan").delete().eq("sarana_pendidikan_id", item.id)
      await supabase.from("kegiatan_sarana_pendidikan").delete().eq("sarana_pendidikan_id", item.id)

      // 2. Hapus foto jika ada
      if (item.foto_url) {
        await hapusFotoDariStorage(item.foto_url)
      }

      // 3. Hapus record utama
      const { error: hapusErr } = await supabase
        .from("sarana_pendidikan")
        .delete()
        .eq("id", item.id)

      if (hapusErr) throw hapusErr

      const msg = `Sarana pendidikan "${item.nama_sarana}" berhasil dihapus.`
      setPesanSukses(msg)
      showSuccess(msg)

      if (editingSaranaId === item.id) {
        handleBatalForm()
      }

      await fetchSarana(pendataanId)
    } catch (hapusErr) {
      console.error("hapus sekolah error:", hapusErr)
      const msg = `Gagal menghapus sarana pendidikan: ${hapusErr?.message || "Terjadi kesalahan."}`
      setPesanError(msg)
      showError(msg)
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
              href="/admin/sarana-pendidikan"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Riwayat Pendataan Sarana Pendidikan"
              aria-label="Kembali ke Riwayat Pendataan Sarana Pendidikan"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Kelola Sekolah Sarana Pendidikan
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola sekolah, fasilitas, dan kegiatan untuk periode pendataan terpilih.
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
                Tambah Sarana Pendidikan
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

        {/* Kondisi Jika Pendataan Tidak Ditemukan / Error */}
        {loadingPendataan ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
            <p className="text-sm font-medium text-gray-600">Memuat detail periode pendataan sarana pendidikan...</p>
          </div>
        ) : pendataanError || !detailPendataan ? (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Periode Pendataan Pendidikan Tidak Ditemukan
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {pendataanError || "Data pendataan sarana pendidikan tidak tersedia atau telah dihapus."}
            </p>
            <Link
              href="/admin/sarana-pendidikan"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2c1b01] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a2604] transition-colors"
            >
              <span>← Kembali ke Riwayat Pendataan</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Card Ringkasan Periode Sederhana */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#2c1b01]">
                    Pendataan Tahun {detailPendataan.tahun_pendataan}
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
                    Sumber: <strong className="text-gray-900">{detailPendataan.sumber_data}</strong>
                  </p>
                </div>

                {/* 3 Box Statistik Sejajar */}
                <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                  <div className="rounded-xl border border-[#2c1b01]/10 bg-[#f7f2e8]/80 px-4 py-2.5 text-center min-w-[90px]">
                    <span className="block text-base font-bold text-[#2c1b01]">
                      {formatAngka(totalSiswa)}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600">Siswa</span>
                  </div>
                  <div className="rounded-xl border border-[#2c1b01]/10 bg-[#f7f2e8]/80 px-4 py-2.5 text-center min-w-[90px]">
                    <span className="block text-base font-bold text-[#2c1b01]">
                      {formatAngka(totalGuru)}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600">Guru</span>
                  </div>
                  <div className="rounded-xl border border-[#2c1b01]/10 bg-[#f7f2e8]/80 px-4 py-2.5 text-center min-w-[90px]">
                    <span className="block text-base font-bold text-[#2c1b01]">
                      {formatAngka(totalStaf)}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600">Staf</span>
                  </div>
                </div>
              </div>

              {/* Jumlah Sarana per Tingkat Pendidikan */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-[#2c1b01] mb-2.5">
                  Jumlah Sarana per Tingkat Pendidikan:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {URUTAN_TINGKAT_LOGIS.map((tingkat) => {
                    const count = jumlahPerTingkat[tingkat] || 0
                    if (count === 0) return null
                    return (
                      <span
                        key={tingkat}
                        className="inline-flex items-center rounded-lg bg-[#f7f2e8] px-3 py-1 text-xs font-semibold text-[#2c1b01] border border-[#2c1b01]/10"
                      >
                        {tingkat}: <strong className="ml-1 text-gray-900">{count}</strong>
                      </span>
                    )
                  })}
                  {Object.keys(jumlahPerTingkat).every((t) => (jumlahPerTingkat[t] || 0) === 0) && (
                    <span className="text-xs text-gray-500 italic">
                      Belum ada data sarana pendidikan pada periode ini.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 1: Form Tambah / Edit Sarana Pendidikan (Krem Header, Body Putih) */}
            {isFormOpen && (
              <div ref={formRef} id="form-sarana-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Header Krem Section */}
                <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-[#2c1b01]">
                    {editingSaranaId ? "Edit Sarana Pendidikan" : "Tambah Sarana Pendidikan"}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {editingSaranaId
                      ? "Ubah data sarana pendidikan pada periode pendataan ini."
                      : "Tambahkan data sarana pendidikan pada periode pendataan ini."}
                  </p>
                </div>

                {/* Body Form Putih */}
                <form onSubmit={simpanSarana} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nama Sarana / Sekolah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nama_sarana"
                        value={formSarana.nama_sarana}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="Contoh: SDN 01 Aia Manggih / TK Pembina"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tingkat Pendidikan <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="tingkat_pendidikan"
                        value={formSarana.tingkat_pendidikan}
                        onChange={ubahFormSarana}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      >
                        {PILIHAN_TINGKAT.map((tingkat) => (
                          <option key={tingkat} value={tingkat}>
                            {tingkat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Jenis Pengelolaan <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                      </label>
                      <select
                        name="jenis_pengelolaan"
                        value={formSarana.jenis_pengelolaan}
                        onChange={ubahFormSarana}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      >
                        <option value="">Pilih Jenis Pengelolaan</option>
                        {PILIHAN_PENGELOLAAN.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Alamat Sekolah <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="alamat"
                      rows={2}
                      value={formSarana.alamat}
                      onChange={ubahFormSarana}
                      onFocus={(e) => e.currentTarget.select()}
                      placeholder="Contoh: Jorong Padang Sarai, Nagari Aia Manggih Barat..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white resize-y"
                      required
                    />
                  </div>

                  {/* Stat Counters: Siswa, Guru, Staf */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Jumlah Siswa
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="jumlah_siswa"
                        value={formSarana.jumlah_siswa}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Jumlah Guru
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="jumlah_guru"
                        value={formSarana.jumlah_guru}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Jumlah Staf / Tendik
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="jumlah_staf"
                        value={formSarana.jumlah_staf}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nomor Kontak <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        name="nomor_kontak"
                        value={formSarana.nomor_kontak}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tautan Google Maps <span className="text-xs font-normal text-gray-500">(Wajib HTTPS, Opsional)</span>
                      </label>
                      <input
                        type="url"
                        name="lokasi_peta"
                        value={formSarana.lokasi_peta}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="https://maps.google.com/..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      />
                    </div>
                  </div>

                  {/* SUBSECTION: RINCIAN FASILITAS & KEGIATAN */}
                  {!editingSaranaId ? (
                    <div className="rounded-xl border border-dashed border-amber-300 bg-[#f7f2e8]/60 p-4 text-center">
                      <p className="text-xs font-bold text-[#2c1b01]">
                        Rincian Fasilitas & Kegiatan Ekstrakurikuler
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        Simpan data sarana pendidikan terlebih dahulu sebelum mengelola rincian Fasilitas dan Kegiatan Ekstrakurikuler.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-2">
                      {/* 1. Fasilitas Sekolah */}
                      <div className="rounded-xl border border-gray-200 bg-[#f7f2e8]/40 p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#2c1b01]">
                              Fasilitas & Sarana Sekolah
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Ruang kelas, perpustakaan, UKS, laboratorium, lapangan, dll.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={tambahBarisFasilitas}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ Tambah Fasilitas</span>
                          </button>
                        </div>

                        <datalist id="saran-fasilitas-list">
                          {SARAN_FASILITAS.map((saran) => (
                            <option key={saran} value={saran} />
                          ))}
                        </datalist>

                        {loadingFasilitas ? (
                          <p className="py-3 text-center text-xs text-gray-500">Memuat fasilitas...</p>
                        ) : formFasilitasList.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-center">
                            <p className="text-xs text-gray-500">
                              Belum ada fasilitas. Klik &quot;+ Tambah Fasilitas&quot; di atas.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {formFasilitasList.map((item, index) => (
                              <div
                                key={item.tempId || item.id || index}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs"
                              >
                                <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                  {index + 1}.
                                </span>
                                <div className="flex-1 min-w-[160px]">
                                  <input
                                    type="text"
                                    list="saran-fasilitas-list"
                                    placeholder="Nama fasilitas (mis. Ruang Kelas)"
                                    value={item.nama_fasilitas}
                                    onChange={(e) => ubahBarisFasilitas(index, "nama_fasilitas", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <div className="w-28 flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Jumlah:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.jumlah}
                                    onChange={(e) => ubahBarisFasilitas(index, "jumlah", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => hapusBarisFasilitas(index)}
                                  className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Hapus baris"
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

                      {/* 2. Kegiatan / Ekstrakurikuler */}
                      <div className="rounded-xl border border-gray-200 bg-[#f7f2e8]/40 p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#2c1b01]">
                              Kegiatan & Ekstrakurikuler
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Pramuka, Tahfiz, Sepak Bola, Seni Tari, dll.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={tambahBarisKegiatan}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ Tambah Kegiatan</span>
                          </button>
                        </div>

                        <datalist id="saran-kegiatan-list">
                          {SARAN_KEGIATAN.map((saran) => (
                            <option key={saran} value={saran} />
                          ))}
                        </datalist>

                        {loadingKegiatan ? (
                          <p className="py-3 text-center text-xs text-gray-500">Memuat kegiatan...</p>
                        ) : formKegiatanList.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-center">
                            <p className="text-xs text-gray-500">
                              Belum ada kegiatan. Klik &quot;+ Tambah Kegiatan&quot; di atas.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {formKegiatanList.map((item, index) => (
                              <div
                                key={item.tempId || item.id || index}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs"
                              >
                                <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                  {index + 1}.
                                </span>
                                <div className="flex-1 min-w-[160px]">
                                  <input
                                    type="text"
                                    list="saran-kegiatan-list"
                                    placeholder="Nama kegiatan (mis. Pramuka)"
                                    value={item.nama_kegiatan}
                                    onChange={(e) => ubahBarisKegiatan(index, "nama_kegiatan", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <div className="flex-1 min-w-[160px]">
                                  <input
                                    type="text"
                                    placeholder="Keterangan opsional"
                                    value={item.keterangan || ""}
                                    onChange={(e) => ubahBarisKegiatan(index, "keterangan", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => hapusBarisKegiatan(index)}
                                  className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Hapus baris"
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
                    </div>
                  )}

                  {/* Foto Sarana */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Foto Sarana / Sekolah <span className="text-xs font-normal text-gray-500">(Opsional, JPG/PNG/WEBP, max 2 MB)</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={pilihFoto}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white file:mr-3 file:rounded-md file:border-0 file:bg-[#2c1b01] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                    />
                    {previewFotoUrl && (
                      <div className="mt-3">
                        <img
                          src={previewFotoUrl}
                          alt="Pratinjau sarana pendidikan"
                          className="h-48 w-full max-w-xs rounded-xl border border-gray-200 object-cover shadow-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Keterangan */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Keterangan <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                    </label>
                    <textarea
                      name="keterangan"
                      rows={3}
                      value={formSarana.keterangan}
                      onChange={ubahFormSarana}
                      placeholder="Catatan tambahan mengenai sarana pendidikan ini..."
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
                      ) : editingSaranaId ? (
                        <span>Simpan Perubahan</span>
                      ) : (
                        <span>Tambah Sarana Pendidikan</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION 2: Tabel Daftar Sarana Pendidikan (Filter Tingkat Pendidikan) */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#2c1b01]">
                    Daftar Sarana Pendidikan
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Menampilkan {saranaTersaring.length} dari {saranaList.length} data sarana pendidikan
                  </p>
                </div>

                <div className="w-full sm:w-64">
                  <select
                    value={filterTingkat}
                    onChange={(e) => setFilterTingkat(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white cursor-pointer"
                  >
                    <option value="semua">Semua Tingkat Pendidikan</option>
                    {PILIHAN_TINGKAT.map((tingkat) => (
                      <option key={tingkat} value={tingkat}>
                        {tingkat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingSarana ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
                  <p className="text-sm font-medium">Memuat sarana pendidikan...</p>
                </div>
              ) : saranaTersaring.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-base font-semibold text-gray-700">Belum Ada Sarana Pendidikan</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {filterTingkat !== "semua"
                      ? "Tidak ada data sarana pendidikan yang cocok dengan filter tingkat pendidikan pilihan."
                      : 'Gunakan tombol "Tambah Sarana Pendidikan" untuk mendaftarkan data sarana baru.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-bold w-[40%]">Nama Sarana</th>
                        <th scope="col" className="px-6 py-4 font-bold w-[25%]">Tingkat</th>
                        <th scope="col" className="px-6 py-4 font-bold w-[20%]">Pengelolaan</th>
                        <th scope="col" className="px-6 py-4 font-bold text-right w-[15%]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-sm">
                      {saranaTersaring.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            editingSaranaId === item.id ? "bg-[#f0e8db]/30" : ""
                          }`}
                        >
                          <td className="py-4 px-6 font-bold text-gray-900">
                            {item.nama_sarana}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center rounded-full bg-[#f7f2e8] px-2.5 py-1 text-xs font-semibold text-[#2c1b01] border border-[#2c1b01]/10">
                              {item.tingkat_pendidikan}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs font-medium text-gray-700">
                            {item.jenis_pengelolaan || "-"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Tombol 1: Edit */}
                              <button
                                type="button"
                                onClick={() => mulaiEditSekolah(item)}
                                disabled={loading}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                              >
                                Edit
                              </button>

                              {/* Tombol 2: Hapus */}
                              <button
                                type="button"
                                onClick={() => hapusSekolah(item)}
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
          </>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Sarana Pendidikan?"
        message={
          <>
            Apakah Anda yakin ingin menghapus <strong>&quot;{deleteTarget?.nama_sarana}&quot;</strong>?
            <br />
            Seluruh rincian fasilitas, kegiatan, dan foto terkait akan dihapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={loading}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeHapusSekolah(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
