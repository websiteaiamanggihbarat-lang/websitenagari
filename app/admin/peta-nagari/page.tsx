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

interface FormPetaState {
  judul_peta: string
  jenis_peta: JenisPeta
  deskripsi: string
  tahun_peta: string
  sumber_peta: string
  teks_alt: string
  urutan: string
  is_active: boolean
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
  urutan: "0",
  is_active: false,
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
      setPesanError(`Gagal memuat data peta: ${msg}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    muatDataPeta()
  }, [])

  // Clean up object URL preview ketika unmount atau file berubah
  useEffect(() => {
    return () => {
      if (gambarPreviewUrl) {
        URL.revokeObjectURL(gambarPreviewUrl)
      }
    }
  }, [gambarPreviewUrl])

  const handleLogout = async () => {
    setLoadingList(true)
    await keluarDariAdmin("Logout error")
  }

  const handleOpenTambah = () => {
    if (gambarPreviewUrl) {
      URL.revokeObjectURL(gambarPreviewUrl)
    }
    setEditingId(null)
    setEditingItem(null)
    setFormData(FORM_AWAL)
    setIsTeksAltManual(false)
    setGambarFile(null)
    setGambarPreviewUrl(null)
    setDokumenFile(null)
    setHapusPdfExisting(false)
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: PetaNagari) => {
    if (gambarPreviewUrl) {
      URL.revokeObjectURL(gambarPreviewUrl)
    }
    setEditingId(item.id)
    setEditingItem(item)
    setFormData({
      judul_peta: item.judul_peta || "",
      jenis_peta: item.jenis_peta || "administrasi",
      deskripsi: item.deskripsi || "",
      tahun_peta: (item.tahun_peta ?? new Date().getFullYear()).toString(),
      sumber_peta: item.sumber_peta || "",
      teks_alt: item.teks_alt || "",
      urutan: (item.urutan ?? 0).toString(),
      is_active: item.is_active,
    })
    setIsTeksAltManual(true)
    setGambarFile(null)
    setGambarPreviewUrl(null)
    setDokumenFile(null)
    setHapusPdfExisting(false)
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)
  }

  const handleBatalForm = () => {
    if (gambarPreviewUrl) {
      URL.revokeObjectURL(gambarPreviewUrl)
    }
    setIsFormOpen(false)
    setEditingId(null)
    setEditingItem(null)
    setFormData(FORM_AWAL)
    setIsTeksAltManual(false)
    setGambarFile(null)
    setGambarPreviewUrl(null)
    setDokumenFile(null)
    setHapusPdfExisting(false)
  }

  const handleJudulChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const updatedForm = { ...formData, judul_peta: val }
    if (!isTeksAltManual && !editingId) {
      updatedForm.teks_alt = val ? `Peta ${val}` : ""
    }
    setFormData(updatedForm)
  }

  const handleTeksAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTeksAltManual(true)
    setFormData({ ...formData, teks_alt: e.target.value })
  }

  const handleGambarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (gambarPreviewUrl) {
      URL.revokeObjectURL(gambarPreviewUrl)
      setGambarPreviewUrl(null)
    }

    if (!file) {
      setGambarFile(null)
      return
    }

    // Validasi MIME & Ukuran Gambar
    if (!MIME_GAMBAR_PETA.includes(file.type as any)) {
      setPesanError("Format gambar harus JPEG, PNG, atau WebP.")
      e.target.value = ""
      setGambarFile(null)
      return
    }

    if (file.size > MAKS_UKURAN_GAMBAR_PETA) {
      setPesanError("Ukuran gambar maksimal 15 MB.")
      e.target.value = ""
      setGambarFile(null)
      return
    }

    setPesanError(null)
    setGambarFile(file)
    setGambarPreviewUrl(URL.createObjectURL(file))
  }

  const handleDokumenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) {
      setDokumenFile(null)
      return
    }

    // Validasi MIME & Ukuran PDF
    if (!MIME_DOKUMEN_PETA.includes(file.type as any)) {
      setPesanError("Format dokumen harus PDF.")
      e.target.value = ""
      setDokumenFile(null)
      return
    }

    if (file.size > MAKS_UKURAN_DOKUMEN_PETA) {
      setPesanError("Ukuran dokumen maksimal 30 MB.")
      e.target.value = ""
      setDokumenFile(null)
      return
    }

    setPesanError(null)
    setHapusPdfExisting(false) // Memilih PDF baru otomatis membatalkan tanda hapus PDF existing
    setDokumenFile(file)
  }

  const handleHapusPdfExistingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setHapusPdfExisting(isChecked)
    if (isChecked) {
      setDokumenFile(null) // Menandai hapus PDF existing otomatis mereset file PDF baru
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setPesanSukses(null)
    setPesanError(null)

    // 1. Validasi Metadata dasar
    const judulClean = formData.judul_peta.trim()
    const sumberClean = formData.sumber_peta.trim()
    const teksAltClean = formData.teks_alt.trim()
    const deskripsiClean = formData.deskripsi.trim()

    if (!judulClean) {
      setPesanError("Judul Peta wajib diisi.")
      return
    }

    if (!isJenisPeta(formData.jenis_peta)) {
      setPesanError("Jenis Peta tidak valid.")
      return
    }

    const tahunNum = parseInt(formData.tahun_peta, 10)
    if (isNaN(tahunNum) || tahunNum < 1900 || tahunNum > 2100) {
      setPesanError("Tahun Peta harus berupa angka rentang 1900 - 2100.")
      return
    }

    if (!sumberClean) {
      setPesanError("Sumber Peta wajib diisi.")
      return
    }

    if (!teksAltClean) {
      setPesanError("Teks Alternatif Gambar wajib diisi.")
      return
    }

    const urutanNum = parseInt(formData.urutan, 10)
    if (isNaN(urutanNum) || urutanNum < 0) {
      setPesanError("Urutan Tampil minimal 0.")
      return
    }

    setLoadingForm(true)

    // ==========================================
    // MODE EDIT TERPADU (TAHAP 05B)
    // ==========================================
    if (editingId && editingItem) {
      try {
        const petaId = editingId
        const timestamp = Date.now()
        const randomSuffix = crypto.randomUUID().slice(0, 8)

        const gambarUrlLama = editingItem.gambar_url
        const gambarPathLama = editingItem.gambar_storage_path
        const pdfUrlLama = editingItem.file_url
        const pdfPathLama = editingItem.file_storage_path

        let gambarUrlBaru = gambarUrlLama
        let gambarPathBaru = gambarPathLama

        let pdfUrlBaru = pdfUrlLama
        let pdfPathBaru = pdfPathLama

        // Step 1: Upload Gambar Baru jika dipilih
        if (gambarFile) {
          const namaGambarAman = buatNamaFileAman(gambarFile.name)
          gambarPathBaru = `peta-nagari/${petaId}/gambar/${timestamp}-${randomSuffix}-${namaGambarAman}`

          const { error: errUploadGambarBaru } = await supabase.storage
            .from(BUCKET_GAMBAR_PETA_NAGARI)
            .upload(gambarPathBaru, gambarFile, { upsert: false })

          if (errUploadGambarBaru) {
            setPesanError(`Gagal mengunggah gambar peta baru: ${errUploadGambarBaru.message}`)
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
            // Rollback Gambar Baru jika sempat diunggah
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

        // Step 3: Update Database (Satu Payload Terpadu)
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
          urutan: urutanNum,
          is_active: formData.is_active,
        }

        const { error: errEditDb } = await supabase
          .from("peta_nagari")
          .update(payloadEdit)
          .eq("id", petaId)

        if (errEditDb) {
          // Rollback file baru jika DB Update Gagal
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

        // Step 4: Cleanup File Lama (Hanya Setelah DB Update Berhasil!)
        const peringatanCleanup: string[] = []

        // Cleanup Gambar Lama jika diganti
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

        // Cleanup PDF Lama jika diganti atau dihapus
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
            )}. Silakan bersihkan file tertunda jika diperlukan.`
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
    // MODE TAMBAH PETA BARU (SAFE CREATE FLOW)
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
          const { error: errRollbackGambar } = await supabase.storage
            .from(BUCKET_GAMBAR_PETA_NAGARI)
            .remove([gambarStoragePath])

          const statusRollback = errRollbackGambar
            ? `Gambar baru gagal dibersihkan dari Storage (Path: ${gambarStoragePath}).`
            : "Gambar baru berhasil dibersihkan dari Storage."

          setPesanError(
            `Gagal mengunggah file PDF: ${errUploadPdf.message}. ${statusRollback}`
          )
          setLoadingForm(false)
          return
        }

        const { data: dataUrlPdf } = supabase.storage
          .from(BUCKET_DOKUMEN_PETA_NAGARI)
          .getPublicUrl(pdfStoragePath)
        pdfPublicUrl = dataUrlPdf.publicUrl
      }

      // Step 3: Insert Record ke Database
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
        is_active: formData.is_active,
        urutan: urutanNum,
      }

      const { error: errInsertDb } = await supabase
        .from("peta_nagari")
        .insert(payloadInsert)

      if (errInsertDb) {
        const rollbackErrors: string[] = []

        const { error: errRbImg } = await supabase.storage
          .from(BUCKET_GAMBAR_PETA_NAGARI)
          .remove([gambarStoragePath])
        if (errRbImg) {
          rollbackErrors.push(`Gambar gagal dibersihkan (Path: ${gambarStoragePath})`)
        } else {
          rollbackErrors.push("Gambar berhasil dibersihkan")
        }

        if (pdfStoragePath) {
          const { error: errRbPdf } = await supabase.storage
            .from(BUCKET_DOKUMEN_PETA_NAGARI)
            .remove([pdfStoragePath])
          if (errRbPdf) {
            rollbackErrors.push(`PDF gagal dibersihkan (Path: ${pdfStoragePath})`)
          } else {
            rollbackErrors.push("PDF berhasil dibersihkan")
          }
        }

        const rollbackReport = rollbackErrors.join(", ")

        if (errInsertDb.code === "23505") {
          setPesanError(
            `Peta dengan jenis, judul, tahun, dan sumber yang sama sudah tersedia. Rollback file: ${rollbackReport}.`
          )
        } else {
          setPesanError(
            `Gagal menyimpan data ke database: ${errInsertDb.message}. Rollback file: ${rollbackReport}.`
          )
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

  // ==========================================
  // TOGGLE STATUS AKTIF / NONAKTIF CEPAT
  // ==========================================
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

  // ==========================================
  // SAFE DELETE FLOW FINAL (HAPUS / RETRY)
  // ==========================================
  const handleHapusRecord = async (item: PetaNagari) => {
    const isRetryMode = retryDeleteIds.includes(item.id)
    const pesanKonfirmasi = isRetryMode
      ? `Coba hapus kembali record database untuk peta "${item.judul_peta}"?`
      : `Apakah Anda yakin ingin menghapus peta "${item.judul_peta}"?\n\nFile gambar utama dan dokumen PDF (jika ada) di Storage juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`

    if (!window.confirm(pesanKonfirmasi)) return

    setPesanSukses(null)
    setPesanError(null)
    setProcessingDeleteId(item.id)

    const petaId = item.id
    const gambarPathLama = item.gambar_storage_path
    const pdfPathLama = item.file_storage_path

    try {
      // Step 1: Penonaktifan DB Eksplisit
      if (item.is_active) {
        const { error: errNonaktif } = await supabase
          .from("peta_nagari")
          .update({ is_active: false })
          .eq("id", petaId)

        if (errNonaktif) {
          setPesanError(`Gagal menonaktifkan peta sebelum dihapus: ${errNonaktif.message}`)
          setProcessingDeleteId(null)
          return
        }
      }

      // Step 2: Hapus PDF jika record mempunyai PDF
      if (pdfPathLama) {
        // 2a. Update DB set PDF pair NULL terlebih dahulu
        const { error: errNullPdf } = await supabase
          .from("peta_nagari")
          .update({ file_url: null, file_storage_path: null })
          .eq("id", petaId)

        if (errNullPdf) {
          setPesanError(`Gagal memperbarui database pasangan PDF: ${errNullPdf.message}. Hapus dibatalkan.`)
          setProcessingDeleteId(null)
          return
        }

        // 2b. Hapus PDF dari Storage
        const resPdf = await hapusFileJikaAda(BUCKET_DOKUMEN_PETA_NAGARI, pdfPathLama)
        if (!resPdf.berhasil) {
          tambahCleanupTertunda(
            petaId,
            BUCKET_DOKUMEN_PETA_NAGARI,
            pdfPathLama,
            "dokumen",
            `File PDF peta "${item.judul_peta}" gagal dihapus dari Storage.`
          )
          setPesanError(
            `Gagal menghapus file PDF dari Storage: ${resPdf.errorMessage}. Record peta telah dinonaktifkan di database dan pasangan PDF diatur NULL.`
          )
          await muatDataPeta()
          setProcessingDeleteId(null)
          return
        }
      }

      // Step 3: Hapus Gambar Utama dari Storage
      if (gambarPathLama) {
        const resGambar = await hapusFileJikaAda(BUCKET_GAMBAR_PETA_NAGARI, gambarPathLama)
        if (!resGambar.berhasil) {
          if (!retryDeleteIds.includes(petaId)) {
            setRetryDeleteIds((prev) => [...prev, petaId])
          }
          setPesanError(
            `Gagal menghapus gambar utama dari Storage: ${resGambar.errorMessage}. Record peta tetap dinonaktifkan di database. Silakan coba tombol "Retry Hapus".`
          )
          await muatDataPeta()
          setProcessingDeleteId(null)
          return
        }
      }

      // Step 4: Hapus Record Database Utama
      const { error: errDeleteDb } = await supabase
        .from("peta_nagari")
        .delete()
        .eq("id", petaId)

      if (errDeleteDb) {
        if (!retryDeleteIds.includes(petaId)) {
          setRetryDeleteIds((prev) => [...prev, petaId])
        }
        setPesanError(
          `File gambar dan PDF di Storage telah berhasil dibersihkan, namun gagal menghapus record database: ${errDeleteDb.message}. Gunakan tombol "Retry Hapus" untuk mencoba menghapus record database kembali.`
        )
      } else {
        setRetryDeleteIds((prev) => prev.filter((id) => id !== petaId))
        setPesanSukses(`Peta "${item.judul_peta}" beserta seluruh filenya berhasil dihapus total.`)

        // Jika item yang sedang dibuka di form adalah item yang dihapus, tutup form
        if (editingId === petaId) {
          handleBatalForm()
        }
      }

      await muatDataPeta()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan saat menghapus peta: ${msg}`)
    } finally {
      setProcessingDeleteId(null)
    }
  }

  // ==========================================
  // RETRY CLEANUP FILE TERTUNDA
  // ==========================================
  const handleRetryCleanup = async (item: CleanupTertunda) => {
    try {
      const res = await hapusFileJikaAda(item.bucket, item.path)
      if (res.berhasil) {
        setCleanupTertunda((prev) => prev.filter((c) => c.id !== item.id))
        setPesanSukses(`Pembersihan file tertunda (${item.path}) berhasil diselesaikan!`)
      } else {
        setPesanError(`Pembersihan file tertunda (${item.path}) gagal: ${res.errorMessage}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Gagal membersihkan file tertunda: ${msg}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
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
                Kelola Peta Nagari
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Tambah dan kelola peta administrasi, kebencanaan, dan peta tematik Nagari Aia Manggih Barat
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isFormOpen ? (
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
                + Tambah Peta Baru
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBatalForm}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer"
              >
                Tutup Form
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loadingList || loadingForm}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Notifications */}
        {pesanSukses && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{pesanSukses}</span>
              </div>
              <button
                onClick={() => setPesanSukses(null)}
                className="text-green-600 hover:text-green-800 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {pesanError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-red-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="leading-relaxed">{pesanError}</span>
              </div>
              <button
                onClick={() => setPesanError(null)}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

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

        {/* Form Container (Tambah / Edit) */}
        {isFormOpen && (
          <div className="rounded-2xl border border-[#e6ddcf] bg-[#fdfbf7] p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between border-b border-[#e6ddcf] pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Peta Nagari" : "Tambah Peta Nagari Baru"}
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                {editingId ? "Mode Edit Peta & File" : "Mode Tambah Baru"}
              </span>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Baris 1: Judul & Jenis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Judul Peta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.judul_peta}
                    onChange={handleJudulChange}
                    placeholder="Contoh: Peta Administrasi Nagari Aia Manggih Barat"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
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
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Sumber Peta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sumber_peta}
                    onChange={(e) =>
                      setFormData({ ...formData, sumber_peta: e.target.value })
                    }
                    placeholder="Masukkan sumber resmi peta"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Baris 3: Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Deskripsi Peta (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  placeholder="Keterangan singkat mengenai cakupan wilayah, legenda, atau catatan peta..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
                />
              </div>

              {/* Baris 4: Input Gambar & File PDF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#e6ddcf]">
                {/* Gambar Input / Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {editingId ? "Ganti Gambar Utama Peta (Opsional)" : "Gambar Utama Peta *"}
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleGambarFileChange}
                    required={!editingId}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#2c1b01] file:text-white hover:file:bg-[#4a3210] cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingId
                      ? "Biarkan kosong untuk mempertahankan gambar yang sekarang (Format: JPEG, PNG, WebP, max 15 MB)."
                      : "Format: JPEG, PNG, WebP. Ukuran maksimal: 15 MB."}
                  </p>

                  {/* Preview Gambar Baru atau Existing */}
                  {gambarPreviewUrl ? (
                    <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1">
                      <p className="text-[11px] font-semibold text-green-700 mb-1">✓ Preview Gambar Baru Terpilih:</p>
                      <img
                        src={gambarPreviewUrl}
                        alt="Preview gambar baru"
                        className="h-full w-full object-contain rounded-lg"
                      />
                    </div>
                  ) : editingItem?.gambar_url ? (
                    <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1">
                      <p className="text-[11px] font-medium text-gray-500 mb-1">Gambar Utama Saat Ini:</p>
                      <img
                        src={editingItem.gambar_url}
                        alt={editingItem.teks_alt || editingItem.judul_peta}
                        className="h-full w-full object-contain rounded-lg"
                      />
                    </div>
                  ) : null}
                </div>

                {/* PDF Input / Options */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {editingId ? "Kelola Dokumen PDF (Opsional)" : "Dokumen PDF Peta (Opsional)"}
                  </label>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleDokumenFileChange}
                    disabled={hapusPdfExisting}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#2c1b01] file:text-white hover:file:bg-[#4a3210] cursor-pointer disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingId
                      ? "Biarkan kosong untuk mempertahankan PDF yang sekarang (Format: PDF, max 30 MB)."
                      : "Format: PDF. Ukuran maksimal: 30 MB."}
                  </p>

                  {/* Status & Options PDF Existing */}
                  {editingItem?.file_url && (
                    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 space-y-2">
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

              {/* Baris 5: Teks Alternatif & Urutan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#e6ddcf]">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Teks Alternatif Gambar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.teks_alt}
                    onChange={handleTeksAltChange}
                    placeholder="Contoh: Peta Administrasi Nagari Aia Manggih Barat"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Digunakan untuk aksesibilitas pembaca layar gambar peta.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.urutan}
                    onChange={(e) =>
                      setFormData({ ...formData, urutan: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#2c1b01] focus:ring-2 focus:ring-[#2c1b01]/20 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nomor urutan tampil pada slider beranda (0, 1, 2, ...).
                  </p>
                </div>
              </div>

              {/* Baris 6: Status Aktif */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#2c1b01] focus:ring-[#2c1b01] cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    Tampilkan pada beranda (Status Aktif Publik)
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6ddcf]">
                <button
                  type="button"
                  onClick={handleBatalForm}
                  disabled={loadingForm}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-[#1a1200] hover:to-[#2c1b01] disabled:opacity-60 transition cursor-pointer"
                >
                  {loadingForm ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Menyimpan...
                    </span>
                  ) : editingId ? (
                    "Simpan Perubahan Peta"
                  ) : (
                    "Simpan Peta Baru"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel Daftar Peta Nagari */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
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
              <svg
                className="animate-spin h-8 w-8 text-[#2c1b01] mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Memuat daftar peta nagari...
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
              <p className="text-xs text-gray-500 mb-4">
                Silakan tambah peta baru untuk dipublikasikan pada slider beranda.
              </p>
              <button
                type="button"
                onClick={handleOpenTambah}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#2c1b01] text-white text-xs font-semibold shadow-md hover:bg-[#4a3210] transition cursor-pointer"
              >
                + Tambah Peta Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f0e8db] border-b border-gray-300 text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    <th className="px-4 py-3.5 w-24">Preview</th>
                    <th className="px-4 py-3.5">Judul & Jenis</th>
                    <th className="px-4 py-3.5">Tahun & Sumber</th>
                    <th className="px-4 py-3.5">Dokumen PDF</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center w-20">Urutan</th>
                    <th className="px-4 py-3.5 text-right w-64">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {listPeta.map((item) => {
                    const isProcessing =
                      processingToggleId === item.id ||
                      processingDeleteId === item.id ||
                      (editingId === item.id && loadingForm)

                    const isRetryMode = retryDeleteIds.includes(item.id)

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#f7f2e8]/50 transition-colors"
                      >
                        {/* Preview */}
                        <td className="px-4 py-3">
                          <div className="relative aspect-video w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                            <img
                              src={item.gambar_url}
                              alt={item.teks_alt || item.judul_peta}
                              className="h-full w-full object-contain rounded"
                            />
                          </div>
                        </td>

                        {/* Judul & Jenis */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">
                            {item.judul_peta}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-md bg-[#f0e8db] px-2.5 py-0.5 text-xs font-semibold text-[#2c1b01] border border-[#e6ddcf]">
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
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold text-gray-900">
                            Tahun: {item.tahun_peta}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {item.sumber_peta}
                          </div>
                        </td>

                        {/* Dokumen PDF */}
                        <td className="px-4 py-3">
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

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          {item.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                              ● Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                              ○ Nonaktif
                            </span>
                          )}
                        </td>

                        {/* Urutan */}
                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                          {item.urutan}
                        </td>

                        {/* Aksi (Edit, Aktifkan/Nonaktifkan, Hapus/Retry) */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              disabled={isProcessing}
                              aria-label={`Edit ${item.judul_peta}`}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>

                            {/* Tombol Toggle Status Cepat */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              disabled={isProcessing}
                              aria-label={`${item.is_active ? "Nonaktifkan" : "Aktifkan"} ${item.judul_peta}`}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer ${
                                item.is_active
                                  ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                  : "bg-green-600 hover:bg-green-700 text-white"
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
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer ${
                                isRetryMode
                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }`}
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
    </div>
  )
}
