"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_DOKUMEN_PETA_NAGARI,
  BUCKET_GAMBAR_PETA_NAGARI,
  JenisPeta,
  MAKS_UKURAN_DOKUMEN_PETA,
  MAKS_UKURAN_GAMBAR_PETA,
  MIME_DOKUMEN_PETA,
  MIME_GAMBAR_PETA,
  PILIHAN_JENIS_PETA,
  PetaNagari,
  fetchSemuaPetaNagariAdmin,
  getLabelJenisPeta,
  isJenisPeta,
} from "@/lib/petaNagari"
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface FormPetaState {
  judul_peta: string
  jenis_peta: JenisPeta
  deskripsi: string
  tahun_peta: string
  sumber_peta: string
  teks_alt: string
}

export type CleanupTertunda = {
  id: string
  petaId: string
  bucket: string
  path: string
  jenis: "gambar" | "dokumen"
  pesan: string
}

export type HasilHapusFile = {
  berhasil: boolean
  sudahTidakAda: boolean
  errorMessage: string | null
}

const FORM_AWAL: FormPetaState = {
  judul_peta: "",
  jenis_peta: "administrasi",
  deskripsi: "",
  tahun_peta: new Date().getFullYear().toString(),
  sumber_peta: "",
  teks_alt: "",
}

/**
 * Helper internal untuk menormalisasi nama file menjadi aman untuk path Storage
 */
function buatNamaFileAman(namaFile: string): string {
  const dotIndex = namaFile.lastIndexOf(".")
  const ext = dotIndex !== -1 ? namaFile.slice(dotIndex).toLowerCase() : ""
  const baseName = dotIndex !== -1 ? namaFile.slice(0, dotIndex) : namaFile

  const baseSanitized = baseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const finalBase = baseSanitized || "file-peta"
  return `${finalBase}${ext}`
}

/**
 * Helper internal untuk menghapus file dari Storage secara aman
 */
async function hapusFileJikaAda(
  bucket: string,
  path: string | null
): Promise<HasilHapusFile> {
  if (!path || !path.trim()) {
    return { berhasil: true, sudahTidakAda: true, errorMessage: null }
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (!error) {
      return { berhasil: true, sudahTidakAda: false, errorMessage: null }
    }

    const msg = error.message.toLowerCase()
    if (msg.includes("not found") || msg.includes("404")) {
      return { berhasil: true, sudahTidakAda: true, errorMessage: null }
    }

    return { berhasil: false, sudahTidakAda: false, errorMessage: error.message }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { berhasil: false, sudahTidakAda: false, errorMessage: msg }
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

export default function AdminPetaNagariPage() {
  const [listPeta, setListPeta] = useState<PetaNagari[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<PetaNagari | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<PetaNagari | null>(null)

  const [formData, setFormData] = useState<FormPetaState>(FORM_AWAL)
  const [isTeksAltManual, setIsTeksAltManual] = useState(false)

  const [gambarFile, setGambarFile] = useState<File | null>(null)
  const [gambarPreviewUrl, setGambarPreviewUrl] = useState<string | null>(null)

  const [dokumenFile, setDokumenFile] = useState<File | null>(null)
  const [hapusPdfExisting, setHapusPdfExisting] = useState(false)

  const [processingToggleId, setProcessingToggleId] = useState<string | null>(null)
  const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(null)

  const [retryDeleteIds, setRetryDeleteIds] = useState<string[]>([])
  const [cleanupTertunda, setCleanupTertunda] = useState<CleanupTertunda[]>([])

  const tambahCleanupTertunda = (
    petaId: string,
    bucket: string,
    path: string,
    jenis: "gambar" | "dokumen",
    pesan: string
  ) => {
    const itemBaru: CleanupTertunda = {
      id: crypto.randomUUID(),
      petaId,
      bucket,
      path,
      jenis,
      pesan,
    }
    setCleanupTertunda((prev) => [...prev.filter((c) => c.path !== path), itemBaru])
  }

  const periksaSesi = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      window.location.href = "/login"
      return false
    }
    return true
  }

  const muatDataPeta = async () => {
    setLoadingList(true)
    const valid = await periksaSesi()
    if (!valid) {
      setLoadingList(false)
      return
    }

    try {
      const data = await fetchSemuaPetaNagariAdmin()
      setListPeta(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Gagal memuat daftar peta nagari: ${msg}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    muatDataPeta()
  }, [])

  // Auto dismiss success toast message after 4 seconds
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  const bersihkanPreviewGambar = () => {
    if (gambarPreviewUrl) {
      URL.revokeObjectURL(gambarPreviewUrl)
      setGambarPreviewUrl(null)
    }
  }

  const handleOpenTambah = () => {
    setPesanSukses(null)
    setPesanError(null)
    setEditingId(null)
    setEditingItem(null)
    setFormData(FORM_AWAL)
    setIsTeksAltManual(false)
    setGambarFile(null)
    bersihkanPreviewGambar()
    setDokumenFile(null)
    setHapusPdfExisting(false)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: PetaNagari) => {
    setPesanSukses(null)
    setPesanError(null)
    setEditingId(item.id)
    setEditingItem(item)
    setFormData({
      judul_peta: item.judul_peta,
      jenis_peta: item.jenis_peta,
      deskripsi: item.deskripsi || "",
      tahun_peta: item.tahun_peta.toString(),
      sumber_peta: item.sumber_peta,
      teks_alt: item.teks_alt,
    })
    setIsTeksAltManual(true)
    setGambarFile(null)
    bersihkanPreviewGambar()
    setDokumenFile(null)
    setHapusPdfExisting(false)
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setEditingItem(null)
    setFormData(FORM_AWAL)
    setIsTeksAltManual(false)
    setGambarFile(null)
    bersihkanPreviewGambar()
    setDokumenFile(null)
    setHapusPdfExisting(false)
  }

  const handleJudulChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!isTeksAltManual) {
      setFormData({
        ...formData,
        judul_peta: val,
        teks_alt: val,
      })
    } else {
      setFormData({
        ...formData,
        judul_peta: val,
      })
    }
  }

  const handleTeksAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTeksAltManual(true)
    setFormData({
      ...formData,
      teks_alt: e.target.value,
    })
  }

  const handleGambarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPesanError(null)
    const files = e.target.files
    if (!files || files.length === 0) {
      setGambarFile(null)
      bersihkanPreviewGambar()
      return
    }

    const file = files[0]
    if (!MIME_GAMBAR_PETA.includes(file.type as typeof MIME_GAMBAR_PETA[number])) {
      setPesanError("Format gambar harus JPEG, PNG, atau WebP.")
      e.target.value = ""
      setGambarFile(null)
      bersihkanPreviewGambar()
      return
    }

    if (file.size > MAKS_UKURAN_GAMBAR_PETA) {
      setPesanError("Ukuran gambar tidak boleh melebihi 15 MB.")
      e.target.value = ""
      setGambarFile(null)
      bersihkanPreviewGambar()
      return
    }

    setGambarFile(file)
    bersihkanPreviewGambar()
    setGambarPreviewUrl(URL.createObjectURL(file))
  }

  const handleDokumenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPesanError(null)
    const files = e.target.files
    if (!files || files.length === 0) {
      setDokumenFile(null)
      return
    }

    const file = files[0]
    if (!MIME_DOKUMEN_PETA.includes(file.type as typeof MIME_DOKUMEN_PETA[number])) {
      setPesanError("Format dokumen pendukung harus PDF.")
      e.target.value = ""
      setDokumenFile(null)
      return
    }

    if (file.size > MAKS_UKURAN_DOKUMEN_PETA) {
      setPesanError("Ukuran dokumen PDF tidak boleh melebihi 30 MB.")
      e.target.value = ""
      setDokumenFile(null)
      return
    }

    setDokumenFile(file)
    setHapusPdfExisting(false)
  }

  const handleHapusPdfExistingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dicentang = e.target.checked
    setHapusPdfExisting(dicentang)
    if (dicentang) {
      setDokumenFile(null)
    }
  }

  const handleLogout = async () => {
    await keluarDariAdmin("Logout error")
  }

  const validateClientForm = (): boolean => {
    if (!formData.judul_peta.trim()) {
      setPesanError("Judul Peta wajib diisi.")
      return false
    }
    if (!formData.tahun_peta.trim()) {
      setPesanError("Tahun Peta wajib diisi.")
      return false
    }
    const tahunNum = parseInt(formData.tahun_peta.trim(), 10)
    if (isNaN(tahunNum) || tahunNum < 1900 || tahunNum > 2100) {
      setPesanError("Tahun Peta tidak valid (1900-2100).")
      return false
    }
    if (!formData.sumber_peta.trim()) {
      setPesanError("Sumber Peta wajib diisi.")
      return false
    }
    if (!formData.teks_alt.trim()) {
      setPesanError("Teks Alternatif Gambar wajib diisi.")
      return false
    }
    return true
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPesanSukses(null)
    setPesanError(null)

    if (loadingForm) return
    if (!validateClientForm()) return

    setLoadingForm(true)

    const validSesi = await periksaSesi()
    if (!validSesi) {
      setLoadingForm(false)
      return
    }

    const judulClean = formData.judul_peta.trim()
    const deskripsiClean = formData.deskripsi.trim()
    const tahunNum = parseInt(formData.tahun_peta.trim(), 10)
    const sumberClean = formData.sumber_peta.trim()
    const teksAltClean = formData.teks_alt.trim()

    // ==========================================
    // MODE EDIT PETA NAGARI
    // ==========================================
    if (editingId && editingItem) {
      const petaId = editingId
      const timestamp = Date.now()
      const randomSuffix = crypto.randomUUID().slice(0, 8)

      let gambarPathBaru = editingItem.gambar_storage_path
      let gambarUrlBaru = editingItem.gambar_url

      let pdfPathBaru = hapusPdfExisting ? null : editingItem.file_storage_path
      let pdfUrlBaru = hapusPdfExisting ? null : editingItem.file_url

      const gambarPathLama = editingItem.gambar_storage_path
      const pdfPathLama = editingItem.file_storage_path

      try {
        // Step 1: Handle Gambar Baru (jika ada)
        if (gambarFile) {
          const namaGambarAman = buatNamaFileAman(gambarFile.name)
          gambarPathBaru = `peta-nagari/${petaId}/gambar/${timestamp}-${randomSuffix}-${namaGambarAman}`

          const { error: errUploadGambarBaru } = await supabase.storage
            .from(BUCKET_GAMBAR_PETA_NAGARI)
            .upload(gambarPathBaru, gambarFile, { upsert: false })

          if (errUploadGambarBaru) {
            setPesanError(`Gagal mengunggah gambar baru: ${errUploadGambarBaru.message}`)
            setLoadingForm(false)
            return
          }

          const { data: urlDataGambar } = supabase.storage
            .from(BUCKET_GAMBAR_PETA_NAGARI)
            .getPublicUrl(gambarPathBaru)
          gambarUrlBaru = urlDataGambar.publicUrl
        }

        // Step 2: Handle PDF (Tambah Baru / Replace / Remove)
        if (dokumenFile) {
          const namaPdfAman = buatNamaFileAman(dokumenFile.name)
          pdfPathBaru = `peta-nagari/${petaId}/dokumen/${timestamp}-${randomSuffix}-${namaPdfAman}`

          const { error: errUploadPdfBaru } = await supabase.storage
            .from(BUCKET_DOKUMEN_PETA_NAGARI)
            .upload(pdfPathBaru, dokumenFile, { upsert: false })

          if (errUploadPdfBaru) {
            if (gambarFile && gambarPathBaru !== gambarPathLama) {
              await hapusFileJikaAda(BUCKET_GAMBAR_PETA_NAGARI, gambarPathBaru)
            }
            setPesanError(
              `Gagal mengunggah PDF baru: ${errUploadPdfBaru.message}. Gambar baru yang sempat diunggah telah dibersihkan.`
            )
            setLoadingForm(false)
            return
          }

          const { data: urlDataPdf } = supabase.storage
            .from(BUCKET_DOKUMEN_PETA_NAGARI)
            .getPublicUrl(pdfPathBaru)
          pdfUrlBaru = urlDataPdf.publicUrl
        } else if (hapusPdfExisting) {
          pdfUrlBaru = null
          pdfPathBaru = null
        }

        // Step 3: Update Database (Tanpa mengubah is_active status)
        const payloadEdit = {
          judul_peta: judulClean,
          jenis_peta: formData.jenis_peta,
          deskripsi: deskripsiClean || null,
          tahun_peta: tahunNum,
          sumber_peta: sumberClean,
          gambar_url: gambarUrlBaru,
          gambar_storage_path: gambarPathBaru,
          file_url: pdfUrlBaru,
          file_storage_path: pdfPathBaru,
          teks_alt: teksAltClean,
        }

        const { error: errEditDb } = await supabase
          .from("peta_nagari")
          .update(payloadEdit)
          .eq("id", petaId)

        if (errEditDb) {
          if (gambarFile && gambarPathBaru !== gambarPathLama) {
            await hapusFileJikaAda(BUCKET_GAMBAR_PETA_NAGARI, gambarPathBaru)
          }
          if (dokumenFile && pdfPathBaru !== pdfPathLama) {
            await hapusFileJikaAda(BUCKET_DOKUMEN_PETA_NAGARI, pdfPathBaru)
          }

          if (errEditDb.code === "23505") {
            setPesanError(
              "Peta dengan jenis, judul, tahun, dan sumber yang sama sudah tersedia. Perubahan dibatalkan."
            )
          } else {
            setPesanError(
              `Gagal memperbarui data peta pada database: ${errEditDb.message}. File baru telah dibersihkan.`
            )
          }
          setLoadingForm(false)
          return
        }

        // Step 4: Cleanup File Lama
        const peringatanCleanup: string[] = []

        if (gambarFile && gambarPathLama && gambarPathBaru !== gambarPathLama) {
          const resCleanGambar = await hapusFileJikaAda(BUCKET_GAMBAR_PETA_NAGARI, gambarPathLama)
          if (!resCleanGambar.berhasil) {
            peringatanCleanup.push(`Gambar lama gagal dibersihkan (${resCleanGambar.errorMessage})`)
            tambahCleanupTertunda(
              petaId,
              BUCKET_GAMBAR_PETA_NAGARI,
              gambarPathLama,
              "gambar",
              `Gambar lama peta "${judulClean}" gagal dibersihkan`
            )
          }
        }

        if ((dokumenFile || hapusPdfExisting) && pdfPathLama && pdfPathBaru !== pdfPathLama) {
          const resCleanPdf = await hapusFileJikaAda(BUCKET_DOKUMEN_PETA_NAGARI, pdfPathLama)
          if (!resCleanPdf.berhasil) {
            peringatanCleanup.push(`PDF lama gagal dibersihkan (${resCleanPdf.errorMessage})`)
            tambahCleanupTertunda(
              petaId,
              BUCKET_DOKUMEN_PETA_NAGARI,
              pdfPathLama,
              "dokumen",
              `PDF lama peta "${judulClean}" gagal dibersihkan`
            )
          }
        }

        if (peringatanCleanup.length > 0) {
          setPesanSukses(
            `Perubahan peta "${judulClean}" berhasil disimpan! Catatan: ${peringatanCleanup.join(
              "; "
            )}.`
          )
        } else {
          setPesanSukses(`Perubahan peta "${judulClean}" berhasil disimpan!`)
        }

        handleBatalForm()
        await muatDataPeta()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setPesanError(`Terjadi kesalahan saat mengedit peta: ${msg}`)
      } finally {
        setLoadingForm(false)
      }
      return
    }

    // ==========================================
    // MODE TAMBAH PETA BARU (SAFE CREATE FLOW - OTOMATIS AKTIF)
    // ==========================================
    if (!gambarFile) {
      setPesanError("Gambar Utama Peta wajib diunggah untuk peta baru.")
      setLoadingForm(false)
      return
    }

    const petaId = crypto.randomUUID()
    const timestamp = Date.now()
    const randomSuffix = crypto.randomUUID().slice(0, 8)

    const namaGambarAman = buatNamaFileAman(gambarFile.name)
    const gambarStoragePath = `peta-nagari/${petaId}/gambar/${timestamp}-${randomSuffix}-${namaGambarAman}`

    let pdfStoragePath: string | null = null
    let pdfPublicUrl: string | null = null

    try {
      // Step 1: Upload Gambar ke BUCKET_GAMBAR_PETA_NAGARI
      const { error: errUploadGambar } = await supabase.storage
        .from(BUCKET_GAMBAR_PETA_NAGARI)
        .upload(gambarStoragePath, gambarFile, { upsert: false })

      if (errUploadGambar) {
        setPesanError(`Gagal mengunggah gambar peta ke Storage: ${errUploadGambar.message}`)
        setLoadingForm(false)
        return
      }

      const { data: dataUrlGambar } = supabase.storage
        .from(BUCKET_GAMBAR_PETA_NAGARI)
        .getPublicUrl(gambarStoragePath)
      const gambarPublicUrl = dataUrlGambar.publicUrl

      // Step 2: Upload PDF ke BUCKET_DOKUMEN_PETA_NAGARI (jika ada)
      if (dokumenFile) {
        const namaPdfAman = buatNamaFileAman(dokumenFile.name)
        pdfStoragePath = `peta-nagari/${petaId}/dokumen/${timestamp}-${randomSuffix}-${namaPdfAman}`

        const { error: errUploadPdf } = await supabase.storage
          .from(BUCKET_DOKUMEN_PETA_NAGARI)
          .upload(pdfStoragePath, dokumenFile, { upsert: false })

        if (errUploadPdf) {
          await supabase.storage.from(BUCKET_GAMBAR_PETA_NAGARI).remove([gambarStoragePath])
          setPesanError(`Gagal mengunggah file PDF: ${errUploadPdf.message}. Gambar baru telah dibersihkan.`)
          setLoadingForm(false)
          return
        }

        const { data: dataUrlPdf } = supabase.storage
          .from(BUCKET_DOKUMEN_PETA_NAGARI)
          .getPublicUrl(pdfStoragePath)
        pdfPublicUrl = dataUrlPdf.publicUrl
      }

      // Step 3: Insert Record ke Database (is_active: true -> Otomatis Aktif)
      const payloadInsert = {
        id: petaId,
        judul_peta: judulClean,
        jenis_peta: formData.jenis_peta,
        deskripsi: deskripsiClean || null,
        tahun_peta: tahunNum,
        sumber_peta: sumberClean,
        gambar_url: gambarPublicUrl,
        gambar_storage_path: gambarStoragePath,
        file_url: pdfPublicUrl,
        file_storage_path: pdfStoragePath,
        teks_alt: teksAltClean,
        is_active: true, // OTOMATIS AKTIF SAAT CREATE
        urutan: 0,
      }

      const { error: errInsertDb } = await supabase
        .from("peta_nagari")
        .insert(payloadInsert)

      if (errInsertDb) {
        await supabase.storage.from(BUCKET_GAMBAR_PETA_NAGARI).remove([gambarStoragePath])
        if (pdfStoragePath) {
          await supabase.storage.from(BUCKET_DOKUMEN_PETA_NAGARI).remove([pdfStoragePath])
        }

        if (errInsertDb.code === "23505") {
          setPesanError("Peta dengan jenis, judul, tahun, dan sumber yang sama sudah tersedia.")
        } else {
          setPesanError(`Gagal menyimpan data ke database: ${errInsertDb.message}.`)
        }
        setLoadingForm(false)
        return
      }

      setPesanSukses(`Peta Nagari "${judulClean}" berhasil ditambahkan!`)
      handleBatalForm()
      await muatDataPeta()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan sistem saat menyimpan peta: ${msg}`)
    } finally {
      setLoadingForm(false)
    }
  }

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (item: PetaNagari) => {
    setPesanSukses(null)
    setPesanError(null)
    setProcessingToggleId(item.id)

    try {
      const statusBaru = !item.is_active
      const { error: errToggle } = await supabase
        .from("peta_nagari")
        .update({ is_active: statusBaru })
        .eq("id", item.id)

      if (errToggle) {
        setPesanError(`Gagal mengubah status publikasi peta "${item.judul_peta}": ${errToggle.message}`)
      } else {
        setPesanSukses(
          `Status publikasi peta "${item.judul_peta}" berhasil diubah menjadi ${
            statusBaru ? "Aktif" : "Nonaktif"
          }.`
        )
        await muatDataPeta()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan: ${msg}`)
    } finally {
      setProcessingToggleId(null)
    }
  }

  const handleHapusRecord = (item: PetaNagari) => {
    setDeleteTarget(item)
  }

  const executeHapusRecord = async (item: PetaNagari) => {
    setPesanSukses(null)
    setPesanError(null)
    setProcessingDeleteId(item.id)

    const petaId = item.id
    const gambarPathLama = item.gambar_storage_path
    const pdfPathLama = item.file_storage_path

    try {
      if (item.is_active) {
        const { error: errNonaktif } = await supabase
          .from("peta_nagari")
          .update({ is_active: false })
          .eq("id", petaId)

        if (errNonaktif) {
          const msg = `Gagal menonaktifkan peta sebelum dihapus: ${errNonaktif.message}`
          setPesanError(msg)
          showError(msg)
          setProcessingDeleteId(null)
          return
        }
      }

      if (pdfPathLama) {
        const { error: errNullPdf } = await supabase
          .from("peta_nagari")
          .update({ file_url: null, file_storage_path: null })
          .eq("id", petaId)

        if (errNullPdf) {
          const msg = `Gagal memperbarui database pasangan PDF: ${errNullPdf.message}. Hapus dibatalkan.`
          setPesanError(msg)
          showError(msg)
          setProcessingDeleteId(null)
          return
        }

        const resPdf = await hapusFileJikaAda(BUCKET_DOKUMEN_PETA_NAGARI, pdfPathLama)
        if (!resPdf.berhasil) {
          tambahCleanupTertunda(
            petaId,
            BUCKET_DOKUMEN_PETA_NAGARI,
            pdfPathLama,
            "dokumen",
            `PDF peta "${item.judul_peta}" gagal dihapus saat penghapusan`
          )
        }
      }

      const { error: errNullGambar } = await supabase
        .from("peta_nagari")
        .update({ gambar_url: "", gambar_storage_path: "" })
        .eq("id", petaId)

      if (errNullGambar) {
        const msg = `Gagal memperbarui database pasangan gambar: ${errNullGambar.message}. Hapus dibatalkan.`
        setPesanError(msg)
        showError(msg)
        setProcessingDeleteId(null)
        return
      }

      const resGambar = await hapusFileJikaAda(BUCKET_GAMBAR_PETA_NAGARI, gambarPathLama)
      if (!resGambar.berhasil) {
        tambahCleanupTertunda(
          petaId,
          BUCKET_GAMBAR_PETA_NAGARI,
          gambarPathLama,
          "gambar",
          `Gambar peta "${item.judul_peta}" gagal dihapus saat penghapusan`
        )
      }

      const { error: errDeleteDb } = await supabase
        .from("peta_nagari")
        .delete()
        .eq("id", petaId)

      if (errDeleteDb) {
        if (!retryDeleteIds.includes(petaId)) {
          setRetryDeleteIds((prev) => [...prev, petaId])
        }
        const msg = `Storage file berhasil dibersihkan, tetapi gagal menghapus record database: ${errDeleteDb.message}. Tombol 'Retry Hapus' telah diaktifkan.`
        setPesanError(msg)
        showError(msg)
        setProcessingDeleteId(null)
        return
      }

      setRetryDeleteIds((prev) => prev.filter((id) => id !== petaId))
      const msg = `Peta Nagari "${item.judul_peta}" berhasil dihapus.`
      setPesanSukses(msg)
      showSuccess(msg)

      if (editingId === petaId) {
        handleBatalForm()
      }

      await muatDataPeta()
    } catch (err: unknown) {
      const e = err as Error
      const msg = `Terjadi kesalahan saat menghapus peta: ${e?.message || "Kesalahan tidak diketahui"}`
      setPesanError(msg)
      showError(msg)
    } finally {
      setProcessingDeleteId(null)
    }
  }

  const handleRetryCleanup = async (item: CleanupTertunda) => {
    const res = await hapusFileJikaAda(item.bucket, item.path)
    if (res.berhasil) {
      setCleanupTertunda((prev) => prev.filter((c) => c.id !== item.id))
      setPesanSukses(`Pembersihan file tertunda (${item.jenis}) berhasil!`)
    } else {
      setPesanError(`Gagal membersihkan file tertunda: ${res.errorMessage}`)
    }
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
                  Kelola Peta Nagari
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Geospatial
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola peta wilayah, batas jorong &amp; spasial Nagari Aia Manggih Barat.
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
                <span>Tambah Peta Nagari Baru</span>
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

        {/* Pembersihan File Tertunda Alert */}
        {cleanupTertunda.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Pembersihan File Storage Tertunda ({cleanupTertunda.length})</span>
              </h3>
            </div>
            <p className="text-xs text-amber-800">
              Terdapat file lama di Storage yang belum berhasil dibersihkan secara otomatis saat pengeditan/penghapusan. Anda dapat mencoba membersihkannya kembali di bawah ini:
            </p>
            <div className="space-y-2">
              {cleanupTertunda.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-amber-200 text-xs">
                  <div className="min-w-0 pr-3">
                    <span className="font-semibold text-gray-900 block truncate">{item.pesan}</span>
                    <span className="text-gray-500 font-mono block text-[11px] truncate">Bucket: {item.bucket} | Path: {item.path}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRetryCleanup(item)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm transition"
                  >
                    Coba Bersihkan Lagi
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: FORM TAMBAH / EDIT PETA NAGARI (KREM HEADER, WHITE BODY) */}
        {isFormOpen && (
          <div id="form-peta-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section (Samakan Gaya Layanan Informasi) */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {editingId ? "Edit Peta Nagari" : "Tambah Peta Nagari Baru"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingId
                  ? "Ubah data dan dokumen peta Nagari."
                  : "Tambahkan jenis peta administrasi, kebencanaan, atau tematik."}
              </p>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Baris 1: Judul & Jenis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Judul Peta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.judul_peta}
                    onChange={handleJudulChange}
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Contoh: Peta Administrasi Nagari Aia Manggih Barat"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jenis Peta <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jenis_peta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenis_peta: e.target.value as JenisPeta,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                  >
                    {PILIHAN_JENIS_PETA.map((opsi) => (
                      <option key={opsi.value} value={opsi.value}>
                        {opsi.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Baris 2: Tahun & Sumber */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tahun Peta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={formData.tahun_peta}
                    onChange={(e) =>
                      setFormData({ ...formData, tahun_peta: e.target.value })
                    }
                    onFocus={(e) => e.currentTarget.select()}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Sumber Peta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sumber_peta}
                    onChange={(e) =>
                      setFormData({ ...formData, sumber_peta: e.target.value })
                    }
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Masukkan sumber resmi peta"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                  />
                </div>
              </div>

              {/* Baris 3: Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Deskripsi Peta (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Keterangan singkat mengenai cakupan wilayah, legenda, atau catatan peta..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                />
              </div>

              {/* Baris 4: Teks Alternatif Gambar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Teks Alternatif Gambar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.teks_alt}
                  onChange={handleTeksAltChange}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Contoh: Peta Administrasi Nagari Aia Manggih Barat"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Digunakan untuk aksesibilitas pembaca layar gambar peta.
                </p>
              </div>

              {/* Baris 5: Input Gambar & File PDF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                {/* Gambar Input / Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {editingId ? "Ganti Gambar Utama Peta (Opsional)" : "Gambar Utama Peta *"}
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleGambarFileChange}
                    required={!editingId}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2c1b01] file:text-white hover:file:bg-[#6b4b1d] cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingId
                      ? "Biarkan kosong untuk mempertahankan gambar yang sekarang (Format: JPEG, PNG, WebP, max 15 MB)."
                      : "Format: JPEG, PNG, WebP. Ukuran maksimal: 15 MB."}
                  </p>

                  {/* Preview Gambar Baru atau Existing */}
                  {gambarPreviewUrl ? (
                    <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <p className="text-[11px] font-semibold text-green-700 mb-1">✓ Preview Gambar Baru Terpilih:</p>
                      <img
                        src={gambarPreviewUrl}
                        alt="Preview gambar baru"
                        className="h-full w-full object-contain rounded"
                      />
                    </div>
                  ) : editingItem?.gambar_url ? (
                    <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <p className="text-[11px] font-medium text-gray-500 mb-1">Gambar Utama Saat Ini:</p>
                      <img
                        src={editingItem.gambar_url}
                        alt={editingItem.teks_alt || editingItem.judul_peta}
                        className="h-full w-full object-contain rounded"
                      />
                    </div>
                  ) : null}
                </div>

                {/* PDF Input / Options */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {editingId ? "Kelola Dokumen PDF (Opsional)" : "Dokumen PDF Peta (Opsional)"}
                  </label>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleDokumenFileChange}
                    disabled={hapusPdfExisting}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2c1b01] file:text-white hover:file:bg-[#6b4b1d] cursor-pointer disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingId
                      ? "Biarkan kosong untuk mempertahankan PDF yang sekarang (Format: PDF, max 30 MB)."
                      : "Format: PDF. Ukuran maksimal: 30 MB."}
                  </p>

                  {/* Status & Options PDF Existing */}
                  {editingItem?.file_url && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700">PDF Terpasang Saat Ini:</span>
                        <a
                          href={editingItem.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-red-700 hover:underline flex items-center gap-1"
                        >
                          <span>Buka PDF ↗</span>
                        </a>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-red-700 hover:text-red-900">
                          <input
                            type="checkbox"
                            checked={hapusPdfExisting}
                            onChange={handleHapusPdfExistingChange}
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                          <span>Hapus dokumen PDF dari peta ini</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {dokumenFile && (
                    <p className="mt-2 text-xs font-semibold text-green-700 flex items-center gap-1">
                      <span>✓ File PDF baru terpilih:</span>
                      <span className="underline">{dokumenFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons (Single Batal Button + Save) */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  disabled={loadingForm}
                  className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  {loadingForm ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : editingId ? (
                    <span>Simpan Perubahan Peta</span>
                  ) : (
                    <span>Simpan Peta Baru</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel Daftar Peta Nagari */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Daftar Peta Nagari
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Seluruh data peta administrasi, kebencanaan, dan tematik yang terdaftar.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              Total: {listPeta.length} peta
            </span>
          </div>

          {loadingList ? (
            <div className="py-12 text-center text-sm text-gray-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent mb-3"></div>
              <p>Memuat daftar peta nagari...</p>
            </div>
          ) : listPeta.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Belum ada data peta nagari.
              </h3>
              <p className="text-xs text-gray-500">
                Silakan tambah peta baru untuk dipublikasikan pada slider beranda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold w-24">Preview</th>
                    <th scope="col" className="px-6 py-4 font-bold">Judul & Jenis</th>
                    <th scope="col" className="px-6 py-4 font-bold">Tahun & Sumber</th>
                    <th scope="col" className="px-6 py-4 font-bold">Dokumen PDF</th>
                    <th scope="col" className="px-6 py-4 text-right font-bold w-64">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {listPeta.map((item) => {
                    const isProcessing =
                      processingToggleId === item.id ||
                      processingDeleteId === item.id ||
                      (editingId === item.id && loadingForm)

                    const isRetryMode = retryDeleteIds.includes(item.id)

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Preview */}
                        <td className="px-6 py-4">
                          <div className="relative aspect-video w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                            <img
                              src={item.gambar_url}
                              alt={item.teks_alt || item.judul_peta}
                              className="h-full w-full object-contain rounded"
                            />
                          </div>
                        </td>

                        {/* Judul & Jenis */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">
                            {item.judul_peta}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-md bg-[#f7f2e8] px-2.5 py-0.5 text-xs font-semibold text-[#6b4b1d] border border-gray-200">
                              {getLabelJenisPeta(item.jenis_peta)}
                            </span>
                          </div>
                          {item.deskripsi && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                              {item.deskripsi}
                            </p>
                          )}
                        </td>

                        {/* Tahun & Sumber */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-gray-900">
                            Tahun: {item.tahun_peta}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {item.sumber_peta}
                          </div>
                        </td>

                        {/* Dokumen PDF */}
                        <td className="px-6 py-4">
                          {item.file_url ? (
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Buka dokumen PDF untuk ${item.judul_peta}`}
                              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100 transition"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <span>PDF Tersedia ↗</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                              Tidak ada PDF
                            </span>
                          )}
                        </td>

                        {/* Aksi (Edit, Aktifkan/Nonaktifkan, Hapus/Retry) */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              disabled={isProcessing}
                              aria-label={`Edit ${item.judul_peta}`}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>

                            {/* Tombol Toggle Status Cepat */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              disabled={isProcessing}
                              aria-label={`${item.is_active ? "Nonaktifkan" : "Aktifkan"} ${item.judul_peta}`}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                                item.is_active
                                  ? "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                                  : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              }`}
                            >
                              {processingToggleId === item.id
                                ? "..."
                                : item.is_active
                                ? "Nonaktifkan"
                                : "Aktifkan"}
                            </button>

                            {/* Tombol Hapus / Retry Hapus */}
                            <button
                              type="button"
                              onClick={() => handleHapusRecord(item)}
                              disabled={isProcessing}
                              aria-label={`${isRetryMode ? "Retry Hapus" : "Hapus"} ${item.judul_peta}`}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                            >
                              {processingDeleteId === item.id
                                ? "..."
                                : isRetryMode
                                ? "Retry Hapus"
                                : "Hapus"}
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={retryDeleteIds.includes(deleteTarget?.id || "") ? "⚠ Retry Hapus Peta?" : "⚠ Hapus Peta Nagari?"}
        message={
          <>
            Apakah Anda yakin ingin menghapus peta <strong>&quot;{deleteTarget?.judul_peta}&quot;</strong>?
            <br />
            File gambar utama dan dokumen PDF (jika ada) di Storage juga akan dihapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(processingDeleteId)}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeHapusRecord(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
