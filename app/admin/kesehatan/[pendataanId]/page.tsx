"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_FOTO_KESEHATAN,
  PILIHAN_JENIS_SARANA,
  JenisSlugKesehatan,
  PendataanKesehatan,
  SaranaKesehatan,
  getLabelJenisSarana,
} from "@/lib/kesehatan"
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

const SARAN_FASILITAS = [
  "Ruang Periksa",
  "Ruang Tindakan / UGD",
  "Kamar Mandi / WC",
  "Apotek / Ruang Obat",
  "Laboratorium",
  "Musala",
  "Ruang Tunggu",
  "Peralatan Imunisasi / Cold Chain",
  "Ambulans / Kendaraan Operasional",
  "Timbangan & Alat Ukur Balita",
]

const SARAN_TENAGA = [
  "Dokter Umum",
  "Dokter Gigi",
  "Bidan",
  "Perawat",
  "Apoteker / Asisten Apoteker",
  "Kader Posyandu",
  "Tenaga Gizi / Nutrisionis",
  "Sanitarian / Kesehatan Lingkungan",
  "Tenaga Administrasi",
]

const SARAN_INDIKATOR = [
  "Jumlah Posyandu Binaan",
  "Jam Operasional",
  "Layanan Unggulan",
  "Cakupan Imunisasi Dasar",
  "Status Akreditasi",
]

function keAngka(nilai: any): number {
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

export default function KelolaSaranaKesehatanDetailAdmin() {
  const params = useParams()
  const pendataanId = Array.isArray(params?.pendataanId)
    ? params.pendataanId[0]
    : params?.pendataanId || ""

  const formRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [detailPendataan, setDetailPendataan] = useState<PendataanKesehatan | null>(null)
  const [loadingPendataan, setLoadingPendataan] = useState(true)
  const [pendataanError, setPendataanError] = useState("")

  const [formSarana, setFormSarana] = useState({
    nama_sarana: "",
    jenis_slug: "posyandu" as JenisSlugKesehatan,
    alamat: "",
    status_operasional: "aktif" as "aktif" | "tidak_aktif" | "dalam_pembangunan" | "lainnya",
    nomor_kontak: "",
    tautan_peta: "",
    keterangan: "",
    is_active: true,
  })
  const [editingSaranaId, setEditingSaranaId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saranaList, setSaranaList] = useState<SaranaKesehatan[]>([])

  // State Table Detail 1: Fasilitas
  const [formFasilitasList, setFormFasilitasList] = useState<any[]>([])
  const [existingFasilitasIds, setExistingFasilitasIds] = useState<string[]>([])
  const [loadingFasilitas, setLoadingFasilitas] = useState(false)

  // State Table Detail 2: Tenaga Kesehatan
  const [formTenagaList, setFormTenagaList] = useState<any[]>([])
  const [existingTenagaIds, setExistingTenagaIds] = useState<string[]>([])
  const [loadingTenaga, setLoadingTenaga] = useState(false)

  // State Table Detail 3: Indikator Tambahan
  const [formIndikatorList, setFormIndikatorList] = useState<any[]>([])
  const [existingIndikatorIds, setExistingIndikatorIds] = useState<string[]>([])
  const [loadingIndikator, setLoadingIndikator] = useState(false)

  // State Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState("")
  const [existingStoragePath, setExistingStoragePath] = useState("")
  const [previewFotoUrl, setPreviewFotoUrl] = useState("")

  const [filterJenis, setFilterJenis] = useState("semua")
  const [loading, setLoading] = useState(false)
  const [loadingSarana, setLoadingSarana] = useState(true)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<SaranaKesehatan | null>(null)

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

  const fetchDetailPendataan = async (id: string) => {
    if (!id) {
      setDetailPendataan(null)
      setPendataanError("ID Pendataan tidak valid.")
      setLoadingPendataan(false)
      return
    }

    setLoadingPendataan(true)
    setPendataanError("")

    const { data, error: fetchErr } = await supabase
      .from("pendataan_kesehatan")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr) {
      console.error("fetchDetailPendataan error:", fetchErr)
      setDetailPendataan(null)
      setPendataanError("Gagal membaca data pendataan kesehatan.")
    } else if (!data) {
      setDetailPendataan(null)
      setPendataanError("Data pendataan kesehatan tidak ditemukan atau sudah dihapus.")
    } else {
      setDetailPendataan(data)
    }

    setLoadingPendataan(false)
  }

  const fetchSarana = async (id: string) => {
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

    const { data, error: fetchError } = await supabase
      .from("sarana_kesehatan")
      .select("*")
      .eq("pendataan_id", id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("fetch sarana error:", fetchError)
      setPesanError(fetchError.message || "Gagal memuat daftar sarana kesehatan.")
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

  const saranaTersaring = useMemo(() => {
    if (!filterJenis || filterJenis === "semua") {
      return saranaList
    }
    return saranaList.filter((item) => item.jenis_slug === filterJenis)
  }, [saranaList, filterJenis])

  const ubahFormSarana = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target
    const checked = (event.target as HTMLInputElement).checked
    setFormSarana((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const resetFormSarana = () => {
    setFormSarana({
      nama_sarana: "",
      jenis_slug: "posyandu",
      alamat: "",
      status_operasional: "aktif",
      nomor_kontak: "",
      tautan_peta: "",
      keterangan: "",
      is_active: true,
    })
    setEditingSaranaId(null)
    setFormFasilitasList([])
    setExistingFasilitasIds([])
    setLoadingFasilitas(false)
    setFormTenagaList([])
    setExistingTenagaIds([])
    setLoadingTenaga(false)
    setFormIndikatorList([])
    setExistingIndikatorIds([])
    setLoadingIndikator(false)
    setFotoFile(null)
    setExistingFotoUrl("")
    setExistingStoragePath("")

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

  const shouldFocusFasilitasRef = useRef<number | null>(null)
  const shouldFocusTenagaRef = useRef<number | null>(null)
  const shouldFocusIndikatorRef = useRef<number | null>(null)

  const handleBatalForm = () => {
    resetFormSarana()
    setIsFormOpen(false)
  }

  // --- HANDLER BARIS FASILITAS ---
  const tambahBarisFasilitas = () => {
    const tempId = `temp-fas-${Date.now()}-${Math.random().toString(36).slice(2)}`
    shouldFocusFasilitasRef.current = formFasilitasList.length
    setFormFasilitasList((prev) => [
      ...prev,
      {
        tempId,
        nama_fasilitas: "",
        jumlah: "",
        urutan: (prev.length + 1).toString(),
        is_active: true,
      },
    ])
  }
  const ubahBarisFasilitas = (index: number, field: string, value: string | number | boolean) => {
    setFormFasilitasList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }
  const hapusBarisFasilitas = (index: number) => {
    setFormFasilitasList((prev) => prev.filter((_, i) => i !== index))
  }

  // --- HANDLER BARIS TENAGA KESEHATAN ---
  const tambahBarisTenaga = () => {
    const tempId = `temp-tng-${Date.now()}-${Math.random().toString(36).slice(2)}`
    shouldFocusTenagaRef.current = formTenagaList.length
    setFormTenagaList((prev) => [
      ...prev,
      {
        tempId,
        jenis_tenaga: "",
        jumlah: "",
        urutan: (prev.length + 1).toString(),
        is_active: true,
      },
    ])
  }
  const ubahBarisTenaga = (index: number, field: string, value: string | number | boolean) => {
    setFormTenagaList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }
  const hapusBarisTenaga = (index: number) => {
    setFormTenagaList((prev) => prev.filter((_, i) => i !== index))
  }

  // --- HANDLER BARIS INDIKATOR TAMBAHAN ---
  const tambahBarisIndikator = () => {
    const tempId = `temp-ind-${Date.now()}-${Math.random().toString(36).slice(2)}`
    shouldFocusIndikatorRef.current = formIndikatorList.length
    setFormIndikatorList((prev) => [
      ...prev,
      {
        tempId,
        nama_indikator: "",
        nilai_indikator: "",
        satuan: "",
        keterangan: "",
        urutan: (prev.length + 1).toString(),
        is_active: true,
      },
    ])
  }
  const ubahBarisIndikator = (index: number, field: string, value: string | number | boolean) => {
    setFormIndikatorList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }
  const hapusBarisIndikator = (index: number) => {
    setFormIndikatorList((prev) => prev.filter((_, i) => i !== index))
  }

  // --- BACA DATA RINCIAN DARI DATABASE ---
  const fetchRincianSarana = async (saranaId: string) => {
    setLoadingFasilitas(true)
    setLoadingTenaga(true)
    setLoadingIndikator(true)

    try {
      const { data: dataFas } = await supabase
        .from("fasilitas_sarana_kesehatan")
        .select("*")
        .eq("sarana_kesehatan_id", saranaId)
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

      const { data: dataTenaga } = await supabase
        .from("tenaga_kesehatan_sarana")
        .select("*")
        .eq("sarana_kesehatan_id", saranaId)
        .order("urutan", { ascending: true })

      if (dataTenaga && dataTenaga.length > 0) {
        setExistingTenagaIds(dataTenaga.map((t) => t.id))
        setFormTenagaList(
          dataTenaga.map((t) => ({
            id: t.id,
            jenis_tenaga: t.jenis_tenaga || "",
            jumlah: (t.jumlah ?? 1).toString(),
            urutan: (t.urutan ?? 0).toString(),
            is_active: Boolean(t.is_active ?? true),
          }))
        )
      } else {
        setExistingTenagaIds([])
        setFormTenagaList([])
      }

      const { data: dataInd } = await supabase
        .from("indikator_tambahan_kesehatan")
        .select("*")
        .eq("sarana_kesehatan_id", saranaId)
        .order("urutan", { ascending: true })

      if (dataInd && dataInd.length > 0) {
        setExistingIndikatorIds(dataInd.map((i) => i.id))
        setFormIndikatorList(
          dataInd.map((i) => ({
            id: i.id,
            nama_indikator: i.nama_indikator || "",
            nilai_indikator: i.nilai_indikator || "",
            satuan: i.satuan || "",
            keterangan: i.keterangan || "",
            urutan: (i.urutan ?? 0).toString(),
            is_active: Boolean(i.is_active ?? true),
          }))
        )
      } else {
        setExistingIndikatorIds([])
        setFormIndikatorList([])
      }
    } catch (err) {
      console.error("fetchRincianSarana error:", err)
    } finally {
      setLoadingFasilitas(false)
      setLoadingTenaga(false)
      setLoadingIndikator(false)
    }
  }

  const mulaiEditSarana = (item: SaranaKesehatan) => {
    setPesanSukses(null)
    setPesanError(null)

    setEditingSaranaId(item.id)
    setFormSarana({
      nama_sarana: item.nama_sarana || "",
      jenis_slug: item.jenis_slug || "posyandu",
      alamat: item.alamat || "",
      status_operasional: item.status_operasional || "aktif",
      nomor_kontak: item.nomor_kontak || "",
      tautan_peta: item.tautan_peta || "",
      keterangan: item.keterangan || "",
      is_active: Boolean(item.is_active),
    })

    setFotoFile(null)
    setExistingFotoUrl(item.foto_url || "")
    setExistingStoragePath(item.storage_path || "")
    setPreviewFotoUrl(item.foto_url || "")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    fetchRincianSarana(item.id)
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleToggleActiveSarana = async (item: SaranaKesehatan) => {
    if (loading) return

    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      const statusBaru = !item.is_active
      const { error: errToggle } = await supabase
        .from("sarana_kesehatan")
        .update({ is_active: statusBaru })
        .eq("id", item.id)
        .eq("pendataan_id", pendataanId)

      if (errToggle) {
        setPesanError(`Gagal mengubah status aktif sarana: ${errToggle.message}`)
      } else {
        setPesanSukses(
          statusBaru
            ? `Sarana kesehatan "${item.nama_sarana}" berhasil diaktifkan.`
            : `Sarana kesehatan "${item.nama_sarana}" berhasil dinonaktifkan.`
        )
      }

      await fetchSarana(pendataanId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat mengubah status sarana: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const pilihFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setPesanError("File foto sarana harus berupa gambar (JPG, PNG, WEBP).")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setPesanError("Ukuran file foto maksimal 2 MB.")
      return
    }

    setFotoFile(file)
  }

  const uploadFotoProses = async (
    targetSaranaId: string
  ): Promise<{ fotoUrl: string; storagePath: string } | null> => {
    if (!fotoFile || !targetSaranaId) return null

    const namaFileClean = String(fotoFile.name || "foto")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "-")

    const storagePath = `sarana/${targetSaranaId}/${Date.now()}-${namaFileClean}`

    const { error: errUpload } = await supabase.storage
      .from(BUCKET_FOTO_KESEHATAN)
      .upload(storagePath, fotoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: fotoFile.type || "image/jpeg",
      })

    if (errUpload) {
      throw new Error(`Upload foto ke Storage gagal: ${errUpload.message}`)
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_FOTO_KESEHATAN)
      .getPublicUrl(storagePath)

    return {
      fotoUrl: publicData?.publicUrl || "",
      storagePath,
    }
  }

  const simpanSarana = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    setPesanSukses(null)
    setPesanError(null)

    if (!pendataanId) {
      setPesanError("ID Pendataan tidak valid. Mohon kembali ke halaman riwayat pendataan.")
      return
    }

    if (!formSarana.nama_sarana.trim()) {
      setPesanError("Nama sarana kesehatan wajib diisi.")
      return
    }

    if (!formSarana.alamat.trim()) {
      setPesanError("Alamat sarana wajib diisi.")
      return
    }

    // Validasi Tautan Peta
    if (formSarana.tautan_peta.trim()) {
      const tautanVal = formSarana.tautan_peta.trim()
      if (!tautanVal.startsWith("https://")) {
        setPesanError("Tautan Google Maps wajib diawali dengan https://")
        return
      }
    }

    // Validasi Fasilitas (Cek Duplikat)
    if (editingSaranaId) {
      const fasMap = new Set()
      for (let i = 0; i < formFasilitasList.length; i++) {
        const itemFas = formFasilitasList[i]
        const namaTrim = (itemFas.nama_fasilitas || "").trim()
        const jml = keAngka(itemFas.jumlah)

        if (namaTrim.length > 0) {
          if (jml < 1) {
            setPesanError(`Jumlah fasilitas pada baris ke-${i + 1} minimal 1.`)
            return
          }
          const lower = namaTrim.toLowerCase()
          if (fasMap.has(lower)) {
            setPesanError(`Nama fasilitas "${namaTrim}" ditulis lebih dari satu kali. Mohon gabungkan nama duplikat.`)
            return
          }
          fasMap.add(lower)
        }
      }

      // Validasi Tenaga Kesehatan
      const tngMap = new Set()
      for (let i = 0; i < formTenagaList.length; i++) {
        const itemTng = formTenagaList[i]
        const jenisTrim = (itemTng.jenis_tenaga || "").trim()
        const jml = keAngka(itemTng.jumlah)

        if (!jenisTrim) {
          setPesanError(`Jenis tenaga kesehatan pada baris ke-${i + 1} wajib diisi.`)
          return
        }
        if (jml < 1) {
          setPesanError(`Jumlah tenaga kesehatan pada baris ke-${i + 1} minimal 1.`)
          return
        }

        const lower = jenisTrim.toLowerCase()
        if (tngMap.has(lower)) {
          setPesanError(`Jenis tenaga kesehatan "${jenisTrim}" ditulis lebih dari satu kali. Mohon gabungkan nama duplikat.`)
          return
        }
        tngMap.add(lower)
      }

      // Validasi Indikator Tambahan
      const indMap = new Set()
      for (let i = 0; i < formIndikatorList.length; i++) {
        const itemInd = formIndikatorList[i]
        const namaTrim = (itemInd.nama_indikator || "").trim()
        const nilaiTrim = (itemInd.nilai_indikator || "").trim()

        if (namaTrim.length > 0 || nilaiTrim.length > 0) {
          if (!namaTrim || !nilaiTrim) {
            setPesanError(`Nama dan Nilai indikator tambahan pada baris ke-${i + 1} wajib diisi.`)
            return
          }
          const lower = namaTrim.toLowerCase()
          if (indMap.has(lower)) {
            setPesanError(`Nama indikator "${namaTrim}" ditulis lebih dari satu kali. Mohon gabungkan nama duplikat.`)
            return
          }
          indMap.add(lower)
        }
      }
    }

    setLoading(true)

    const session = await periksaSesi()
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const dataSaranaBase = {
        pendataan_id: pendataanId,
        nama_sarana: formSarana.nama_sarana.trim(),
        jenis_slug: formSarana.jenis_slug,
        alamat: formSarana.alamat.trim(),
        status_operasional: formSarana.status_operasional || "aktif",
        nomor_kontak: formSarana.nomor_kontak.trim() || null,
        tautan_peta: formSarana.tautan_peta.trim() || null,
        keterangan: formSarana.keterangan.trim() || null,
        urutan: 0,
        is_active: editingSaranaId ? Boolean(formSarana.is_active) : true,
      }

      let activeSaranaId = editingSaranaId
      let isFotoUploadSuccess = true

      if (editingSaranaId) {
        // --- PROSES EDIT SARANA ---
        let fotoUrlBaru = existingFotoUrl
        let storagePathBaru = existingStoragePath
        let uploadedNewPhoto = false

        if (fotoFile) {
          const resUpload = await uploadFotoProses(editingSaranaId)
          if (resUpload) {
            fotoUrlBaru = resUpload.fotoUrl || ""
            storagePathBaru = resUpload.storagePath || ""
            uploadedNewPhoto = true
          }
        }

        const payloadUpdate = {
          ...dataSaranaBase,
          foto_url: fotoUrlBaru || null,
          storage_path: storagePathBaru || null,
        }

        const { error: updateError } = await supabase
          .from("sarana_kesehatan")
          .update(payloadUpdate)
          .eq("id", editingSaranaId)
          .eq("pendataan_id", pendataanId)

        if (updateError) {
          if (uploadedNewPhoto && storagePathBaru) {
            await supabase.storage.from(BUCKET_FOTO_KESEHATAN).remove([storagePathBaru])
          }
          throw updateError
        }

        if (uploadedNewPhoto && (existingStoragePath || existingFotoUrl)) {
          const pathLama = existingStoragePath || ambilPathFotoDariUrl(existingFotoUrl)
          if (pathLama && pathLama !== storagePathBaru) {
            await supabase.storage.from(BUCKET_FOTO_KESEHATAN).remove([pathLama])
          }
        }
      } else {
        // --- PROSES TAMBAH SARANA BARU (Otomatis Active) ---
        const { data: saranaBaru, error: insertError } = await supabase
          .from("sarana_kesehatan")
          .insert([{ ...dataSaranaBase, foto_url: null, storage_path: null }])
          .select("id")
          .single()

        if (insertError) throw insertError
        activeSaranaId = saranaBaru.id

        if (fotoFile && activeSaranaId) {
          try {
            const resUpload = await uploadFotoProses(activeSaranaId)
            if (resUpload) {
              const { error: errUpdFoto } = await supabase
                .from("sarana_kesehatan")
                .update({
                  foto_url: resUpload.fotoUrl,
                  storage_path: resUpload.storagePath,
                })
                .eq("id", activeSaranaId)

              if (errUpdFoto) {
                console.error("Gagal mengupdate URL foto ke DB:", errUpdFoto)
                if (resUpload.storagePath) {
                  await supabase.storage
                    .from(BUCKET_FOTO_KESEHATAN)
                    .remove([resUpload.storagePath])
                }
                isFotoUploadSuccess = false
              }
            }
          } catch (uploadErr: any) {
            console.error("Upload foto sarana baru gagal:", uploadErr)
            isFotoUploadSuccess = false
          }
        }
      }

      // --- SINKRONISASI 3 TABEL RINCIAN ---
      if (activeSaranaId && editingSaranaId) {
        // 1. Sinkronisasi Fasilitas
        const fasValid = formFasilitasList
          .map((f, idx) => ({
            id: f.id || null,
            sarana_kesehatan_id: activeSaranaId,
            nama_fasilitas: (f.nama_fasilitas || "").trim(),
            jumlah: keAngka(f.jumlah),
            urutan: idx + 1,
            is_active: Boolean(f.is_active ?? true),
          }))
          .filter((f) => f.nama_fasilitas.length > 0 && f.jumlah >= 1)

        const currentFasIds = fasValid.map((f) => f.id).filter((id): id is string => Boolean(id))
        const deletedFasIds = existingFasilitasIds.filter((id) => !currentFasIds.includes(id))

        if (deletedFasIds.length > 0) {
          await supabase.from("fasilitas_sarana_kesehatan").delete().in("id", deletedFasIds)
        }

        for (const fasItem of fasValid) {
          if (fasItem.id) {
            await supabase
              .from("fasilitas_sarana_kesehatan")
              .update({
                nama_fasilitas: fasItem.nama_fasilitas,
                jumlah: fasItem.jumlah,
                urutan: fasItem.urutan,
                is_active: fasItem.is_active,
              })
              .eq("id", fasItem.id)
          } else {
            await supabase.from("fasilitas_sarana_kesehatan").insert({
              sarana_kesehatan_id: activeSaranaId,
              nama_fasilitas: fasItem.nama_fasilitas,
              jumlah: fasItem.jumlah,
              urutan: fasItem.urutan,
              is_active: fasItem.is_active,
            })
          }
        }

        // 2. Sinkronisasi Tenaga Kesehatan
        const tngValid = formTenagaList
          .map((t, idx) => ({
            id: t.id || null,
            sarana_kesehatan_id: activeSaranaId,
            jenis_tenaga: (t.jenis_tenaga || "").trim(),
            jumlah: keAngka(t.jumlah),
            urutan: idx + 1,
            is_active: Boolean(t.is_active ?? true),
          }))
          .filter((t) => t.jenis_tenaga.length > 0 && t.jumlah >= 1)

        const currentTngIds = tngValid.map((t) => t.id).filter((id): id is string => Boolean(id))
        const deletedTngIds = existingTenagaIds.filter((id) => !currentTngIds.includes(id))

        if (deletedTngIds.length > 0) {
          await supabase.from("tenaga_kesehatan_sarana").delete().in("id", deletedTngIds)
        }

        for (const tngItem of tngValid) {
          if (tngItem.id) {
            await supabase
              .from("tenaga_kesehatan_sarana")
              .update({
                jenis_tenaga: tngItem.jenis_tenaga,
                jumlah: tngItem.jumlah,
                urutan: tngItem.urutan,
                is_active: tngItem.is_active,
              })
              .eq("id", tngItem.id)
          } else {
            await supabase.from("tenaga_kesehatan_sarana").insert({
              sarana_kesehatan_id: activeSaranaId,
              jenis_tenaga: tngItem.jenis_tenaga,
              jumlah: tngItem.jumlah,
              urutan: tngItem.urutan,
              is_active: tngItem.is_active,
            })
          }
        }

        // 3. Sinkronisasi Indikator Tambahan
        const indValid = formIndikatorList
          .map((i, idx) => ({
            id: i.id || null,
            sarana_kesehatan_id: activeSaranaId,
            nama_indikator: (i.nama_indikator || "").trim(),
            nilai_indikator: (i.nilai_indikator || "").trim(),
            satuan: (i.satuan || "").trim() || null,
            keterangan: (i.keterangan || "").trim() || null,
            urutan: idx + 1,
            is_active: Boolean(i.is_active ?? true),
          }))
          .filter((i) => i.nama_indikator.length > 0 && i.nilai_indikator.length > 0)

        const currentIndIds = indValid.map((i) => i.id).filter((id): id is string => Boolean(id))
        const deletedIndIds = existingIndikatorIds.filter((id) => !currentIndIds.includes(id))

        if (deletedIndIds.length > 0) {
          await supabase.from("indikator_tambahan_kesehatan").delete().in("id", deletedIndIds)
        }

        for (const indItem of indValid) {
          if (indItem.id) {
            await supabase
              .from("indikator_tambahan_kesehatan")
              .update({
                nama_indikator: indItem.nama_indikator,
                nilai_indikator: indItem.nilai_indikator,
                satuan: indItem.satuan,
                keterangan: indItem.keterangan,
                urutan: indItem.urutan,
                is_active: indItem.is_active,
              })
              .eq("id", indItem.id)
          } else {
            await supabase.from("indikator_tambahan_kesehatan").insert({
              sarana_kesehatan_id: activeSaranaId,
              nama_indikator: indItem.nama_indikator,
              nilai_indikator: indItem.nilai_indikator,
              satuan: indItem.satuan,
              keterangan: indItem.keterangan,
              urutan: indItem.urutan,
              is_active: indItem.is_active,
            })
          }
        }
      }

      if (editingSaranaId) {
        setPesanSukses("Data sarana kesehatan berhasil diperbarui.")
      } else {
        if (!isFotoUploadSuccess) {
          setPesanSukses("Sarana kesehatan berhasil ditambahkan (tanpa foto karena upload foto gagal).")
        } else {
          setPesanSukses("Sarana kesehatan berhasil ditambahkan.")
        }
      }

      handleBatalForm()
      await fetchSarana(pendataanId)
    } catch (simpanErr: any) {
      console.error("simpan sarana error:", simpanErr)
      setPesanError(`Gagal menyimpan sarana kesehatan: ${simpanErr?.message || "Terjadi kesalahan."}`)
    } finally {
      setLoading(false)
    }
  }

  const hapusSarana = (item: SaranaKesehatan) => {
    if (loading) return
    setDeleteTarget(item)
  }

  const executeHapusSarana = async (item: SaranaKesehatan) => {
    const session = await periksaSesi()
    if (!session) return

    setPesanSukses(null)
    setPesanError(null)
    setLoading(true)

    try {
      // 1. Hapus rincian anak
      await supabase.from("fasilitas_sarana_kesehatan").delete().eq("sarana_kesehatan_id", item.id)
      await supabase.from("tenaga_kesehatan_sarana").delete().eq("sarana_kesehatan_id", item.id)
      await supabase.from("indikator_tambahan_kesehatan").delete().eq("sarana_kesehatan_id", item.id)

      // 2. Hapus file Storage jika ada
      const pathFoto = item.storage_path || ambilPathFotoDariUrl(item.foto_url)
      if (pathFoto) {
        await supabase.storage.from(BUCKET_FOTO_KESEHATAN).remove([pathFoto])
      }

      // 3. Hapus record database utama
      const { error: hapusError } = await supabase
        .from("sarana_kesehatan")
        .delete()
        .eq("id", item.id)
        .eq("pendataan_id", pendataanId)

      if (hapusError) {
        const msg = `Gagal menghapus sarana kesehatan: ${hapusError.message}`
        setPesanError(msg)
        showError(msg)
      } else {
        const msg = `Sarana kesehatan "${item.nama_sarana}" berhasil dihapus.`
        setPesanSukses(msg)
        showSuccess(msg)
      }

      if (editingSaranaId === item.id) {
        handleBatalForm()
      }

      await fetchSarana(pendataanId)
    } catch (hapusError: any) {
      console.error("hapus sarana error:", hapusError)
      const msg = `Gagal menghapus sarana kesehatan: ${hapusError?.message || "Terjadi kesalahan."}`
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
    <div className="min-h-screen bg-admin-warm pb-20 text-[#1F2937]">
      {/* Top Header Panel - Warm Modern Government Theme */}
      <header className="bg-gradient-to-r from-[#1A1200] via-[#2C1B01] to-[#3D2605] border-b border-[#B6A587]/30 shadow-lg text-white mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link
              href="/admin/kesehatan"
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#B6A587]/15 hover:bg-[#B6A587]/30 text-[#B6A587] hover:text-white border border-[#B6A587]/30 transition-all transform hover:-translate-x-1 cursor-pointer"
              title="Kembali ke Riwayat Pendataan Kesehatan"
              aria-label="Kembali ke Riwayat Pendataan Kesehatan"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Rincian Sarana Kesehatan
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Fasilitas Kesehatan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola data posyandu, puskesmas &amp; tenaga kesehatan periode terpilih.
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
                <span>Tambah Sarana Kesehatan</span>
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

        {/* Kondisi Jika Pendataan Tidak Ditemukan / Error */}
        {loadingPendataan ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
            <p className="text-sm font-medium text-gray-600">Memuat detail periode pendataan kesehatan...</p>
          </div>
        ) : pendataanError || !detailPendataan ? (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Periode Pendataan Kesehatan Tidak Ditemukan
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {pendataanError || "Data pendataan kesehatan tidak tersedia atau telah dihapus."}
            </p>
            <Link
              href="/admin/kesehatan"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2c1b01] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a2604] transition-colors"
            >
              <span>← Kembali ke Riwayat Pendataan</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Card Ringkasan Periode (Hanya Nama Periode, Sumber Data, Jumlah Sarana Kesehatan) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#2c1b01]">
                    Pendataan Kesehatan Tahun {detailPendataan.tahun_pendataan}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    Sumber: <strong className="text-gray-900">{detailPendataan.sumber_data}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#f7f2e8] px-3.5 py-1.5 text-xs font-bold text-[#2c1b01] border border-[#2c1b01]/10 shadow-xs">
                    Jumlah Sarana Kesehatan: {saranaList.length}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: Form Tambah / Edit Sarana Kesehatan (Krem Header, Body Putih) */}
            {isFormOpen && (
              <div ref={formRef} id="form-sarana-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Header Krem Section */}
                <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-[#2c1b01]">
                    {editingSaranaId ? "Edit Sarana Kesehatan" : "Tambah Sarana Kesehatan"}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {editingSaranaId
                      ? "Ubah data sarana kesehatan Nagari."
                      : "Isi formulir berikut untuk mendaftarkan sarana kesehatan baru."}
                  </p>
                </div>

                {/* Body Form Putih */}
                <form onSubmit={simpanSarana} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nama Sarana Kesehatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nama_sarana"
                        value={formSarana.nama_sarana}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="Contoh: Pustu Padang Sarai / Posyandu Mawar 1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Jenis Sarana <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="jenis_slug"
                        value={formSarana.jenis_slug}
                        onChange={ubahFormSarana}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      >
                        {PILIHAN_JENIS_SARANA.map((item) => (
                          <option key={item.slug} value={item.slug}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Alamat Sarana <span className="text-red-500">*</span>
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
                        name="tautan_peta"
                        value={formSarana.tautan_peta}
                        onChange={ubahFormSarana}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="https://maps.google.com/..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                      />
                    </div>
                  </div>

                  {/* SUBSECTION: RINCIAN FASILITAS, TENAGA & INDIKATOR */}
                  {!editingSaranaId ? (
                    <div className="rounded-xl border border-dashed border-amber-300 bg-[#f7f2e8]/60 p-4 text-center">
                      <p className="text-xs font-bold text-[#2c1b01]">
                        Rincian Fasilitas, Tenaga Kesehatan, & Indikator Tambahan
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        Simpan data sarana kesehatan terlebih dahulu sebelum mengelola rincian Fasilitas, Tenaga Kesehatan, dan Indikator Tambahan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-2">
                      {/* 1. Fasilitas Internal */}
                      <div className="rounded-xl border border-gray-200 bg-[#f7f2e8]/40 p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#2c1b01]">
                              Fasilitas Internal Sarana Kesehatan
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Ruang periksa, tempat tidur, peralatan imunisasi, laboratorium, dll.
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

                        <datalist id="saran-fasilitas-kes-list">
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
                                    ref={(el) => {
                                      if (el && shouldFocusFasilitasRef.current === index) {
                                        el.focus()
                                        shouldFocusFasilitasRef.current = null
                                      }
                                    }}
                                    type="text"
                                    list="saran-fasilitas-kes-list"
                                    placeholder="Nama fasilitas (mis. Ruang Periksa)"
                                    value={item.nama_fasilitas}
                                    onChange={(e) => ubahBarisFasilitas(index, "nama_fasilitas", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <div className="w-36 flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs text-gray-500 whitespace-nowrap font-medium">Jumlah:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="0"
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

                      {/* 2. Tenaga Kesehatan */}
                      <div className="rounded-xl border border-gray-200 bg-[#f7f2e8]/40 p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#2c1b01]">
                              Tenaga Kesehatan / Kader
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Rincian Dokter, Bidan, Perawat, maupun Kader Posyandu.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={tambahBarisTenaga}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ Tambah Tenaga</span>
                          </button>
                        </div>

                        <datalist id="saran-tenaga-kes-list">
                          {SARAN_TENAGA.map((saran) => (
                            <option key={saran} value={saran} />
                          ))}
                        </datalist>

                        {loadingTenaga ? (
                          <p className="py-3 text-center text-xs text-gray-500">Memuat tenaga kesehatan...</p>
                        ) : formTenagaList.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-center">
                            <p className="text-xs text-gray-500">
                              Belum ada tenaga kesehatan. Klik &quot;+ Tambah Tenaga&quot; di atas.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {formTenagaList.map((item, index) => (
                              <div
                                key={item.tempId || item.id || index}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs"
                              >
                                <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                  {index + 1}.
                                </span>
                                <div className="flex-1 min-w-[160px]">
                                  <input
                                    ref={(el) => {
                                      if (el && shouldFocusTenagaRef.current === index) {
                                        el.focus()
                                        shouldFocusTenagaRef.current = null
                                      }
                                    }}
                                    type="text"
                                    list="saran-tenaga-kes-list"
                                    placeholder="Jenis tenaga (mis. Kader Posyandu)"
                                    value={item.jenis_tenaga}
                                    onChange={(e) => ubahBarisTenaga(index, "jenis_tenaga", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <div className="w-36 flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs text-gray-500 whitespace-nowrap font-medium">Jumlah:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={item.jumlah}
                                    onChange={(e) => ubahBarisTenaga(index, "jumlah", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => hapusBarisTenaga(index)}
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

                      {/* 3. Indikator Tambahan */}
                      <div className="rounded-xl border border-gray-200 bg-[#f7f2e8]/40 p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#2c1b01]">
                              Indikator Tambahan
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Spesifikasi khusus seperti &quot;Jumlah Posyandu Binaan&quot;, &quot;Jam Operasional&quot;, dll.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={tambahBarisIndikator}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ Tambah Indikator</span>
                          </button>
                        </div>

                        <datalist id="saran-indikator-kes-list">
                          {SARAN_INDIKATOR.map((saran) => (
                            <option key={saran} value={saran} />
                          ))}
                        </datalist>

                        {loadingIndikator ? (
                          <p className="py-3 text-center text-xs text-gray-500">Memuat indikator tambahan...</p>
                        ) : formIndikatorList.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-center">
                            <p className="text-xs text-gray-500">
                              Belum ada indikator tambahan. Klik &quot;+ Tambah Indikator&quot; di atas.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {formIndikatorList.map((item, index) => (
                              <div
                                key={item.tempId || item.id || index}
                                className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-500">
                                    Indikator #{index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => hapusBarisIndikator(index)}
                                    className="rounded-md border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 transition-colors"
                                    title="Hapus baris"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    ref={(el) => {
                                      if (el && shouldFocusIndikatorRef.current === index) {
                                        el.focus()
                                        shouldFocusIndikatorRef.current = null
                                      }
                                    }}
                                    type="text"
                                    list="saran-indikator-kes-list"
                                    placeholder="Nama (mis. Posyandu Binaan)"
                                    value={item.nama_indikator}
                                    onChange={(e) => ubahBarisIndikator(index, "nama_indikator", e.target.value)}
                                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Nilai (mis. 4 atau 24 Jam)"
                                    value={item.nilai_indikator}
                                    onChange={(e) => ubahBarisIndikator(index, "nilai_indikator", e.target.value)}
                                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Satuan opsional (mis. Posyandu)"
                                    value={item.satuan || ""}
                                    onChange={(e) => ubahBarisIndikator(index, "satuan", e.target.value)}
                                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  />
                                </div>
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
                      Foto Sarana Kesehatan <span className="text-xs font-normal text-gray-500">(Opsional, JPG/PNG/WEBP, max 2 MB)</span>
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
                          alt="Pratinjau sarana kesehatan"
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
                      placeholder="Tambahkan informasi lain bila diperlukan..."
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
                        <span>Simpan Perubahan Sarana</span>
                      ) : (
                        <span>Tambah Sarana Kesehatan</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION 2: Tabel Daftar Sarana Kesehatan (Header Section Baru Konsisten dengan Sarana Pendidikan) */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#2c1b01]">
                    Daftar Sarana Kesehatan
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Menampilkan {saranaTersaring.length} dari {saranaList.length} data sarana kesehatan
                  </p>
                </div>

                <div className="w-full sm:w-64">
                  <select
                    value={filterJenis}
                    onChange={(e) => setFilterJenis(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white cursor-pointer"
                  >
                    <option value="semua">Semua Jenis Sarana</option>
                    {PILIHAN_JENIS_SARANA.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingSarana ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
                  <p className="text-sm font-medium">Memuat sarana kesehatan...</p>
                </div>
              ) : saranaTersaring.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-base font-semibold text-gray-700">Belum Ada Sarana Kesehatan</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {filterJenis !== "semua"
                      ? "Tidak ada data sarana kesehatan yang cocok dengan filter jenis pilihan."
                      : 'Gunakan tombol "Tambah Sarana Kesehatan" untuk mendaftarkan data sarana baru.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-bold w-[45%]">Nama Sarana</th>
                        <th scope="col" className="px-6 py-4 font-bold w-[30%]">Jenis Sarana</th>
                        <th scope="col" className="px-6 py-4 font-bold text-right w-[25%]">Aksi</th>
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
                              {getLabelJenisSarana(item.jenis_slug)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 flex-nowrap">
                              {/* Tombol 1: Edit */}
                              <button
                                type="button"
                                onClick={() => mulaiEditSarana(item)}
                                disabled={loading}
                                className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                Edit
                              </button>

                              {/* Tombol 2: Toggle Aktifkan / Nonaktifkan */}
                              {item.is_active ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleActiveSarana(item)}
                                  disabled={loading}
                                  className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                                  title="Nonaktifkan sarana kesehatan dari website publik"
                                >
                                  Nonaktifkan
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleActiveSarana(item)}
                                  disabled={loading}
                                  className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                                  title="Aktifkan sarana kesehatan untuk website publik"
                                >
                                  Aktifkan
                                </button>
                              )}

                              {/* Tombol 3: Hapus */}
                              <button
                                type="button"
                                onClick={() => hapusSarana(item)}
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
          </>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Sarana Kesehatan?"
        message={
          <>
            Apakah Anda yakin ingin menghapus sarana kesehatan <strong>&quot;{deleteTarget?.nama_sarana}&quot;</strong>?
            <br />
            Seluruh rincian fasilitas dan tenaga kesehatan terkait juga akan terhapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={loading}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeHapusSarana(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
