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

function formatAngka(nilai: any): string {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function buatNamaFileAman(namaFile: string): string {
  return String(namaFile || "foto")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
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
    urutan: "0",
    is_active: true,
  })
  const [editingSaranaId, setEditingSaranaId] = useState<string | null>(null)
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

  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingSarana, setLoadingSarana] = useState(true)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    setError("")

    const session = await periksaSesi()
    if (!session) {
      setLoadingSarana(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("sarana_kesehatan")
      .select("*")
      .eq("pendataan_id", id)
      .order("urutan", { ascending: true })
      .order("nama_sarana", { ascending: true })

    if (fetchError) {
      console.error("fetch sarana error:", fetchError)
      setError(fetchError.message || "Gagal memuat daftar sarana kesehatan.")
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

  const saranaTersaring = useMemo(() => {
    const kataKunci = searchQuery.trim().toLowerCase()
    if (!kataKunci) return saranaList

    return saranaList.filter((item) =>
      [
        item.nama_sarana,
        getLabelJenisSarana(item.jenis_slug),
        item.alamat,
        item.nomor_kontak,
        item.status_operasional,
        item.keterangan,
      ].some((nilai) => String(nilai || "").toLowerCase().includes(kataKunci))
    )
  }, [saranaList, searchQuery])

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
      urutan: "0",
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

  // --- HANDLER BARIS FASILITAS ---
  const tambahBarisFasilitas = () => {
    const tempId = `temp-fas-${Date.now()}-${Math.random().toString(36).slice(2)}`
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
  const ubahBarisFasilitas = (index: number, field: string, value: any) => {
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
    setFormTenagaList((prev) => [
      ...prev,
      {
        tempId,
        jenis_tenaga: "",
        jumlah: "1",
        urutan: (prev.length + 1).toString(),
        is_active: true,
      },
    ])
  }
  const ubahBarisTenaga = (index: number, field: string, value: any) => {
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
  const ubahBarisIndikator = (index: number, field: string, value: any) => {
    setFormIndikatorList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }
  const hapusBarisIndikator = (index: number) => {
    setFormIndikatorList((prev) => prev.filter((_, i) => i !== index))
  }

  const pilihFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      setFotoFile(null)
      return
    }

    const tipeYangDiizinkan = ["image/jpeg", "image/png", "image/webp"]
    if (!tipeYangDiizinkan.includes(file.type)) {
      alert("Format foto harus JPG, PNG, atau WEBP.")
      event.target.value = ""
      setFotoFile(null)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2 MB.")
      event.target.value = ""
      setFotoFile(null)
      return
    }

    setFotoFile(file)
  }

  const uploadFotoProses = async (saranaId: string) => {
    if (!fotoFile) return null

    const namaAman = buatNamaFileAman(fotoFile.name)
    const kodeUnik =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    const pathFoto = `sarana-kesehatan/${saranaId}/${Date.now()}-${kodeUnik}-${namaAman}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FOTO_KESEHATAN)
      .upload(pathFoto, fotoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: fotoFile.type,
      })

    if (uploadError) {
      throw new Error(`Gagal mengunggah foto ke Storage: ${uploadError.message}`)
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_FOTO_KESEHATAN)
      .getPublicUrl(pathFoto)

    return {
      fotoUrl: publicData?.publicUrl || null,
      storagePath: pathFoto,
    }
  }

  const simpanSarana = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    if (!detailPendataan || !pendataanId) {
      alert("Periode pendataan kesehatan tidak valid.")
      return
    }

    if (!formSarana.nama_sarana.trim()) {
      alert("Nama sarana kesehatan wajib diisi.")
      return
    }

    if (!formSarana.alamat.trim()) {
      alert("Alamat wajib diisi.")
      return
    }

    const urutan = keAngka(formSarana.urutan)
    if (urutan < 0) {
      alert("Urutan tidak boleh kurang dari nol.")
      return
    }

    // Validasi Tautan Peta Sesuai Constraint Database (Koreksi 1: Wajib HTTPS)
    if (formSarana.tautan_peta.trim()) {
      const tautanVal = formSarana.tautan_peta.trim()
      if (!tautanVal.startsWith("https://")) {
        alert("Tautan Google Maps wajib diawali dengan https:// (tidak menerima http://)")
        return
      }
    }

    // Validasi Fasilitas (Cek Duplikat jika editingSaranaId valid)
    if (editingSaranaId) {
      const fasMap = new Set()
      for (let i = 0; i < formFasilitasList.length; i++) {
        const itemFas = formFasilitasList[i]
        const namaTrim = (itemFas.nama_fasilitas || "").trim()
        const jml = keAngka(itemFas.jumlah)

        if (namaTrim.length > 0) {
          if (jml < 1) {
            alert(`Jumlah fasilitas pada baris ke-${i + 1} minimal 1.`)
            return
          }
          const lower = namaTrim.toLowerCase()
          if (fasMap.has(lower)) {
            alert(`Nama fasilitas "${namaTrim}" ditulis lebih dari satu kali. Mohon gabungkan atau ubah nama duplikat.`)
            return
          }
          fasMap.add(lower)
        }
      }

      // Validasi Tenaga Kesehatan (Cek Duplikat & Minimal 1)
      const tngMap = new Set()
      for (let i = 0; i < formTenagaList.length; i++) {
        const itemTng = formTenagaList[i]
        const jenisTrim = (itemTng.jenis_tenaga || "").trim()
        const jml = keAngka(itemTng.jumlah)

        if (!jenisTrim) {
          alert(`Jenis tenaga kesehatan pada baris ke-${i + 1} wajib diisi.`)
          return
        }
        if (jml < 1) {
          alert(`Jumlah tenaga kesehatan pada baris ke-${i + 1} minimal 1.`)
          return
        }

        const lower = jenisTrim.toLowerCase()
        if (tngMap.has(lower)) {
          alert(`Jenis tenaga kesehatan "${jenisTrim}" ditulis lebih dari satu kali. Mohon gabungkan atau ubah nama duplikat.`)
          return
        }
        tngMap.add(lower)
      }

      // Validasi Indikator Tambahan (Cek Duplikat & Terisi)
      const indMap = new Set()
      for (let i = 0; i < formIndikatorList.length; i++) {
        const itemInd = formIndikatorList[i]
        const namaTrim = (itemInd.nama_indikator || "").trim()
        const nilaiTrim = (itemInd.nilai_indikator || "").trim()

        if (namaTrim.length > 0 || nilaiTrim.length > 0) {
          if (!namaTrim || !nilaiTrim) {
            alert(`Nama dan Nilai indikator tambahan pada baris ke-${i + 1} wajib diisi.`)
            return
          }
          const lower = namaTrim.toLowerCase()
          if (indMap.has(lower)) {
            alert(`Nama indikator "${namaTrim}" ditulis lebih dari satu kali. Mohon gabungkan atau ubah nama duplikat.`)
            return
          }
          indMap.add(lower)
        }
      }
    }

    setLoading(true)
    setError("")

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
        status_operasional: formSarana.status_operasional,
        nomor_kontak: formSarana.nomor_kontak.trim() || null,
        tautan_peta: formSarana.tautan_peta.trim() || null,
        keterangan: formSarana.keterangan.trim() || null,
        urutan,
        is_active: Boolean(formSarana.is_active),
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
        // --- PROSES TAMBAH SARANA BARU (KOREKSI 4) ---
        // 1. Insert record sarana tanpa foto lebih dulu
        const { data: saranaBaru, error: insertError } = await supabase
          .from("sarana_kesehatan")
          .insert([{ ...dataSaranaBase, foto_url: null, storage_path: null }])
          .select("id")
          .single()

        if (insertError) throw insertError
        activeSaranaId = saranaBaru.id

        // 2. Upload foto menggunakan saranaId
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
                // Hapus file baru dari Storage agar tidak menjadi file yatim (Koreksi 4)
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

      // --- SINKRONISASI 3 TABEL RINCIAN (Hanya Jika ActiveSaranaId Berasal dari Sarana Valid) ---
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

        const currentFasIds = fasValid.map((f) => f.id).filter(Boolean)
        const fasToUpdate = fasValid.filter((f) => Boolean(f.id))
        const fasToInsert = fasValid.filter((f) => !f.id)

        for (const itemUpd of fasToUpdate) {
          const { error: errUpdFas } = await supabase
            .from("fasilitas_sarana_kesehatan")
            .update({
              nama_fasilitas: itemUpd.nama_fasilitas,
              jumlah: itemUpd.jumlah,
              urutan: itemUpd.urutan,
              is_active: itemUpd.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemUpd.id)
            .eq("sarana_kesehatan_id", activeSaranaId)

          if (errUpdFas) {
            if (errUpdFas.code === "23505") {
              alert(`Gagal memperbarui fasilitas "${itemUpd.nama_fasilitas}": Terjadi duplikasi nama fasilitas pada sarana ini.`)
            } else {
              throw errUpdFas
            }
          }
        }

        if (fasToInsert.length > 0) {
          const { error: errInsFas } = await supabase.from("fasilitas_sarana_kesehatan").insert(
            fasToInsert.map((f) => ({
              sarana_kesehatan_id: activeSaranaId,
              nama_fasilitas: f.nama_fasilitas,
              jumlah: f.jumlah,
              urutan: f.urutan,
              is_active: f.is_active,
            }))
          )

          if (errInsFas) {
            if (errInsFas.code === "23505") {
              alert("Gagal menambahkan fasilitas: Terjadi duplikasi nama fasilitas pada sarana ini.")
            } else {
              throw errInsFas
            }
          }
        }

        const fasToDelete = existingFasilitasIds.filter((id) => !currentFasIds.includes(id))
        if (fasToDelete.length > 0) {
          await supabase.from("fasilitas_sarana_kesehatan").delete().in("id", fasToDelete).eq("sarana_kesehatan_id", activeSaranaId)
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

        const currentTngIds = tngValid.map((t) => t.id).filter(Boolean)
        const tngToUpdate = tngValid.filter((t) => Boolean(t.id))
        const tngToInsert = tngValid.filter((t) => !t.id)

        for (const itemUpd of tngToUpdate) {
          const { error: errUpdTng } = await supabase
            .from("tenaga_kesehatan_sarana")
            .update({
              jenis_tenaga: itemUpd.jenis_tenaga,
              jumlah: itemUpd.jumlah,
              urutan: itemUpd.urutan,
              is_active: itemUpd.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemUpd.id)
            .eq("sarana_kesehatan_id", activeSaranaId)

          if (errUpdTng) {
            if (errUpdTng.code === "23505") {
              alert(`Gagal memperbarui tenaga kesehatan "${itemUpd.jenis_tenaga}": Terjadi duplikasi jenis tenaga pada sarana ini.`)
            } else {
              throw errUpdTng
            }
          }
        }

        if (tngToInsert.length > 0) {
          const { error: errInsTng } = await supabase.from("tenaga_kesehatan_sarana").insert(
            tngToInsert.map((t) => ({
              sarana_kesehatan_id: activeSaranaId,
              jenis_tenaga: t.jenis_tenaga,
              jumlah: t.jumlah,
              urutan: t.urutan,
              is_active: t.is_active,
            }))
          )

          if (errInsTng) {
            if (errInsTng.code === "23505") {
              alert("Gagal menambahkan tenaga kesehatan: Terjadi duplikasi jenis tenaga pada sarana ini.")
            } else {
              throw errInsTng
            }
          }
        }

        const tngToDelete = existingTenagaIds.filter((id) => !currentTngIds.includes(id))
        if (tngToDelete.length > 0) {
          await supabase.from("tenaga_kesehatan_sarana").delete().in("id", tngToDelete).eq("sarana_kesehatan_id", activeSaranaId)
        }

        // 3. Sinkronisasi Indikator Tambahan (Koreksi 2: Kolom Satuan & Keterangan)
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

        const currentIndIds = indValid.map((i) => i.id).filter(Boolean)
        const indToUpdate = indValid.filter((i) => Boolean(i.id))
        const indToInsert = indValid.filter((i) => !i.id)

        for (const itemUpd of indToUpdate) {
          const { error: errUpdInd } = await supabase
            .from("indikator_tambahan_kesehatan")
            .update({
              nama_indikator: itemUpd.nama_indikator,
              nilai_indikator: itemUpd.nilai_indikator,
              satuan: itemUpd.satuan,
              keterangan: itemUpd.keterangan,
              urutan: itemUpd.urutan,
              is_active: itemUpd.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemUpd.id)
            .eq("sarana_kesehatan_id", activeSaranaId)

          if (errUpdInd) {
            if (errUpdInd.code === "23505") {
              alert(`Gagal memperbarui indikator "${itemUpd.nama_indikator}": Terjadi duplikasi nama indikator pada sarana ini.`)
            } else {
              throw errUpdInd
            }
          }
        }

        if (indToInsert.length > 0) {
          const { error: errInsInd } = await supabase.from("indikator_tambahan_kesehatan").insert(
            indToInsert.map((i) => ({
              sarana_kesehatan_id: activeSaranaId,
              nama_indikator: i.nama_indikator,
              nilai_indikator: i.nilai_indikator,
              satuan: i.satuan,
              keterangan: i.keterangan,
              urutan: i.urutan,
              is_active: i.is_active,
            }))
          )

          if (errInsInd) {
            if (errInsInd.code === "23505") {
              alert("Gagal menambahkan indikator tambahan: Terjadi duplikasi nama indikator pada sarana ini.")
            } else {
              throw errInsInd
            }
          }
        }

        const indToDelete = existingIndikatorIds.filter((id) => !currentIndIds.includes(id))
        if (indToDelete.length > 0) {
          await supabase.from("indikator_tambahan_kesehatan").delete().in("id", indToDelete).eq("sarana_kesehatan_id", activeSaranaId)
        }
      }

      if (!isFotoUploadSuccess) {
        alert("Data sarana kesehatan berhasil disimpan, namun unggah foto gagal. File foto telah dibersihkan dari Storage.")
      } else {
        alert(
          editingSaranaId
            ? "Sarana kesehatan berhasil diperbarui!"
            : "Sarana kesehatan berhasil ditambahkan! Silakan pilih 'Edit' pada sarana ini untuk mengelola rincian Fasilitas, Tenaga Kesehatan, dan Indikator Tambahan."
        )
      }

      resetFormSarana()
      await fetchSarana(pendataanId)
    } catch (simpanError: any) {
      console.error("simpan sarana error:", simpanError)

      if (simpanError?.code === "23505") {
        alert("Nama sarana kesehatan tersebut sudah tersedia pada periode pendataan ini. Mohon gunakan nama yang berbeda.")
      } else {
        alert(`Gagal menyimpan sarana kesehatan: ${simpanError?.message || "Terjadi kesalahan."}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const mulaiEditSarana = async (item: SaranaKesehatan) => {
    if (item.pendataan_id !== pendataanId) {
      alert("Sarana kesehatan ini tidak terikat pada periode pendataan ini.")
      return
    }

    setEditingSaranaId(item.id)
    setLoadingFasilitas(true)
    setLoadingTenaga(true)
    setLoadingIndikator(true)

    setFormSarana({
      nama_sarana: item.nama_sarana || "",
      jenis_slug: item.jenis_slug || "posyandu",
      alamat: item.alamat || "",
      status_operasional: item.status_operasional || "aktif",
      nomor_kontak: item.nomor_kontak || "",
      tautan_peta: item.tautan_peta || "",
      keterangan: item.keterangan || "",
      urutan: item.urutan?.toString() || "0",
      is_active: Boolean(item.is_active),
    })

    setExistingFotoUrl(item.foto_url || "")
    setExistingStoragePath(item.storage_path || "")
    setFotoFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Load 3 Tabel Rincian
    try {
      const { data: fasData } = await supabase
        .from("fasilitas_sarana_kesehatan")
        .select("*")
        .eq("sarana_kesehatan_id", item.id)
        .order("urutan", { ascending: true })

      const listFas = (fasData || []).map((f) => ({
        id: f.id,
        tempId: f.id,
        nama_fasilitas: f.nama_fasilitas || "",
        jumlah: (f.jumlah ?? 1).toString(),
        urutan: (f.urutan ?? 1).toString(),
        is_active: Boolean(f.is_active ?? true),
      }))
      setFormFasilitasList(listFas)
      setExistingFasilitasIds((fasData || []).map((f) => f.id))
    } catch {
      setFormFasilitasList([])
      setExistingFasilitasIds([])
    } finally {
      setLoadingFasilitas(false)
    }

    try {
      const { data: tngData } = await supabase
        .from("tenaga_kesehatan_sarana")
        .select("*")
        .eq("sarana_kesehatan_id", item.id)
        .order("urutan", { ascending: true })

      const listTng = (tngData || []).map((t) => ({
        id: t.id,
        tempId: t.id,
        jenis_tenaga: t.jenis_tenaga || "",
        jumlah: (t.jumlah ?? 1).toString(),
        urutan: (t.urutan ?? 1).toString(),
        is_active: Boolean(t.is_active ?? true),
      }))
      setFormTenagaList(listTng)
      setExistingTenagaIds((tngData || []).map((t) => t.id))
    } catch {
      setFormTenagaList([])
      setExistingTenagaIds([])
    } finally {
      setLoadingTenaga(false)
    }

    try {
      const { data: indData } = await supabase
        .from("indikator_tambahan_kesehatan")
        .select("*")
        .eq("sarana_kesehatan_id", item.id)
        .order("urutan", { ascending: true })

      const listInd = (indData || []).map((i) => ({
        id: i.id,
        tempId: i.id,
        nama_indikator: i.nama_indikator || "",
        nilai_indikator: i.nilai_indikator || "",
        satuan: i.satuan || "",
        keterangan: i.keterangan || "",
        urutan: (i.urutan ?? 1).toString(),
        is_active: Boolean(i.is_active ?? true),
      }))
      setFormIndikatorList(listInd)
      setExistingIndikatorIds((indData || []).map((i) => i.id))
    } catch {
      setFormIndikatorList([])
      setExistingIndikatorIds([])
    } finally {
      setLoadingIndikator(false)
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Handler Hapus Sarana Sesuai Koreksi 5
  const hapusSarana = async (item: SaranaKesehatan) => {
    if (loading) return
    if (item.pendataan_id !== pendataanId) {
      alert("Sarana kesehatan ini tidak terikat pada periode pendataan ini.")
      return
    }

    const session = await periksaSesi()
    if (!session) return

    const yakin = window.confirm(`Yakin ingin menghapus "${item.nama_sarana}"?`)
    if (!yakin) return

    setLoading(true)

    try {
      // 1. Simpan storage_path sebelum proses
      const pathFoto = item.storage_path || ambilPathFotoDariUrl(item.foto_url)

      // 2. Hapus Storage terlebih dahulu
      if (pathFoto) {
        const { error: errDelStorage } = await supabase.storage
          .from(BUCKET_FOTO_KESEHATAN)
          .remove([pathFoto])

        if (errDelStorage) {
          console.error("Gagal menghapus file foto dari Storage:", errDelStorage)
          alert(
            `Gagal menghapus file foto dari Storage: ${errDelStorage.message}. Penghapusan sarana kesehatan dibatalkan.`
          )
          setLoading(false)
          return
        }
      }

      // 3. Setelah Storage berhasil, baru hapus record database
      const { error: hapusError } = await supabase
        .from("sarana_kesehatan")
        .delete()
        .eq("id", item.id)
        .eq("pendataan_id", pendataanId)

      if (hapusError) {
        console.error("Gagal menghapus record sarana dari database:", hapusError)

        if (pathFoto) {
          // Kosongkan foto_url dan storage_path pada record DB yang tersisa (Koreksi 5)
          const { error: errNullify } = await supabase
            .from("sarana_kesehatan")
            .update({ foto_url: null, storage_path: null })
            .eq("id", item.id)

          if (errNullify) {
            console.error("Gagal mengosongkan URL foto pada database:", errNullify)
          }

          alert(
            `Record sarana kesehatan gagal dihapus dari database: ${hapusError.message}.\n\nNamun, file foto sarana kesehatan sudah terhapus dari Storage, dan tautan foto pada database telah dikosongkan agar tidak menunjuk file yang hilang.`
          )
        } else {
          alert(`Gagal menghapus sarana kesehatan: ${hapusError.message}`)
        }
        setLoading(false)
        return
      }

      alert("Sarana kesehatan berhasil dihapus.")

      if (editingSaranaId === item.id) {
        resetFormSarana()
      }

      await fetchSarana(pendataanId)
    } catch (hapusError: any) {
      console.error("hapus sarana error:", hapusError)
      alert(`Gagal menghapus sarana kesehatan: ${hapusError?.message || "Terjadi kesalahan."}`)
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
              href="/admin/kesehatan"
              className="rounded-lg p-2 transition-colors hover:bg-white/60"
              title="Kembali ke Riwayat Pendataan Kesehatan"
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
                Kelola Sarana Kesehatan
              </h1>

              <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                Kelola sarana kesehatan, fasilitas internal, dan tenaga kesehatan untuk periode terpilih
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

      {/* Kondisi Jika Pendataan Tidak Ditemukan / Error */}
      {loadingPendataan ? (
        <div className="w-full max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-lg">
            <p className="text-sm text-gray-500">Memuat detail periode pendataan kesehatan...</p>
          </div>
        </div>
      ) : pendataanError || !detailPendataan ? (
        <div className="w-full max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-xl border border-red-200 bg-white p-10 text-center shadow-lg">
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
        </div>
      ) : (
        <>
          {/* SECTION 1: Ringkasan & Form Sarana Kesehatan (Full Width) */}
          <div className="w-full max-w-5xl mx-auto px-4 mb-6 space-y-6">
            {/* Banner Ringkasan Periode */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      Pendataan Kesehatan Tahun {detailPendataan.tahun_pendataan}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        detailPendataan.status_publikasi === "dipublikasikan"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {detailPendataan.status_publikasi === "dipublikasikan"
                        ? "Dipublikasikan"
                        : "Draft"}
                    </span>
                    {detailPendataan.is_active && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Aktif
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    Sumber: <strong>{detailPendataan.sumber_data}</strong>
                    {detailPendataan.keterangan && (
                      <span className="ml-2 text-gray-500">— {detailPendataan.keterangan}</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f0e8db] px-3 py-1 text-xs font-semibold text-[#2c1b01]">
                    {saranaList.length} sarana kesehatan
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    WC Septic: {formatAngka(detailPendataan.wc_septic_tanah)}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    WC Tanpa Septic: {formatAngka(detailPendataan.wc_tanpa_septic)}
                  </span>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                    MCK Sungai: {formatAngka(detailPendataan.mck_sungai)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Sarana Kesehatan */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900">
                {editingSaranaId ? "Edit Sarana Kesehatan" : "Tambah Sarana Kesehatan"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Setiap sarana kesehatan disimpan pada periode pendataan kesehatan ini.
              </p>

              <form onSubmit={simpanSarana} className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nama Sarana Kesehatan
                    </label>

                    <input
                      type="text"
                      name="nama_sarana"
                      value={formSarana.nama_sarana}
                      onChange={ubahFormSarana}
                      placeholder="Contoh: Pustu Padang Sarai / Posyandu Mawar 1"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Jenis Sarana
                    </label>

                    <select
                      name="jenis_slug"
                      value={formSarana.jenis_slug}
                      onChange={ubahFormSarana}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    >
                      {PILIHAN_JENIS_SARANA.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Status Operasional
                    </label>

                    <select
                      name="status_operasional"
                      value={formSarana.status_operasional}
                      onChange={ubahFormSarana}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="tidak_aktif">Tidak Aktif</option>
                      <option value="dalam_pembangunan">Dalam Pembangunan</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="urutan"
                      value={formSarana.urutan}
                      onChange={ubahFormSarana}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Alamat Sarana
                  </label>

                  <textarea
                    name="alamat"
                    rows={3}
                    value={formSarana.alamat}
                    onChange={ubahFormSarana}
                    placeholder="Contoh: Jorong Padang Sarai, Nagari Aia Manggih Barat..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nomor Kontak
                    </label>
                    <input
                      type="text"
                      name="nomor_kontak"
                      value={formSarana.nomor_kontak}
                      onChange={ubahFormSarana}
                      placeholder="Contoh: 08xx-xxxx-xxxx"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tautan Google Maps (Wajib HTTPS)
                    </label>
                    <input
                      type="url"
                      name="tautan_peta"
                      value={formSarana.tautan_peta}
                      onChange={ubahFormSarana}
                      placeholder="https://maps.google.com/..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                    />
                  </div>
                </div>

                {/* --- HANYA TAMPILKAN TABEL RINCIAN JIKA EDITING SARANA ID VALID (KOREKSI 3) --- */}
                {!editingSaranaId ? (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-5 text-center">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      Rincian Fasilitas, Tenaga Kesehatan, & Indikator Tambahan
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Simpan data sarana kesehatan terlebih dahulu sebelum mengelola rincian Fasilitas, Tenaga Kesehatan, dan Indikator Tambahan.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* --- TABEL RINCIAN 1: FASILITAS SARANA --- */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Fasilitas Internal Sarana Kesehatan
                          </h3>
                          <p className="text-xs text-gray-500">
                            Ruang periksa, tempat tidur, peralatan imunisasi, laboratorium, dll.
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
                          <span>+ Tambah Fasilitas</span>
                        </button>
                      </div>

                      <datalist id="saran-fasilitas-kes-list">
                        {SARAN_FASILITAS.map((saran) => (
                          <option key={saran} value={saran} />
                        ))}
                      </datalist>

                      {loadingFasilitas ? (
                        <p className="py-4 text-center text-xs text-gray-500">Memuat fasilitas...</p>
                      ) : formFasilitasList.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                          <p className="text-xs text-gray-500">
                            Belum ada fasilitas ditambahkan. Klik "+ Tambah Fasilitas" di atas.
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
                                  list="saran-fasilitas-kes-list"
                                  placeholder="Nama fasilitas (mis. Ruang Periksa)"
                                  value={item.nama_fasilitas}
                                  onChange={(e) => ubahBarisFasilitas(index, "nama_fasilitas", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>

                              <div className="w-28 flex items-center gap-1">
                                <span className="text-xs text-gray-500">Jumlah:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.jumlah}
                                  onChange={(e) => ubahBarisFasilitas(index, "jumlah", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>

                              <label className="flex items-center gap-1.5 text-xs text-gray-600 px-2">
                                <input
                                  type="checkbox"
                                  checked={item.is_active ?? true}
                                  onChange={(e) => ubahBarisFasilitas(index, "is_active", e.target.checked)}
                                />
                                <span>Aktif</span>
                              </label>

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

                    {/* --- TABEL RINCIAN 2: TENAGA KESEHATAN --- */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Tenaga Kesehatan / Kader
                          </h3>
                          <p className="text-xs text-gray-500">
                            Rincian Dokter, Bidan, Perawat, maupun Kader Posyandu.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={tambahBarisTenaga}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#2c1b01] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3a2604] transition-colors"
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
                        <p className="py-4 text-center text-xs text-gray-500">Memuat tenaga kesehatan...</p>
                      ) : formTenagaList.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                          <p className="text-xs text-gray-500">
                            Belum ada tenaga kesehatan ditambahkan. Klik "+ Tambah Tenaga" di atas.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formTenagaList.map((item, index) => (
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
                                  list="saran-tenaga-kes-list"
                                  placeholder="Jenis tenaga (mis. Kader Posyandu)"
                                  value={item.jenis_tenaga}
                                  onChange={(e) => ubahBarisTenaga(index, "jenis_tenaga", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>

                              <div className="w-28 flex items-center gap-1">
                                <span className="text-xs text-gray-500">Jumlah:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.jumlah}
                                  onChange={(e) => ubahBarisTenaga(index, "jumlah", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>

                              <label className="flex items-center gap-1.5 text-xs text-gray-600 px-2">
                                <input
                                  type="checkbox"
                                  checked={item.is_active ?? true}
                                  onChange={(e) => ubahBarisTenaga(index, "is_active", e.target.checked)}
                                />
                                <span>Aktif</span>
                              </label>

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

                    {/* --- TABEL RINCIAN 3: INDIKATOR TAMBAHAN (KOREKSI 2) --- */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Indikator Tambahan
                          </h3>
                          <p className="text-xs text-gray-500">
                            Spesifikasi khusus seperti "Jumlah Posyandu Binaan", "Jam Operasional", satuan, & keterangan.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={tambahBarisIndikator}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#2c1b01] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3a2604] transition-colors"
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
                        <p className="py-4 text-center text-xs text-gray-500">Memuat indikator tambahan...</p>
                      ) : formIndikatorList.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                          <p className="text-xs text-gray-500">
                            Belum ada indikator tambahan ditambahkan. Klik "+ Tambah Indikator" di atas.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formIndikatorList.map((item, index) => (
                            <div
                              key={item.tempId || item.id || index}
                              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">
                                  Indikator #{index + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={item.is_active ?? true}
                                      onChange={(e) => ubahBarisIndikator(index, "is_active", e.target.checked)}
                                    />
                                    <span>Aktif</span>
                                  </label>
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
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-1">
                                  <input
                                    type="text"
                                    list="saran-indikator-kes-list"
                                    placeholder="Nama (mis. Jumlah Posyandu Binaan)"
                                    value={item.nama_indikator}
                                    onChange={(e) => ubahBarisIndikator(index, "nama_indikator", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                  />
                                </div>

                                <div className="sm:col-span-1">
                                  <input
                                    type="text"
                                    placeholder="Nilai (mis. 4 atau 24 Jam)"
                                    value={item.nilai_indikator}
                                    onChange={(e) => ubahBarisIndikator(index, "nilai_indikator", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                  />
                                </div>

                                <div className="sm:col-span-1">
                                  <input
                                    type="text"
                                    placeholder="Satuan, opsional (mis. Posyandu / Orang)"
                                    value={item.satuan || ""}
                                    onChange={(e) => ubahBarisIndikator(index, "satuan", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                  />
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  placeholder="Keterangan opsional (mis. Posyandu Balita Jorong Aia Manggih)"
                                  value={item.keterangan || ""}
                                  onChange={(e) => ubahBarisIndikator(index, "keterangan", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2c1b01]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Foto Sarana Kesehatan
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (opsional, JPG/PNG/WEBP, maksimal 2 MB)
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
                        src={previewFotoUrl}
                        alt="Pratinjau sarana kesehatan"
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
                    value={formSarana.keterangan}
                    onChange={ubahFormSarana}
                    placeholder="Tambahkan informasi lain bila diperlukan..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formSarana.is_active}
                    onChange={ubahFormSarana}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Aktifkan sarana kesehatan ini untuk ditampilkan
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
                      ? "Simpan Perubahan Sarana"
                      : "Tambah Sarana Kesehatan"}
                  </button>

                  {editingSaranaId && (
                    <button
                      type="button"
                      onClick={resetFormSarana}
                      className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* SECTION 2: Tabel Daftar Sarana Kesehatan (Full Width Table) */}
          <div className="w-full max-w-5xl mx-auto px-4 mb-6">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Daftar Sarana Kesehatan
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {saranaTersaring.length} dari {saranaList.length} data sarana kesehatan
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchSarana(pendataanId)}
                  disabled={loading || loadingSarana}
                  className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, jenis, alamat, atau status..."
                className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
              />

              {loadingSarana ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  Memuat sarana kesehatan...
                </p>
              ) : saranaTersaring.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  Belum ada sarana kesehatan yang tersimpan.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                        <th className="py-3 px-4 font-bold w-16 text-center">No.</th>
                        <th className="py-3 px-4 font-bold">Nama Sarana</th>
                        <th className="py-3 px-4 font-bold">Jenis</th>
                        <th className="py-3 px-4 font-bold text-center w-44">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {saranaTersaring.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-gray-50/80 ${
                            editingSaranaId === item.id ? "bg-yellow-50/50" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-medium text-gray-500">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {item.nama_sarana}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-xs">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                              {getLabelJenisSarana(item.jenis_slug)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => mulaiEditSarana(item)}
                                className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => hapusSarana(item)}
                                disabled={loading}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
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
        </>
      )}
    </div>
  )
}
