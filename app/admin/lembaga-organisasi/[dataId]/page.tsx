"use client"

import { use, useEffect, useState, FormEvent, ChangeEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  DetailLembagaOrganisasiAdmin,
  PengurusLembagaOrganisasi,
  TugasLembagaOrganisasi,
  GaleriLembagaOrganisasi,
  LEMBAGA_ORGANISASI_BUCKET,
  fetchDetailLembagaOrganisasiAdmin,
  formatJenisLembagaOrganisasi,
  isValidLembagaOrganisasiId,
} from "@/lib/lembagaOrganisasi"

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
    return "Terjadi duplikasi data (misal: nama duplikat atau foto cover ganda)."
  }
  if (code === "23514") {
    return "Data melanggar aturan validasi database."
  }
  if (code === "23503") {
    return "Data utama tidak ditemukan atau relasi tidak valid."
  }
  if (code === "P0001") {
    return "Lembaga atau organisasi aktif wajib memiliki foto cover aktif."
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

export default function AdminDetailLembagaOrganisasiPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const dataId = resolvedParams?.dataId || ""

  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<DetailLembagaOrganisasiAdmin | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)

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
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal memuat detail lembaga dan organisasi."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const authed = await periksaAuth()
      if (authed) {
        await loadDetail()
      }
    }
    init()
  }, [dataId])

  // ============================================================================
  // SECTION 1: PUBLIKASI & DEACTIVATE PARENT
  // ============================================================================
  const handleTogglePublikasi = async () => {
    if (!detail || activeOperation || !isAuthenticated) return
    setPesanSukses(null)
    setPesanError(null)

    const isCurrentlyActive = detail.data.is_active

    if (!isCurrentlyActive) {
      const hasActiveCover = detail.galeri.some((g) => g.is_cover && g.is_active)
      if (!hasActiveCover) {
        setPesanError("Tentukan foto cover aktif terlebih dahulu sebelum mempublikasikan data.")
        return
      }
    }

    setActiveOperation("publikasi")

    try {
      const { data: updatedParent, error } = await supabase
        .from("lembaga_organisasi")
        .update({ is_active: !isCurrentlyActive })
        .eq("id", dataId)
        .select("id")
        .maybeSingle()

      if (error) {
        setPesanError(parseErrorMessage(error, "Gagal mengubah status publikasi."))
        setActiveOperation(null)
        return
      }

      if (!updatedParent) {
        setPesanError("Data lembaga/organisasi tidak ditemukan atau tidak dapat diubah.")
        setActiveOperation(null)
        return
      }

      setPesanSukses(
        !isCurrentlyActive
          ? "Lembaga/organisasi berhasil dipublikasikan."
          : "Lembaga/organisasi berhasil dijadikan draft."
      )
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat mengubah publikasi."))
    } finally {
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
        alert(err)
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

  const handleHapusFotoPengurus = async (p: PengurusLembagaOrganisasi) => {
    if (!detail || activeOperation || !p.foto_storage_path || !isAuthenticated) return
    if (!window.confirm(`Hapus foto pengurus '${p.nama_jabatan}'?`)) return

    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_foto_pengurus")

    try {
      const oldPath = p.foto_storage_path
      const { error: errRemove } = await supabase.storage
        .from(LEMBAGA_ORGANISASI_BUCKET)
        .remove([oldPath])

      if (errRemove) {
        setPesanError(parseErrorMessage(errRemove, "Gagal menghapus foto dari storage."))
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
        setPesanError("Foto di storage terhapus tetapi gagal memperbarui metadata database.")
        setActiveOperation(null)
        return
      }

      setPesanSukses("Foto pengurus berhasil dihapus.")
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat menghapus foto pengurus."))
    } finally {
      setActiveOperation(null)
    }
  }

  const handleHapusPengurus = async (p: PengurusLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengurus '${p.nama_jabatan}'?`)) return

    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_pengurus")

    try {
      if (p.foto_storage_path) {
        const { error: errStorage } = await supabase.storage
          .from(LEMBAGA_ORGANISASI_BUCKET)
          .remove([p.foto_storage_path])

        if (errStorage) {
          setPesanError(parseErrorMessage(errStorage, "Gagal menghapus foto pengurus. Penghapusan dibatalkan."))
          setActiveOperation(null)
          return
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
        setPesanError(parseErrorMessage(errDelete, "Gagal menghapus data pengurus dari database."))
        setActiveOperation(null)
        return
      }

      setPesanSukses("Pengurus berhasil dihapus.")
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat menghapus pengurus."))
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

  const handleHapusTugas = async (t: TugasLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    if (!window.confirm("Apakah Anda yakin ingin menghapus butir tugas ini?")) return

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
        setPesanError(parseErrorMessage(error, "Gagal menghapus tugas."))
        setActiveOperation(null)
        return
      }

      setPesanSukses("Tugas berhasil dihapus.")
      await loadDetail()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat menghapus tugas."))
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
          alert(`File '${f.name}': ${err}`)
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
      // 1. Ensure target galeri is active first
      if (!targetGaleri.is_active) {
        const { data: resAct, error: errActive } = await supabase
          .from("galeri_lembaga_organisasi")
          .update({ is_active: true })
          .eq("id", targetGaleri.id)
          .eq("lembaga_organisasi_id", dataId)
          .select("id")
          .maybeSingle()

        if (errActive || !resAct) {
          setPesanError("Gagal mengaktifkan foto galeri sebelum dijadikan cover.")
          setActiveOperation(null)
          return
        }
      }

      // 2. Clear old cover status for this parent
      const oldCovers = detail.galeri.filter((g) => g.is_cover && g.id !== targetGaleri.id)
      for (const old of oldCovers) {
        await supabase
          .from("galeri_lembaga_organisasi")
          .update({ is_cover: false })
          .eq("id", old.id)
          .eq("lembaga_organisasi_id", dataId)
      }

      // 3. Set target galeri as cover
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

      // 4. Restore parent publication state if parent was previously active
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

  const handleToggleGaleriActive = async (g: GaleriLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    setPesanSukses(null)
    setPesanError(null)

    if (g.is_cover && g.is_active) {
      if (
        !window.confirm(
          "Menonaktifkan foto cover akan membuat data lembaga/organisasi kembali menjadi draft. Lanjutkan?"
        )
      ) {
        return
      }
    }

    setActiveOperation("toggle_galeri_active")

    try {
      const { data: updatedRow, error } = await supabase
        .from("galeri_lembaga_organisasi")
        .update({ is_active: !g.is_active })
        .eq("id", g.id)
        .eq("lembaga_organisasi_id", dataId)
        .select("id")
        .maybeSingle()

      if (error || !updatedRow) {
        setPesanError(parseErrorMessage(error, "Gagal mengubah status foto galeri."))
        setActiveOperation(null)
        return
      }

      setPesanSukses("Status foto galeri berhasil diperbarui.")
      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat mengubah status galeri.")
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

  const handleHapusGaleri = async (g: GaleriLembagaOrganisasi) => {
    if (!detail || activeOperation || !isAuthenticated) return
    let confirmMsg = "Apakah Anda yakin ingin menghapus foto galeri ini?"
    if (g.is_cover && g.is_active) {
      confirmMsg = "Menghapus foto cover aktif akan membuat data utama kembali menjadi draft. Lanjutkan penghapusan?"
    }

    if (!window.confirm(confirmMsg)) return

    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("hapus_galeri")

    try {
      // 1. Remove storage object
      const { error: errStorage } = await supabase.storage
        .from(LEMBAGA_ORGANISASI_BUCKET)
        .remove([g.foto_storage_path])

      if (errStorage) {
        setPesanError(parseErrorMessage(errStorage, "Gagal menghapus file foto dari storage. Penghapusan dibatalkan."))
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
        setPesanError("File foto terhapus dari storage tetapi gagal menghapus metadata database.")
        setActiveOperation(null)
        return
      }

      setPesanSukses("Foto galeri berhasil dihapus.")
      await loadDetail()
    } catch {
      setPesanError("Terjadi kesalahan saat menghapus foto galeri.")
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
  // SECTION 5: SAFE DELETE PARENT LENGKAP
  // ============================================================================
  const handleSafeDeleteParent = async () => {
    if (!detail || activeOperation || !isAuthenticated) return

    const namaData = detail.data.nama
    const firstConfirm = window.confirm(
      `PERINGATAN: Anda akan menghapus SELURUH data '${namaData}' beserta pengurus, tugas, galeri, dan seluruh file foto terkait secara permanen. Lanjutkan?`
    )
    if (!firstConfirm) return

    const secondConfirm = window.confirm(
      `KONFIRMASI AKHIR: Hapus permanen '${namaData}' beserta seluruh filenya?`
    )
    if (!secondConfirm) return

    setPesanSukses(null)
    setPesanError(null)
    setActiveOperation("safe_delete_parent")

    try {
      // 1. Set parent is_active = false
      await supabase
        .from("lembaga_organisasi")
        .update({ is_active: false })
        .eq("id", dataId)

      // 2. Collect all storage paths
      const pathsToDelete: string[] = []
      for (const p of detail.pengurus) {
        if (p.foto_storage_path) {
          pathsToDelete.push(p.foto_storage_path)
        }
      }
      for (const g of detail.galeri) {
        if (g.foto_storage_path) {
          pathsToDelete.push(g.foto_storage_path)
        }
      }

      const uniquePaths = Array.from(new Set(pathsToDelete))

      // 3. Remove storage files
      if (uniquePaths.length > 0) {
        const { error: errRemove } = await supabase.storage
          .from(LEMBAGA_ORGANISASI_BUCKET)
          .remove(uniquePaths)

        if (errRemove) {
          setPesanError("Gagal menghapus file foto dari storage. Penghapusan parent dibatalkan.")
          setActiveOperation(null)
          await loadDetail()
          return
        }
      }

      // 4. Delete child tables
      const { error: errGaleri } = await supabase
        .from("galeri_lembaga_organisasi")
        .delete()
        .eq("lembaga_organisasi_id", dataId)

      if (errGaleri) {
        setPesanError("File terhapus tetapi gagal menghapus data galeri.")
        setActiveOperation(null)
        await loadDetail()
        return
      }

      const { error: errTugas } = await supabase
        .from("tugas_lembaga_organisasi")
        .delete()
        .eq("lembaga_organisasi_id", dataId)

      if (errTugas) {
        setPesanError("Gagal menghapus data tugas.")
        setActiveOperation(null)
        await loadDetail()
        return
      }

      const { error: errPengurus } = await supabase
        .from("pengurus_lembaga_organisasi")
        .delete()
        .eq("lembaga_organisasi_id", dataId)

      if (errPengurus) {
        setPesanError("Gagal menghapus data pengurus.")
        setActiveOperation(null)
        await loadDetail()
        return
      }

      // 5. Delete parent
      const { data: delParentRow, error: errParent } = await supabase
        .from("lembaga_organisasi")
        .delete()
        .eq("id", dataId)
        .select("id")
        .maybeSingle()

      if (errParent || !delParentRow) {
        setPesanError("Rincian terhapus tetapi gagal menghapus data utama parent.")
        setActiveOperation(null)
        await loadDetail()
        return
      }

      router.push("/admin/lembaga-organisasi")
      router.refresh()
    } catch {
      setPesanError("Terjadi kesalahan saat menghapus data lengkap.")
      setActiveOperation(null)
    }
  }

  // ============================================================================
  // SECTION 6: RENDER VIEWS
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 space-y-8">
        {/* HEADER & NAVIGASI */}
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/lembaga-organisasi"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                title="Kembali ke Daftar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6b4b1d]">
                    {formatJenisLembagaOrganisasi(parent.jenis)}
                  </span>
                  {parent.is_active ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                      Aktif (Publik)
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                      Draft
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl break-words">{parent.nama}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleTogglePublikasi}
                disabled={Boolean(activeOperation)}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all disabled:opacity-50 ${
                  parent.is_active
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {parent.is_active ? "Jadikan Draft" : "Publikasikan"}
              </button>
            </div>
          </div>
          <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#b6a587]" />
        </div>

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

        {/* PANEL 1: RINGKASAN DATA UTAMA */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">1. Ringkasan Data Utama</h2>
            <Link
              href="/admin/lembaga-organisasi"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Edit Data Utama
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-2">
            <div>
              <span className="font-semibold text-gray-500 block text-xs">NAMA RESMI</span>
              <p className="mt-0.5 font-medium text-gray-900">{parent.nama}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 block text-xs">JENIS</span>
              <p className="mt-0.5 font-medium text-gray-900">{formatJenisLembagaOrganisasi(parent.jenis)}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-gray-500 block text-xs">DESKRIPSI / PROFIL</span>
              <p className="mt-0.5 whitespace-pre-wrap text-gray-800">{parent.deskripsi}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 block text-xs">ALAMAT KANTOR</span>
              <p className="mt-0.5 text-gray-800">{parent.alamat}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 block text-xs">KONTAK & JAM KERJA</span>
              <p className="mt-0.5 text-gray-800">
                Kontak: {parent.kontak || "Belum tersedia"} <br />
                Jam Kerja: {parent.jam_kerja || "Belum tersedia"}
              </p>
            </div>
          </div>
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
                      {g.is_active ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Nonaktif
                        </span>
                      )}
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
                      onClick={() => handleToggleGaleriActive(g)}
                      disabled={Boolean(activeOperation)}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {g.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>

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

        {/* PANEL 5: ZONA BERBAHAYA / SAFE DELETE PARENT LENGKAP */}
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-red-900">5. Zona Berbahaya (Hapus Permanen)</h2>
          <p className="mt-1 text-sm text-red-700">
            Operasi ini akan menghapus data utama, pengurus, tugas, galeri foto, beserta seluruh file pada storage secara permanen.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleSafeDeleteParent}
              disabled={Boolean(activeOperation)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 active:scale-95 disabled:opacity-50"
            >
              {activeOperation === "safe_delete_parent" ? "Menghapus..." : "Hapus Lembaga/Organisasi Lengkap"}
            </button>
          </div>
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
    </div>
  )
}
