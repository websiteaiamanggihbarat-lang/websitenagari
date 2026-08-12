"use client"

import { use, useEffect, useState, FormEvent, ChangeEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  DetailLembagaOrganisasiAdmin,
  PengurusLembagaOrganisasi,
  TugasLembagaOrganisasi,
  GaleriLembagaOrganisasi,
  LEMBAGA_ORGANISASI_BUCKET,
  fetchDetailLembagaOrganisasiAdmin,
  isValidLembagaOrganisasiId,
} from "@/lib/lembagaOrganisasi"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface PageProps {
  params: Promise<{ dataId: string }>
}

interface SupabaseErrorLike {
  code?: string
  message?: string
}

function parseErrorMessage(err: SupabaseErrorLike | null | undefined, defaultMsg: string): string {
  if (!err) return defaultMsg
  const code = err.code || ""
  if (code === "23505") {
    return "Nama tersebut sudah digunakan."
  }
  if (code === "23514") {
    return "Data tidak memenuhi aturan validasi database."
  }
  if (code === "23503") {
    return "Data utama tidak ditemukan atau relasi tidak valid."
  }
  if (code === "P0001") {
    return "Perubahan ditolak oleh aturan bisnis database."
  }
  if (code === "42501") {
    return "Sesi tidak valid atau akses ditolak."
  }
  return defaultMsg
}

function generateSafeFilename(file: File): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }
  const ext = mimeToExt[file.type] || "jpg"
  const timestamp = Date.now()
  const randomStr = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
    : Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${randomStr}.${ext}`
}

function validateImageFile(file: File): string | null {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return "Format file harus JPG, PNG, atau WebP."
  }
  if (file.size > 5242880) {
    return "Ukuran file tidak boleh melebihi 5 MB."
  }
  return null
}

interface DataUtamaForm {
  nama: string
  deskripsi: string
  alamat: string
  kontak: string
  jam_kerja: string
}

const INITIAL_DATA_UTAMA_FORM: DataUtamaForm = {
  nama: "",
  deskripsi: "",
  alamat: "",
  kontak: "",
  jam_kerja: "",
}

export default function AdminDetailLembagaOrganisasiPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const dataId = resolvedParams?.dataId || ""

  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<DetailLembagaOrganisasiAdmin | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => Promise<void>
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  })

  // Data Utama Form State
  const [dataUtamaForm, setDataUtamaForm] = useState<DataUtamaForm>(INITIAL_DATA_UTAMA_FORM)
  const [dataUtamaErrors, setDataUtamaErrors] = useState<Record<string, string>>({})
  const [savingDataUtama, setSavingDataUtama] = useState(false)

  // Modal Pengurus State
  const [isPengurusModalOpen, setIsPengurusModalOpen] = useState(false)
  const [editingPengurus, setEditingPengurus] = useState<PengurusLembagaOrganisasi | null>(null)
  const [pengurusNamaJabatan, setPengurusNamaJabatan] = useState("")
  const [pengurusNamaPengurus, setPengurusNamaPengurus] = useState("")
  const [pengurusFotoFile, setPengurusFotoFile] = useState<File | null>(null)
  const [pengurusFotoPreview, setPengurusFotoPreview] = useState<string | null>(null)

  // Modal Tugas State
  const [isTugasModalOpen, setIsTugasModalOpen] = useState(false)
  const [editingTugas, setEditingTugas] = useState<TugasLembagaOrganisasi | null>(null)
  const [tugasIsiTugas, setTugasIsiTugas] = useState("")

  // Modal Galeri Multi-Upload State
  const [isGaleriModalOpen, setIsGaleriModalOpen] = useState(false)
  const [galeriFiles, setGaleriFiles] = useState<File[]>([])
  const [galeriTeksAlt, setGaleriTeksAlt] = useState("")

  // Modal Edit Alt Galeri State
  const [isEditAltModalOpen, setIsEditAltModalOpen] = useState(false)
  const [editingAltGaleri, setEditingAltGaleri] = useState<GaleriLembagaOrganisasi | null>(null)
  const [altValue, setAltValue] = useState("")

  const periksaAuth = async (): Promise<boolean> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        window.location.href = "/login"
        return false
      }
      setIsAuthenticated(true)
      return true
    } catch {
      window.location.href = "/login"
      return false
    } finally {
      setCheckingSession(false)
    }
  }

  const loadDetail = async () => {
    if (!isValidLembagaOrganisasiId(dataId)) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await fetchDetailLembagaOrganisasiAdmin(dataId)
      setDetail(result)
      if (result) {
        setDataUtamaForm({
          nama: result.data.nama || "",
          deskripsi: result.data.deskripsi || "",
          alamat: result.data.alamat || "",
          kontak: result.data.kontak || "",
          jam_kerja: result.data.jam_kerja || "",
        })
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal memuat detail lembaga dan organisasi."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/admin/lembaga-organisasi"
    }
  }, [])

  // ============================================================================
  // SECTION 1: EDITABLE DATA UTAMA SUBMIT
  // ============================================================================
  const validateDataUtama = (): boolean => {
    const errors: Record<string, string> = {}

    const namaTrim = dataUtamaForm.nama.trim()
    if (namaTrim.length < 2 || namaTrim.length > 200) {
      errors.nama = "Nama harus diisi 2 sampai 200 karakter."
    }

    const deskripsiTrim = dataUtamaForm.deskripsi.trim()
    if (deskripsiTrim.length < 10 || deskripsiTrim.length > 5000) {
      errors.deskripsi = "Deskripsi harus diisi 10 sampai 5000 karakter."
    }

    const alamatTrim = dataUtamaForm.alamat.trim()
    if (alamatTrim.length < 3 || alamatTrim.length > 500) {
      errors.alamat = "Alamat harus diisi 3 sampai 500 karakter."
    }

    const kontakTrim = dataUtamaForm.kontak.trim()
    if (kontakTrim.length > 0 && kontakTrim.length > 100) {
      errors.kontak = "Kontak maksimal 100 karakter."
    }

    const jamKerjaTrim = dataUtamaForm.jam_kerja.trim()
    if (jamKerjaTrim.length > 0 && jamKerjaTrim.length > 300) {
      errors.jam_kerja = "Jam kerja maksimal 300 karakter."
    }

    setDataUtamaErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitDataUtama = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail || savingDataUtama || activeOperation || !isAuthenticated) return

    setPesanSukses(null)
    setPesanError(null)

    if (!validateDataUtama()) {
      return
    }

    setSavingDataUtama(true)
    setActiveOperation("data_utama_submit")

    try {
      const namaTrim = dataUtamaForm.nama.trim()
      const deskripsiTrim = dataUtamaForm.deskripsi.trim()
      const alamatTrim = dataUtamaForm.alamat.trim()
      const kontakTrim = dataUtamaForm.kontak.trim() || null
      const jamKerjaTrim = dataUtamaForm.jam_kerja.trim() || null

      const { data: updatedRow, error } = await supabase
        .from("lembaga_organisasi")
        .update({
          nama: namaTrim,
          deskripsi: deskripsiTrim,
          alamat: alamatTrim,
          kontak: kontakTrim,
          jam_kerja: jamKerjaTrim,
        })
        .eq("id", dataId)
        .select("id, nama, deskripsi, alamat, kontak, jam_kerja, is_active")
        .maybeSingle()

      if (error) {
        setPesanError(parseErrorMessage(error, "Gagal menyimpan perubahan. Silakan coba kembali."))
        return
      }

      if (!updatedRow) {
        setPesanError("Data lembaga/organisasi tidak ditemukan atau sesi tidak memiliki akses.")
        return
      }

      setPesanSukses("Data Utama berhasil diperbarui.")
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal menyimpan perubahan. Silakan coba kembali."))
    } finally {
      setSavingDataUtama(false)
      setActiveOperation(null)
    }
  }

  // ============================================================================
  // SECTION 2: PENGURUS MANAGEMENT
  // ============================================================================
  const handleOpenTambahPengurus = () => {
    setEditingPengurus(null)
    setPengurusNamaJabatan("")
    setPengurusNamaPengurus("")
    setPengurusFotoFile(null)
    setPengurusFotoPreview(null)
    setIsPengurusModalOpen(true)
  }

  const handleOpenEditPengurus = (p: PengurusLembagaOrganisasi) => {
    setEditingPengurus(p)
    setPengurusNamaJabatan(p.nama_jabatan)
    setPengurusNamaPengurus(p.nama_pengurus || "")
    setPengurusFotoFile(null)
    setPengurusFotoPreview(p.foto_url)
    setIsPengurusModalOpen(true)
  }

  const handlePengurusFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const err = validateImageFile(file)
      if (err) {
        setPesanError(err)
        return
      }
      setPengurusFotoFile(file)
      setPengurusFotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmitPengurus = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail || activeOperation || !isAuthenticated) return
    setPesanSukses(null)
    setPesanError(null)

    const jabatanTrim = pengurusNamaJabatan.trim()
    if (jabatanTrim.length < 2 || jabatanTrim.length > 150) {
      setPesanError("Nama jabatan harus 2-150 karakter.")
      return
    }

    const pengurusTrim = pengurusNamaPengurus.trim() || null
    if (pengurusTrim && pengurusTrim.length > 200) {
      setPesanError("Nama pengurus maksimal 200 karakter.")
      return
    }

    setActiveOperation("pengurus_submit")

    try {
      if (editingPengurus) {
        // EDIT PENGURUS
        if (pengurusFotoFile) {
          // SAFE REPLACE FOTO PENGURUS
          const oldPath = editingPengurus.foto_storage_path
          const newFilename = generateSafeFilename(pengurusFotoFile)
          const newPath = `lembaga-organisasi/${dataId}/pengurus/${editingPengurus.id}/${newFilename}`

          // 1. Upload new photo
          const { error: errUpload } = await supabase.storage
            .from(LEMBAGA_ORGANISASI_BUCKET)
            .upload(newPath, pengurusFotoFile, { upsert: false })

          if (errUpload) {
            setPesanError(parseErrorMessage(errUpload, "Gagal mengunggah foto pengurus baru."))
            setActiveOperation(null)
            return
          }

          const { data: urlData } = supabase.storage
            .from(LEMBAGA_ORGANISASI_BUCKET)
            .getPublicUrl(newPath)
          const newUrl = urlData.publicUrl

          // 2. Update DB
          const { data: updatedRow, error: errUpdate } = await supabase
            .from("pengurus_lembaga_organisasi")
            .update({
              nama_jabatan: jabatanTrim,
              nama_pengurus: pengurusTrim,
              foto_url: newUrl,
              foto_storage_path: newPath,
            })
            .eq("id", editingPengurus.id)
            .eq("lembaga_organisasi_id", dataId)
            .select("id")
            .maybeSingle()

          if (errUpdate || !updatedRow) {
            // Rollback new upload
            await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove([newPath])
            setPesanError(parseErrorMessage(errUpdate, "Gagal memperbarui pengurus."))
            setActiveOperation(null)
            return
          }

          // Cleanup old file
          if (oldPath) {
            await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove([oldPath])
          }
          setPesanSukses("Pengurus dan foto berhasil diperbarui.")
        } else {
          // EDIT TEXT ONLY
          const { data: updatedRow, error: errUpdate } = await supabase
            .from("pengurus_lembaga_organisasi")
            .update({
              nama_jabatan: jabatanTrim,
              nama_pengurus: pengurusTrim,
            })
            .eq("id", editingPengurus.id)
            .eq("lembaga_organisasi_id", dataId)
            .select("id")
            .maybeSingle()

          if (errUpdate || !updatedRow) {
            setPesanError(parseErrorMessage(errUpdate, "Gagal memperbarui pengurus."))
            setActiveOperation(null)
            return
          }
          setPesanSukses("Pengurus berhasil diperbarui.")
        }
      } else {
        // CREATE PENGURUS
        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
        const nextUrutan = detail.pengurus.length > 0 ? Math.max(...detail.pengurus.map((p) => p.urutan)) + 1 : 1

        if (pengurusFotoFile) {
          // SAFE CREATE WITH PHOTO
          const filename = generateSafeFilename(pengurusFotoFile)
          const path = `lembaga-organisasi/${dataId}/pengurus/${newId}/${filename}`

          const { error: errUpload } = await supabase.storage
            .from(LEMBAGA_ORGANISASI_BUCKET)
            .upload(path, pengurusFotoFile, { upsert: false })

          if (errUpload) {
            setPesanError(parseErrorMessage(errUpload, "Gagal mengunggah foto pengurus."))
            setActiveOperation(null)
            return
          }

          const { data: urlData } = supabase.storage
            .from(LEMBAGA_ORGANISASI_BUCKET)
            .getPublicUrl(path)
          const fotoUrl = urlData.publicUrl

          const { data: insertedRow, error: errInsert } = await supabase
            .from("pengurus_lembaga_organisasi")
            .insert({
              id: newId,
              lembaga_organisasi_id: dataId,
              nama_jabatan: jabatanTrim,
              nama_pengurus: pengurusTrim,
              foto_url: fotoUrl,
              foto_storage_path: path,
              urutan: nextUrutan,
            })
            .select("id")
            .single()

          if (errInsert || !insertedRow || !insertedRow.id) {
            await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove([path])
            setPesanError(parseErrorMessage(errInsert, "Gagal menambahkan pengurus."))
            setActiveOperation(null)
            return
          }
          setPesanSukses("Pengurus beserta foto berhasil ditambahkan.")
        } else {
          // CREATE WITHOUT PHOTO
          const { data: insertedRow, error: errInsert } = await supabase
            .from("pengurus_lembaga_organisasi")
            .insert({
              id: newId,
              lembaga_organisasi_id: dataId,
              nama_jabatan: jabatanTrim,
              nama_pengurus: pengurusTrim,
              foto_url: null,
              foto_storage_path: null,
              urutan: nextUrutan,
            })
            .select("id")
            .single()

          if (errInsert || !insertedRow || !insertedRow.id) {
            setPesanError(parseErrorMessage(errInsert, "Gagal menambahkan pengurus."))
            setActiveOperation(null)
            return
          }
          setPesanSukses("Pengurus berhasil ditambahkan.")
        }
      }

      setIsPengurusModalOpen(false)
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat memproses pengurus."))
    } finally {
      setActiveOperation(null)
    }
  }

  const handleHapusFotoPengurus = (p: PengurusLembagaOrganisasi) => {
    if (!detail || activeOperation || !p.foto_storage_path || !isAuthenticated) return
    setConfirmModalState({
      isOpen: true,
      title: "⚠ Hapus Foto Pengurus?",
      message: `Apakah Anda yakin ingin menghapus foto pengurus '${p.nama_jabatan}'?`,
      onConfirm: () => executeHapusFotoPengurus(p),
    })
  }

  const executeHapusFotoPengurus = async (p: PengurusLembagaOrganisasi) => {
    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_foto_pengurus")

    try {
      const oldPath = p.foto_storage_path!
      const { error: errRemove } = await supabase.storage
        .from(LEMBAGA_ORGANISASI_BUCKET)
        .remove([oldPath])

      if (errRemove) {
        const msg = parseErrorMessage(errRemove, "Gagal menghapus foto dari storage.")
        setPesanError(msg)
        setActiveOperation(null)
        return
      }

      const { data: updatedRow, error: errUpdate } = await supabase
        .from("pengurus_lembaga_organisasi")
        .update({
          foto_url: null,
          foto_storage_path: null,
        })
        .eq("id", p.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errUpdate || !updatedRow) {
        const msg = "Foto di storage terhapus tetapi gagal memperbarui metadata database."
        setPesanError(msg)
        setActiveOperation(null)
        return
      }

      const msg = "Foto pengurus berhasil dihapus."
      setPesanSukses(msg)
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      const msg = parseErrorMessage(e, "Terjadi kesalahan saat menghapus foto pengurus.")
      setPesanError(msg)
    } finally {
      setActiveOperation(null)
    }
  }

  const handleHapusPengurus = (p: PengurusLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    setConfirmModalState({
      isOpen: true,
      title: "⚠ Hapus Pengurus?",
      message: `Apakah Anda yakin ingin menghapus data pengurus '${p.nama_jabatan}'?`,
      onConfirm: () => executeHapusPengurus(p),
    })
  }

  const executeHapusPengurus = async (p: PengurusLembagaOrganisasi) => {
    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_pengurus")

    try {
      if (p.foto_storage_path) {
        const { error: errStorage } = await supabase.storage
          .from(LEMBAGA_ORGANISASI_BUCKET)
          .remove([p.foto_storage_path])

        if (errStorage) {
          console.error("Storage remove error:", errStorage)
        }
      }

      const { data: deletedRow, error: errDelete } = await supabase
        .from("pengurus_lembaga_organisasi")
        .delete()
        .eq("id", p.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errDelete || !deletedRow) {
        const msg = parseErrorMessage(errDelete, "Gagal menghapus data pengurus dari database.")
        setPesanError(msg)
        setActiveOperation(null)
        return
      }

      const msg = "Pengurus berhasil dihapus."
      setPesanSukses(msg)
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      const msg = parseErrorMessage(e, "Terjadi kesalahan saat menghapus pengurus.")
      setPesanError(msg)
    } finally {
      setActiveOperation(null)
    }
  }

  const handleReorderPengurus = async (index: number, direction: "up" | "down") => {
    if (!detail || activeOperation || !isAuthenticated) return
    const list = detail.pengurus
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return

    const itemA = list[index]
    const itemB = list[targetIndex]

    setActiveOperation("reorder_pengurus")
    setPesanSukses(null)
    setPesanError(null)

    try {
      const { data: resA, error: errA } = await supabase
        .from("pengurus_lembaga_organisasi")
        .update({ urutan: itemB.urutan })
        .eq("id", itemA.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errA || !resA) {
        setPesanError("Gagal mengubah urutan pengurus.")
        setActiveOperation(null)
        return
      }

      const { data: resB, error: errB } = await supabase
        .from("pengurus_lembaga_organisasi")
        .update({ urutan: itemA.urutan })
        .eq("id", itemB.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errB || !resB) {
        // Rollback itemA
        await supabase
          .from("pengurus_lembaga_organisasi")
          .update({ urutan: itemA.urutan })
          .eq("id", itemA.id)
          .eq("lembaga_organisasi_id", dataId)
        setPesanError("Gagal mengubah urutan pengurus.")
        setActiveOperation(null)
        return
      }

      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat mengurutkan pengurus.")
    } finally {
      setActiveOperation(null)
    }
  }

  // ============================================================================
  // SECTION 3: TUGAS MANAGEMENT
  // ============================================================================
  const handleOpenTambahTugas = () => {
    setEditingTugas(null)
    setTugasIsiTugas("")
    setIsTugasModalOpen(true)
  }

  const handleOpenEditTugas = (t: TugasLembagaOrganisasi) => {
    setEditingTugas(t)
    setTugasIsiTugas(t.isi_tugas)
    setIsTugasModalOpen(true)
  }

  const handleSubmitTugas = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail || activeOperation || !isAuthenticated) return
    setPesanSukses(null)
    setPesanError(null)

    const isiTrim = tugasIsiTugas.trim()
    if (isiTrim.length < 3 || isiTrim.length > 1000) {
      setPesanError("Isi tugas harus 3-1000 karakter.")
      return
    }

    setActiveOperation("tugas_submit")

    try {
      if (editingTugas) {
        const { data: updatedRow, error } = await supabase
          .from("tugas_lembaga_organisasi")
          .update({ isi_tugas: isiTrim })
          .eq("id", editingTugas.id)
          .eq("lembaga_organisasi_id", dataId)
          .select("id")
          .maybeSingle()

        if (error || !updatedRow) {
          setPesanError(parseErrorMessage(error, "Gagal memperbarui tugas."))
          setActiveOperation(null)
          return
        }
        setPesanSukses("Tugas berhasil diperbarui.")
      } else {
        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
        const nextUrutan = detail.tugas.length > 0 ? Math.max(...detail.tugas.map((t) => t.urutan)) + 1 : 1

        const { data: insertedRow, error } = await supabase
          .from("tugas_lembaga_organisasi")
          .insert({
            id: newId,
            lembaga_organisasi_id: dataId,
            isi_tugas: isiTrim,
            urutan: nextUrutan,
          })
          .select("id")
          .single()

        if (error || !insertedRow || !insertedRow.id) {
          setPesanError(parseErrorMessage(error, "Gagal menambahkan tugas."))
          setActiveOperation(null)
          return
        }
        setPesanSukses("Tugas berhasil ditambahkan.")
      }

      setIsTugasModalOpen(false)
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat memproses tugas."))
    } finally {
      setActiveOperation(null)
    }
  }

  const handleHapusTugas = (t: TugasLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    setConfirmModalState({
      isOpen: true,
      title: "⚠ Hapus Butir Tugas?",
      message: "Apakah Anda yakin ingin menghapus butir tugas ini?",
      onConfirm: () => executeHapusTugas(t),
    })
  }

  const executeHapusTugas = async (t: TugasLembagaOrganisasi) => {
    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_tugas")

    try {
      const { data: deletedRow, error } = await supabase
        .from("tugas_lembaga_organisasi")
        .delete()
        .eq("id", t.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (error || !deletedRow) {
        const msg = parseErrorMessage(error, "Gagal menghapus tugas.")
        setPesanError(msg)
        setActiveOperation(null)
        return
      }

      const msg = "Tugas berhasil dihapus."
      setPesanSukses(msg)
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      const msg = parseErrorMessage(e, "Terjadi kesalahan saat menghapus tugas.")
      setPesanError(msg)
    } finally {
      setActiveOperation(null)
    }
  }

  const handleReorderTugas = async (index: number, direction: "up" | "down") => {
    if (!detail || activeOperation || !isAuthenticated) return
    const list = detail.tugas
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return

    const itemA = list[index]
    const itemB = list[targetIndex]

    setActiveOperation("reorder_tugas")
    setPesanSukses(null)
    setPesanError(null)

    try {
      const { data: resA, error: errA } = await supabase
        .from("tugas_lembaga_organisasi")
        .update({ urutan: itemB.urutan })
        .eq("id", itemA.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errA || !resA) {
        setPesanError("Gagal mengubah urutan tugas.")
        setActiveOperation(null)
        return
      }

      const { data: resB, error: errB } = await supabase
        .from("tugas_lembaga_organisasi")
        .update({ urutan: itemA.urutan })
        .eq("id", itemB.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errB || !resB) {
        await supabase
          .from("tugas_lembaga_organisasi")
          .update({ urutan: itemA.urutan })
          .eq("id", itemA.id)
          .eq("lembaga_organisasi_id", dataId)
        setPesanError("Gagal mengubah urutan tugas.")
        setActiveOperation(null)
        return
      }

      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat mengurutkan tugas.")
    } finally {
      setActiveOperation(null)
    }
  }

  // ============================================================================
  // SECTION 4: GALERI & SET COVER MANAGEMENT
  // ============================================================================
  const handleOpenTambahGaleri = () => {
    setGaleriFiles([])
    setGaleriTeksAlt("")
    setIsGaleriModalOpen(true)
  }

  const handleGaleriFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      const validFiles: File[] = []
      for (const f of selected) {
        const err = validateImageFile(f)
        if (err) {
          setPesanError(`File '${f.name}': ${err}`)
        } else {
          validFiles.push(f)
        }
      }
      setGaleriFiles(validFiles)
    }
  }

  const handleSubmitGaleriBatch = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail || activeOperation || galeriFiles.length === 0 || !isAuthenticated) return

    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("upload_galeri")

    let countSuccess = 0
    let countFailed = 0

    const nextUrutanBase = detail.galeri.length > 0 ? Math.max(...detail.galeri.map((g) => g.urutan)) + 1 : 1

    try {
      for (let i = 0; i < galeriFiles.length; i++) {
        const file = galeriFiles[i]
        const galeriId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
        const filename = generateSafeFilename(file)
        const path = `lembaga-organisasi/${dataId}/galeri/${galeriId}/${filename}`

        // Upload to storage
        const { error: errUpload } = await supabase.storage
          .from(LEMBAGA_ORGANISASI_BUCKET)
          .upload(path, file, { upsert: false })

        if (errUpload) {
          countFailed++
          continue
        }

        const { data: urlData } = supabase.storage
          .from(LEMBAGA_ORGANISASI_BUCKET)
          .getPublicUrl(path)
        const fotoUrl = urlData.publicUrl

        const { data: insertedRow, error: errInsert } = await supabase
          .from("galeri_lembaga_organisasi")
          .insert({
            id: galeriId,
            lembaga_organisasi_id: dataId,
            foto_url: fotoUrl,
            foto_storage_path: path,
            teks_alt: galeriTeksAlt.trim() || null,
            is_cover: false,
            is_active: true,
            urutan: nextUrutanBase + i,
          })
          .select("id")
          .single()

        if (errInsert || !insertedRow || !insertedRow.id) {
          // Rollback storage
          await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove([path])
          countFailed++
        } else {
          countSuccess++
        }
      }

      if (countFailed === 0) {
        setPesanSukses(`Berhasil mengunggah ${countSuccess} foto galeri.`)
      } else {
        setPesanError(`Berhasil mengunggah ${countSuccess} foto. Gagal ${countFailed} foto.`)
      }

      setIsGaleriModalOpen(false)
      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat mengunggah galeri.")
    } finally {
      setActiveOperation(null)
    }
  }

  const handleSetCover = async (targetGaleri: GaleriLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("set_cover")

    const wasParentActive = detail.data.is_active

    try {
      // 1. Clear old cover status for this parent
      const oldCovers = detail.galeri.filter((g) => g.is_cover && g.id !== targetGaleri.id)
      for (const old of oldCovers) {
        await supabase
          .from("galeri_lembaga_organisasi")
          .update({ is_cover: false })
          .eq("id", old.id)
          .eq("lembaga_organisasi_id", dataId)
      }

      // 2. Set target galeri as cover (always active)
      const { data: resSet, error: errSet } = await supabase
        .from("galeri_lembaga_organisasi")
        .update({ is_cover: true, is_active: true })
        .eq("id", targetGaleri.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errSet || !resSet) {
        setPesanError(parseErrorMessage(errSet, "Gagal menetapkan foto cover aktif."))
        setActiveOperation(null)
        return
      }

      // 3. Restore parent publication state if parent was previously active
      if (wasParentActive) {
        await supabase
          .from("lembaga_organisasi")
          .update({ is_active: true })
          .eq("id", dataId)
      }

      setPesanSukses("Foto cover aktif berhasil diperbarui.")
      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat menetapkan foto cover.")
    } finally {
      setActiveOperation(null)
    }
  }

  const handleOpenEditAlt = (g: GaleriLembagaOrganisasi) => {
    setEditingAltGaleri(g)
    setAltValue(g.teks_alt || "")
    setIsEditAltModalOpen(true)
  }

  const handleSubmitEditAlt = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail || activeOperation || !editingAltGaleri || !isAuthenticated) return

    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("edit_alt")

    const altTrim = altValue.trim() || null
    if (altTrim && altTrim.length > 300) {
      setPesanError("Teks alternatif maksimal 300 karakter.")
      setActiveOperation(null)
      return
    }

    try {
      const { data: updatedRow, error } = await supabase
        .from("galeri_lembaga_organisasi")
        .update({ teks_alt: altTrim })
        .eq("id", editingAltGaleri.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (error || !updatedRow) {
        setPesanError(parseErrorMessage(error, "Gagal memperbarui teks alternatif."))
        setActiveOperation(null)
        return
      }

      setPesanSukses("Teks alternatif berhasil diperbarui.")
      setIsEditAltModalOpen(false)
      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat memperbarui teks alternatif.")
    } finally {
      setActiveOperation(null)
    }
  }

  const handleHapusGaleri = (g: GaleriLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    let confirmMsg = "Apakah Anda yakin ingin menghapus foto galeri ini?"
    if (g.is_cover && g.is_active) {
      confirmMsg = "Menghapus foto cover aktif akan memperbarui galeri ini. Lanjutkan penghapusan?"
    }
    setConfirmModalState({
      isOpen: true,
      title: "⚠ Hapus Foto Galeri?",
      message: confirmMsg,
      onConfirm: () => executeHapusGaleri(g),
    })
  }

  const executeHapusGaleri = async (g: GaleriLembagaOrganisasi) => {
    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_galeri")

    try {
      // 1. Remove storage object
      const { error: errStorage } = await supabase.storage
        .from(LEMBAGA_ORGANISASI_BUCKET)
        .remove([g.foto_storage_path])

      if (errStorage) {
        const msg = parseErrorMessage(errStorage, "Gagal menghapus file foto dari storage. Penghapusan dibatalkan.")
        setPesanError(msg)
        setActiveOperation(null)
        return
      }

      // 2. Delete DB row
      const { data: deletedRow, error: errDelete } = await supabase
        .from("galeri_lembaga_organisasi")
        .delete()
        .eq("id", g.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errDelete || !deletedRow) {
        const msg = "File foto terhapus dari storage tetapi gagal menghapus metadata database."
        setPesanError(msg)
        setActiveOperation(null)
        return
      }

      const msg = "Foto galeri berhasil dihapus."
      setPesanSukses(msg)
      await loadDetail()
    } catch {
      const msg = "Terjadi kesalahan saat menghapus foto galeri."
      setPesanError(msg)
    } finally {
      setActiveOperation(null)
    }
  }

  const handleReorderGaleri = async (index: number, direction: "up" | "down") => {
    if (!detail || activeOperation || !isAuthenticated) return
    const list = detail.galeri
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return

    const itemA = list[index]
    const itemB = list[targetIndex]

    setActiveOperation("reorder_galeri")
    setPesanSukses(null)
    setPesanError(null)

    try {
      const { data: resA, error: errA } = await supabase
        .from("galeri_lembaga_organisasi")
        .update({ urutan: itemB.urutan })
        .eq("id", itemA.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errA || !resA) {
        setPesanError("Gagal mengubah urutan galeri.")
        setActiveOperation(null)
        return
      }

      const { data: resB, error: errB } = await supabase
        .from("galeri_lembaga_organisasi")
        .update({ urutan: itemA.urutan })
        .eq("id", itemB.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (errB || !resB) {
        await supabase
          .from("galeri_lembaga_organisasi")
          .update({ urutan: itemA.urutan })
          .eq("id", itemA.id)
          .eq("lembaga_organisasi_id", dataId)
        setPesanError("Gagal mengubah urutan galeri.")
        setActiveOperation(null)
        return
      }

      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat mengurutkan galeri.")
    } finally {
      setActiveOperation(null)
    }
  }

  // ============================================================================
  // SECTION 5: RENDER VIEWS
  // ============================================================================
  if (checkingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b4b1d] border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-gray-600">Memeriksa sesi autentikasi...</p>
      </div>
    )
  }

  if (!isValidLembagaOrganisasiId(dataId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900">ID Lembaga / Organisasi Tidak Valid</h2>
        <p className="mt-2 text-sm text-gray-600">Format ID yang Anda tuju tidak sesuai standar UUID.</p>
        <Link
          href="/admin/lembaga-organisasi"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
        >
          Kembali ke Daftar Admin
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b4b1d] border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-gray-600">Memuat rincian lembaga dan organisasi...</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900">Data Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-gray-600">Data lembaga atau organisasi ini tidak ditemukan atau sudah dihapus.</p>
        <Link
          href="/admin/lembaga-organisasi"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
        >
          Kembali ke Daftar Admin
        </Link>
      </div>
    )
  }

  const { data: parent } = detail

  return (
    <div className="min-h-screen bg-admin-warm pb-20 text-[#1F2937]">
      {/* Top Header Panel - Warm Modern Government Theme */}
      <header className="bg-gradient-to-r from-[#1A1200] via-[#2C1B01] to-[#3D2605] border-b border-[#B6A587]/30 shadow-lg text-white mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link
              href="/admin/lembaga-organisasi"
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#B6A587]/15 hover:bg-[#B6A587]/30 text-[#B6A587] hover:text-white border border-[#B6A587]/30 transition-all transform hover:-translate-x-1 cursor-pointer"
              title="Kembali ke Daftar Lembaga / Organisasi"
              aria-label="Kembali ke Daftar Lembaga / Organisasi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Rincian: {parent.nama}
                </h1>
                {parent.is_active ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                    Aktif (Publik)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola data pengurus, tugas, serta galeri foto lembaga.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

        {/* NOTIFIKASI GLOBAL */}
        {pesanSukses && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 shadow-sm">
            {pesanSukses}
          </div>
        )}
        {pesanError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
            {pesanError}
          </div>
        )}

        {/* PANEL 1: EDITABLE DATA UTAMA FORM */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">1. Data Utama Lembaga / Organisasi</h2>
            <p className="text-xs text-gray-500">
              Perbarui rincian profil dan informasi kontak. Perubahan disimpan secara langsung.
            </p>
          </div>

          <form onSubmit={handleSubmitDataUtama} className="mt-6 space-y-6">
            {/* Nama */}
            <div>
              <label htmlFor="input-nama" className="block text-sm font-semibold text-gray-700">
                Nama Resmi Lembaga / Organisasi <span className="text-red-500">*</span>
              </label>
              <input
                id="input-nama"
                type="text"
                value={dataUtamaForm.nama}
                onChange={(e) => setDataUtamaForm({ ...dataUtamaForm, nama: e.target.value })}
                onFocus={(e) => e.currentTarget.select()}
                disabled={savingDataUtama || Boolean(activeOperation)}
                placeholder="Contoh: Posyandu Lansia Manggih"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
              />
              {dataUtamaErrors.nama && (
                <p className="mt-1 text-xs font-medium text-red-600">{dataUtamaErrors.nama}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="input-deskripsi" className="block text-sm font-semibold text-gray-700">
                Deskripsi / Profil <span className="text-red-500">*</span>
              </label>
              <textarea
                id="input-deskripsi"
                rows={5}
                value={dataUtamaForm.deskripsi}
                onChange={(e) => setDataUtamaForm({ ...dataUtamaForm, deskripsi: e.target.value })}
                onFocus={(e) => e.currentTarget.select()}
                disabled={savingDataUtama || Boolean(activeOperation)}
                placeholder="Tuliskan profil dan visi misi..."
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
              />
              {dataUtamaErrors.deskripsi && (
                <p className="mt-1 text-xs font-medium text-red-600">{dataUtamaErrors.deskripsi}</p>
              )}
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor="input-alamat" className="block text-sm font-semibold text-gray-700">
                Alamat Kantor <span className="text-red-500">*</span>
              </label>
              <textarea
                id="input-alamat"
                rows={2}
                value={dataUtamaForm.alamat}
                onChange={(e) => setDataUtamaForm({ ...dataUtamaForm, alamat: e.target.value })}
                onFocus={(e) => e.currentTarget.select()}
                disabled={savingDataUtama || Boolean(activeOperation)}
                placeholder="Jalan, Jorong, atau lokasi gedung..."
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
              />
              {dataUtamaErrors.alamat && (
                <p className="mt-1 text-xs font-medium text-red-600">{dataUtamaErrors.alamat}</p>
              )}
            </div>

            {/* Kontak & Jam Kerja Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="input-kontak" className="block text-sm font-semibold text-gray-700">
                  Nomor Kontak <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                </label>
                <input
                  id="input-kontak"
                  type="text"
                  value={dataUtamaForm.kontak}
                  onChange={(e) => setDataUtamaForm({ ...dataUtamaForm, kontak: e.target.value })}
                  onFocus={(e) => e.currentTarget.select()}
                  disabled={savingDataUtama || Boolean(activeOperation)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                />
                {dataUtamaErrors.kontak && (
                  <p className="mt-1 text-xs font-medium text-red-600">{dataUtamaErrors.kontak}</p>
                )}
              </div>

              <div>
                <label htmlFor="input-jam-kerja" className="block text-sm font-semibold text-gray-700">
                  Jam Operasional <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                </label>
                <textarea
                  id="input-jam-kerja"
                  rows={2}
                  value={dataUtamaForm.jam_kerja}
                  onChange={(e) => setDataUtamaForm({ ...dataUtamaForm, jam_kerja: e.target.value })}
                  disabled={savingDataUtama || Boolean(activeOperation)}
                  placeholder="Contoh: Senin - Jumat (08.00 - 16.00 WIB)"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                />
                {dataUtamaErrors.jam_kerja && (
                  <p className="mt-1 text-xs font-medium text-red-600">{dataUtamaErrors.jam_kerja}</p>
                )}
              </div>
            </div>

            {/* Simpan Perubahan Button */}
            <div className="flex items-center justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={savingDataUtama || Boolean(activeOperation)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {savingDataUtama ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* PANEL 2: STRUKTUR PENGURUS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">2. Struktur Pengurus</h2>
              <p className="text-xs text-gray-500">Kelola susunan jabatan dan pejabat pengurus.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenTambahPengurus}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6b4b1d] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              + Tambah Pengurus
            </button>
          </div>

          {detail.pengurus.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-500 italic py-6">
              Belum ada data pengurus. Tambahkan pengurus pertama di atas.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {detail.pengurus.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt={p.nama_jabatan}
                        className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-[#6b4b1d]/20"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-[#6b4b1d]">
                        {p.nama_jabatan.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{p.nama_jabatan}</h4>
                      <p className="text-xs text-gray-600">
                        Pejabat: <span className="font-medium">{p.nama_pengurus || "Belum diisi"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorderPengurus(idx, "up")}
                        disabled={idx === 0 || Boolean(activeOperation)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                        title="Naikkan Urutan"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderPengurus(idx, "down")}
                        disabled={idx === detail.pengurus.length - 1 || Boolean(activeOperation)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                        title="Turunkan Urutan"
                      >
                        ▼
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditPengurus(p)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    {p.foto_storage_path && (
                      <button
                        type="button"
                        onClick={() => handleHapusFotoPengurus(p)}
                        disabled={Boolean(activeOperation)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Hapus Foto
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleHapusPengurus(p)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PANEL 3: DAFTAR TUGAS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">3. Daftar Tugas & Fungsi</h2>
              <p className="text-xs text-gray-500">Kelola butir tugas lembaga/organisasi.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenTambahTugas}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6b4b1d] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              + Tambah Tugas
            </button>
          </div>

          {detail.tugas.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-500 italic py-6">
              Belum ada daftar tugas. Tambahkan tugas pertama di atas.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {detail.tugas.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#6b4b1d] text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-800 break-words">{t.isi_tugas}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorderTugas(idx, "up")}
                        disabled={idx === 0 || Boolean(activeOperation)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderTugas(idx, "down")}
                        disabled={idx === detail.tugas.length - 1 || Boolean(activeOperation)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditTugas(t)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHapusTugas(t)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PANEL 4: GALERI FOTO & COVER */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">4. Galeri Foto & Cover Utama</h2>
              <p className="text-xs text-gray-500">Unggah foto kegiatan dan pilih satu cover aktif.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenTambahGaleri}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6b4b1d] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              + Unggah Foto Galeri
            </button>
          </div>

          {detail.galeri.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-500 italic py-6">
              Belum ada foto galeri. Unggah foto galeri pertama di atas.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {detail.galeri.map((g, idx) => (
                <div
                  key={g.id}
                  className={`relative flex flex-col overflow-hidden rounded-xl border p-3 shadow-sm transition-all ${
                    g.is_cover && g.is_active
                      ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/30"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="relative h-44 w-full overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={g.foto_url}
                      alt={g.teks_alt || "Foto Galeri"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                      {g.is_cover && g.is_active && (
                        <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                          Cover Utama
                        </span>
                      )}
                      {!g.is_active && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Nonaktif
                        </span>
                      )}
                    </div>

                    {/* Reorder Galeri Controls */}
                    <div className="absolute bottom-2 right-2 flex gap-1 bg-black/40 p-1 rounded-lg backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => handleReorderGaleri(idx, "up")}
                        disabled={idx === 0 || Boolean(activeOperation)}
                        className="rounded bg-white/80 p-1 text-xs font-bold text-gray-900 hover:bg-white disabled:opacity-30"
                        title="Geser Kiri/Atas"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderGaleri(idx, "down")}
                        disabled={idx === detail.galeri.length - 1 || Boolean(activeOperation)}
                        className="rounded bg-white/80 p-1 text-xs font-bold text-gray-900 hover:bg-white disabled:opacity-30"
                        title="Geser Kanan/Bawah"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-600 italic break-words min-h-[32px]">
                    {g.teks_alt ? `Alt: "${g.teks_alt}"` : "Tanpa teks alternatif"}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 gap-2 flex-wrap">
                    {!g.is_cover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(g)}
                        disabled={Boolean(activeOperation)}
                        className="rounded-lg border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Jadikan Cover
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditAlt(g)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit Alt
                    </button>

                    <button
                      type="button"
                      onClick={() => handleHapusGaleri(g)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
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

      {/* MODAL FORM PENGURUS */}
      {isPengurusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
              {editingPengurus ? "Edit Pengurus" : "Tambah Pengurus Baru"}
            </h3>
            <form onSubmit={handleSubmitPengurus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Nama Jabatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pengurusNamaJabatan}
                  onChange={(e) => setPengurusNamaJabatan(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Contoh: Ketua LPMN"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Nama Pejabat / Pengurus <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={pengurusNamaPengurus}
                  onChange={(e) => setPengurusNamaPengurus(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Contoh: H. Ahmad Sukarno, S.Pd."
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Foto Pengurus <span className="text-gray-400 font-normal">(JPG, PNG, WebP max 5MB)</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePengurusFileChange}
                  className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[#f7f2e8] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#6b4b1d] hover:file:bg-[#ebdcc4]"
                />
                {pengurusFotoPreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={pengurusFotoPreview}
                      alt="Preview"
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-[#6b4b1d]/20"
                    />
                    <span className="text-xs text-gray-500">Preview foto dipilih</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsPengurusModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(activeOperation)}
                  className="rounded-xl bg-[#6b4b1d] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {activeOperation === "pengurus_submit" ? "Menyimpan..." : "Simpan Pengurus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM TUGAS */}
      {isTugasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
              {editingTugas ? "Edit Butir Tugas" : "Tambah Butir Tugas"}
            </h3>
            <form onSubmit={handleSubmitTugas} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Isi Tugas / Fungsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={tugasIsiTugas}
                  onChange={(e) => setTugasIsiTugas(e.target.value)}
                  placeholder="Tuliskan perincian tugas atau fungsi..."
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsTugasModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(activeOperation)}
                  className="rounded-xl bg-[#6b4b1d] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {activeOperation === "tugas_submit" ? "Menyimpan..." : "Simpan Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BATCH UNGGAH GALERI */}
      {isGaleriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Unggah Foto Galeri</h3>
            <form onSubmit={handleSubmitGaleriBatch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Pilih Foto <span className="text-red-500">*</span> (Dapat memilih beberapa file, max 5MB/file)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGaleriFilesChange}
                  className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[#f7f2e8] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#6b4b1d] hover:file:bg-[#ebdcc4]"
                  required
                />
                {galeriFiles.length > 0 && (
                  <p className="mt-2 text-xs text-gray-600 font-medium">
                    {galeriFiles.length} file terpilih.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Teks Alternatif / Deskripsi Singkat <span className="text-gray-400 font-normal">(Opsional untuk batch)</span>
                </label>
                <input
                  type="text"
                  value={galeriTeksAlt}
                  onChange={(e) => setGaleriTeksAlt(e.target.value)}
                  placeholder="Contoh: Rapat Kerja Nagari 2026"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsGaleriModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(activeOperation) || galeriFiles.length === 0}
                  className="rounded-xl bg-[#6b4b1d] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {activeOperation === "upload_galeri" ? "Mengunggah..." : "Mulai Unggah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT ALT GALERI */}
      {isEditAltModalOpen && editingAltGaleri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Edit Teks Alternatif Foto</h3>
            <form onSubmit={handleSubmitEditAlt} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Teks Alternatif / Deskripsi Foto
                </label>
                <input
                  type="text"
                  value={altValue}
                  onChange={(e) => setAltValue(e.target.value)}
                  placeholder="Tuliskan teks alternatif untuk pembaca layar..."
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditAltModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(activeOperation)}
                  className="rounded-xl bg-[#6b4b1d] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {activeOperation === "edit_alt" ? "Simpan..." : "Simpan Teks Alt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(activeOperation)}
        loadingText="Menghapus..."
        onConfirm={async () => {
          await confirmModalState.onConfirm()
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
