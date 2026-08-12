"use client"

import { useEffect, useState, FormEvent, useRef, ChangeEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  DaftarLembagaOrganisasiAdmin,
  GaleriLembagaOrganisasi,
  JenisLembagaOrganisasi,
  LEMBAGA_ORGANISASI_BUCKET,
  fetchDaftarLembagaOrganisasiAdmin,
  fetchDetailLembagaOrganisasiAdmin,
} from "@/lib/lembagaOrganisasi"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface FormDataUtama {
  jenis: JenisLembagaOrganisasi
  nama: string
  deskripsi: string
  alamat: string
  kontak: string
  jam_kerja: string
}

interface DraftPengurusItem {
  clientId: string
  nama_jabatan: string
  nama_pengurus: string
}

interface DraftTugasItem {
  clientId: string
  isi_tugas: string
}

interface LocalGaleriItem {
  clientId: string
  file: File
  previewUrl: string
  teks_alt: string
}

const INITIAL_DATA_UTAMA: FormDataUtama = {
  jenis: "lembaga",
  nama: "",
  deskripsi: "",
  alamat: "",
  kontak: "",
  jam_kerja: "",
}

interface SupabaseErrorLike {
  code?: string
  message?: string
  details?: string
  hint?: string
}

function parseErrorMessage(err: SupabaseErrorLike | null | undefined, defaultMsg: string): string {
  if (!err) return defaultMsg
  const code = err.code || ""
  const msg = err.message || ""
  if (code === "23505") {
    return "Nama tersebut sudah digunakan."
  }
  if (code === "23514") {
    return `Data tidak memenuhi aturan validasi database.${msg ? ` (${msg})` : ""}`
  }
  if (code === "23503") {
    return "Relasi data tidak valid."
  }
  if (code === "P0001") {
    return `Operasi ditolak oleh aturan bisnis database.${msg ? ` (${msg})` : ""}`
  }
  if (code === "42501") {
    return "Sesi tidak valid atau akses ditolak."
  }
  return msg ? `${defaultMsg} (${msg})` : defaultMsg
}

function generateSafeFilename(file: File): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }
  const ext = mimeToExt[file.type] || "jpg"
  const timestamp = Date.now()
  const randomStr =
    typeof crypto !== "undefined" && crypto.randomUUID
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

export default function AdminLembagaOrganisasiPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [listData, setListData] = useState<DaftarLembagaOrganisasiAdmin[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [submittingForm, setSubmittingForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  // Unified Form State
  const formRef = useRef<HTMLDivElement>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loadingEditData, setLoadingEditData] = useState(false)

  // Form Fields State
  const [dataUtama, setDataUtama] = useState<FormDataUtama>(INITIAL_DATA_UTAMA)
  const [draftPengurus, setDraftPengurus] = useState<DraftPengurusItem[]>([])
  const [draftTugas, setDraftTugas] = useState<DraftTugasItem[]>([])

  // Galeri State (Local files for upload & existing DB items)
  const [localGaleriFiles, setLocalGaleriFiles] = useState<LocalGaleriItem[]>([])
  const [existingGaleri, setExistingGaleri] = useState<GaleriLembagaOrganisasi[]>([])
  const [pendingDeleteGaleriIds, setPendingDeleteGaleriIds] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleLogout = async () => {
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
      console.error("Logout error", error)
      window.location.href = `/login?logout=success&t=${Date.now()}`
    }
  }

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

  const loadData = async () => {
    setLoadingList(true)
    try {
      const data = await fetchDaftarLembagaOrganisasiAdmin()
      setListData(data)
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal memuat daftar lembaga dan organisasi."))
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    const initAuthAndData = async () => {
      const authed = await periksaAuth()
      if (authed) {
        await loadData()
      }
    }
    initAuthAndData()
  }, [])

  // Auto dismiss success toast message after 4 seconds
  useEffect(() => {
    if (!pesanSukses) return
    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSukses])

  // Clean up object URLs to prevent memory leaks
  const clearLocalGaleriPreviews = () => {
    localGaleriFiles.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })
    setLocalGaleriFiles([])
  }

  // Open Create Mode
  const handleOpenCreateForm = () => {
    clearLocalGaleriPreviews()
    setFormMode("create")
    setEditingId(null)
    setDataUtama(INITIAL_DATA_UTAMA)
    setDraftPengurus([])
    setDraftTugas([])
    setExistingGaleri([])
    setPendingDeleteGaleriIds([])
    setFieldErrors({})
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  // Open Edit Mode (In-line from Kelola Rincian button)
  const handleOpenEditForm = async (item: DaftarLembagaOrganisasiAdmin) => {
    clearLocalGaleriPreviews()
    setFormMode("edit")
    setEditingId(item.id)
    setFieldErrors({})
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)
    setLoadingEditData(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)

    try {
      const detail = await fetchDetailLembagaOrganisasiAdmin(item.id)
      if (!detail) {
        setPesanError("Data rincian tidak ditemukan.")
        setIsFormOpen(false)
        return
      }

      setDataUtama({
        jenis: detail.data.jenis || "lembaga",
        nama: detail.data.nama || "",
        deskripsi: detail.data.deskripsi || "",
        alamat: detail.data.alamat || "",
        kontak: detail.data.kontak || "",
        jam_kerja: detail.data.jam_kerja || "",
      })

      setDraftPengurus(
        detail.pengurus.map((p) => ({
          clientId: crypto.randomUUID(),
          nama_jabatan: p.nama_jabatan,
          nama_pengurus: p.nama_pengurus || "",
        }))
      )

      setDraftTugas(
        detail.tugas.map((t) => ({
          clientId: crypto.randomUUID(),
          isi_tugas: t.isi_tugas,
        }))
      )

      setExistingGaleri(detail.galeri || [])
      setPendingDeleteGaleriIds([])
    } catch (err) {
      setPesanError(parseErrorMessage(err as SupabaseErrorLike, "Gagal memuat data rincian."))
    } finally {
      setLoadingEditData(false)
    }
  }

  // Cancel / Close Form Handler
  const handleCancelForm = () => {
    const isDirty =
      dataUtama.nama.trim() ||
      dataUtama.deskripsi.trim() ||
      dataUtama.alamat.trim() ||
      dataUtama.kontak.trim() ||
      dataUtama.jam_kerja.trim() ||
      draftPengurus.length > 0 ||
      draftTugas.length > 0 ||
      localGaleriFiles.length > 0 ||
      pendingDeleteGaleriIds.length > 0

    if (isDirty) {
      setIsCloseConfirmOpen(true)
      return
    }

    resetFormState()
  }

  const resetFormState = () => {
    clearLocalGaleriPreviews()
    setIsFormOpen(false)
    setFormMode(null)
    setEditingId(null)
    setDataUtama(INITIAL_DATA_UTAMA)
    setDraftPengurus([])
    setDraftTugas([])
    setExistingGaleri([])
    setPendingDeleteGaleriIds([])
    setFieldErrors({})
  }

  // Handle Local Galeri Selection
  const handleAddLocalGaleriFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const filesArray = Array.from(e.target.files)
    const newItems: LocalGaleriItem[] = []

    for (const file of filesArray) {
      const errorMsg = validateImageFile(file)
      if (errorMsg) {
        setPesanError(`File '${file.name}': ${errorMsg}`)
        continue
      }
      newItems.push({
        clientId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        teks_alt: "",
      })
    }

    if (newItems.length > 0) {
      setLocalGaleriFiles((prev) => [...prev, ...newItems])
    }

    e.target.value = ""
  }

  const handleRemoveLocalGaleriItem = (clientId: string) => {
    setLocalGaleriFiles((prev) => {
      const target = prev.find((item) => item.clientId === clientId)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.clientId !== clientId)
    })
  }

  const handleUpdateLocalGaleriAlt = (clientId: string, val: string) => {
    setLocalGaleriFiles((prev) =>
      prev.map((item) => (item.clientId === clientId ? { ...item, teks_alt: val } : item))
    )
  }

  // Handle Deferred Deletion of Existing Galeri Items in Edit Mode
  const handleMarkExistingGaleriDelete = (id: string) => {
    setPendingDeleteGaleriIds((prev) => [...prev, id])
    setExistingGaleri((prev) => prev.filter((g) => g.id !== id))
  }

  // Handle Pengurus Rows
  const handleAddPengurusRow = () => {
    setDraftPengurus((prev) => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        nama_jabatan: "",
        nama_pengurus: "",
      },
    ])
  }

  const handleUpdatePengurusRow = (
    clientId: string,
    field: "nama_jabatan" | "nama_pengurus",
    val: string
  ) => {
    setDraftPengurus((prev) =>
      prev.map((row) => (row.clientId === clientId ? { ...row, [field]: val } : row))
    )
  }

  const handleDeletePengurusRow = (clientId: string) => {
    setDraftPengurus((prev) => prev.filter((row) => row.clientId !== clientId))
  }

  const handleMovePengurusRow = (index: number, direction: "up" | "down") => {
    setDraftPengurus((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  // Handle Tugas Rows
  const handleAddTugasRow = () => {
    setDraftTugas((prev) => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        isi_tugas: "",
      },
    ])
  }

  const handleUpdateTugasRow = (clientId: string, val: string) => {
    setDraftTugas((prev) =>
      prev.map((row) => (row.clientId === clientId ? { ...row, isi_tugas: val } : row))
    )
  }

  const handleDeleteTugasRow = (clientId: string) => {
    setDraftTugas((prev) => prev.filter((row) => row.clientId !== clientId))
  }

  const handleMoveTugasRow = (index: number, direction: "up" | "down") => {
    setDraftTugas((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  // Validasi Client-side Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    const namaTrim = dataUtama.nama.trim()
    if (namaTrim.length < 2 || namaTrim.length > 200) {
      errors.nama = "Nama harus diisi 2 sampai 200 karakter."
    }

    const deskripsiTrim = dataUtama.deskripsi.trim()
    if (deskripsiTrim.length < 10 || deskripsiTrim.length > 5000) {
      errors.deskripsi = "Deskripsi harus diisi 10 sampai 5000 karakter."
    }

    const alamatTrim = dataUtama.alamat.trim()
    if (alamatTrim.length < 3 || alamatTrim.length > 500) {
      errors.alamat = "Alamat harus diisi 3 sampai 500 karakter."
    }

    const kontakTrim = dataUtama.kontak.trim()
    if (kontakTrim.length > 0 && kontakTrim.length > 100) {
      errors.kontak = "Nomor kontak maksimal 100 karakter."
    }

    const jamKerjaTrim = dataUtama.jam_kerja.trim()
    if (jamKerjaTrim.length > 0 && jamKerjaTrim.length > 300) {
      errors.jam_kerja = "Jam operasional maksimal 300 karakter."
    }

    draftPengurus.forEach((p, idx) => {
      if (!p.nama_jabatan.trim()) {
        errors[`pengurus_jabatan_${p.clientId}`] = `Nama jabatan pengurus #${idx + 1} wajib diisi.`
      }
    })

    draftTugas.forEach((t, idx) => {
      if (!t.isi_tugas.trim()) {
        errors[`tugas_${t.clientId}`] = `Isi tugas #${idx + 1} wajib diisi.`
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Unified Form (Create / Edit)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPesanSukses(null)
    setPesanError(null)

    if (submittingForm) return
    if (!validateForm()) return

    setSubmittingForm(true)

    try {
      if (formMode === "create") {
        // Step 1: Build Payload & Insert Parent Row as is_active = true (Auto-Active)
        const payload = {
          jenis: dataUtama.jenis === "organisasi" ? "organisasi" : "lembaga",
          nama: dataUtama.nama.trim(),
          deskripsi: dataUtama.deskripsi.trim(),
          alamat: dataUtama.alamat.trim(),
          kontak: dataUtama.kontak.trim() === "" ? null : dataUtama.kontak.trim(),
          jam_kerja: dataUtama.jam_kerja.trim() === "" ? null : dataUtama.jam_kerja.trim(),
          is_active: true,
        }

        console.log("CREATE LEMBAGA PAYLOAD:", payload)

        const { data: parentData, error: parentErr } = await supabase
          .from("lembaga_organisasi")
          .insert(payload)
          .select("id, nama")
          .single()

        if (parentErr || !parentData) {
          if (parentErr) {
            console.error("SUPABASE CREATE LEMBAGA ERROR:", {
              code: parentErr.code,
              message: parentErr.message,
              details: parentErr.details,
              hint: parentErr.hint,
            })
          }
          setPesanError(parseErrorMessage(parentErr, "Gagal menyimpan data utama lembaga."))
          return
        }

        const newId = parentData.id

        // Step 2: Insert Pengurus
        if (draftPengurus.length > 0) {
          const pengurusPayload = draftPengurus.map((p, idx) => ({
            lembaga_organisasi_id: newId,
            nama_jabatan: p.nama_jabatan.trim(),
            nama_pengurus: p.nama_pengurus.trim() || null,
            urutan: idx + 1,
          }))
          const { error: pErr } = await supabase
            .from("pengurus_lembaga_organisasi")
            .insert(pengurusPayload)

          if (pErr) {
            console.error("Error inserting pengurus:", pErr)
          }
        }

        // Step 3: Insert Tugas
        if (draftTugas.length > 0) {
          const tugasPayload = draftTugas.map((t, idx) => ({
            lembaga_organisasi_id: newId,
            isi_tugas: t.isi_tugas.trim(),
            urutan: idx + 1,
          }))
          const { error: tErr } = await supabase
            .from("tugas_lembaga_organisasi")
            .insert(tugasPayload)

          if (tErr) {
            console.error("Error inserting tugas:", tErr)
          }
        }

        // Step 4: Upload & Insert Local Galeri Files (Optional Cover)
        let galeriUploadErrorMsg: string | null = null

        if (localGaleriFiles.length > 0) {
          for (let i = 0; i < localGaleriFiles.length; i++) {
            const item = localGaleriFiles[i]
            const galleryRowId = crypto.randomUUID()
            const filename = generateSafeFilename(item.file)
            const storagePath = `lembaga-organisasi/${newId}/galeri/${galleryRowId}/${filename}`

            const { error: uploadErr } = await supabase.storage
              .from(LEMBAGA_ORGANISASI_BUCKET)
              .upload(storagePath, item.file, { contentType: item.file.type })

            if (uploadErr) {
              console.error(`Upload error '${item.file.name}':`, uploadErr)
              galeriUploadErrorMsg = `Gagal mengunggah foto '${item.file.name}': ${parseErrorMessage(uploadErr, "")}`
              continue
            }

            const { data: pubData } = supabase.storage
              .from(LEMBAGA_ORGANISASI_BUCKET)
              .getPublicUrl(storagePath)

            const { error: insGaleriErr } = await supabase
              .from("galeri_lembaga_organisasi")
              .insert({
                id: galleryRowId,
                lembaga_organisasi_id: newId,
                foto_url: pubData.publicUrl,
                foto_storage_path: storagePath,
                teks_alt: item.teks_alt.trim() || null,
                is_cover: i === 0,
                is_active: true,
                urutan: i + 1,
              })

            if (insGaleriErr) {
              console.error(`Metadata galeri insert error '${item.file.name}':`, insGaleriErr)
              galeriUploadErrorMsg = `Gagal menyimpan metadata foto '${item.file.name}': ${parseErrorMessage(insGaleriErr, "")}`
              try {
                await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove([storagePath])
              } catch (rmErr) {
                console.error("Clean up orphan storage file error:", rmErr)
              }
            }
          }
        }

        clearLocalGaleriPreviews()
        setIsFormOpen(false)
        setFormMode(null)
        setEditingId(null)

        if (galeriUploadErrorMsg) {
          setPesanSukses(`Lembaga / Organisasi '${parentData.nama}' berhasil disimpan, namun foto gagal diunggah: ${galeriUploadErrorMsg}`)
        } else {
          setPesanSukses(`Lembaga / Organisasi '${parentData.nama}' berhasil ditambahkan.`)
        }
        await loadData()
      } else if (formMode === "edit" && editingId) {
        // Mode Edit
        // Step 1: Build Update Payload & Update Parent Data
        const updatePayload = {
          jenis: dataUtama.jenis === "organisasi" ? "organisasi" : "lembaga",
          nama: dataUtama.nama.trim(),
          deskripsi: dataUtama.deskripsi.trim(),
          alamat: dataUtama.alamat.trim(),
          kontak: dataUtama.kontak.trim() === "" ? null : dataUtama.kontak.trim(),
          jam_kerja: dataUtama.jam_kerja.trim() === "" ? null : dataUtama.jam_kerja.trim(),
        }

        console.log("EDIT LEMBAGA PAYLOAD:", updatePayload)

        const { error: updateParentErr } = await supabase
          .from("lembaga_organisasi")
          .update(updatePayload)
          .eq("id", editingId)

        if (updateParentErr) {
          console.error("SUPABASE EDIT LEMBAGA ERROR:", {
            code: updateParentErr.code,
            message: updateParentErr.message,
            details: updateParentErr.details,
            hint: updateParentErr.hint,
          })
          setPesanError(parseErrorMessage(updateParentErr, "Gagal memperbarui data utama."))
          return
        }

        // Step 2: Reconcile Pengurus
        await supabase
          .from("pengurus_lembaga_organisasi")
          .delete()
          .eq("lembaga_organisasi_id", editingId)

        if (draftPengurus.length > 0) {
          const pengurusPayload = draftPengurus.map((p, idx) => ({
            lembaga_organisasi_id: editingId,
            nama_jabatan: p.nama_jabatan.trim(),
            nama_pengurus: p.nama_pengurus.trim() || null,
            urutan: idx + 1,
          }))
          await supabase.from("pengurus_lembaga_organisasi").insert(pengurusPayload)
        }

        // Step 3: Reconcile Tugas
        await supabase
          .from("tugas_lembaga_organisasi")
          .delete()
          .eq("lembaga_organisasi_id", editingId)

        if (draftTugas.length > 0) {
          const tugasPayload = draftTugas.map((t, idx) => ({
            lembaga_organisasi_id: editingId,
            isi_tugas: t.isi_tugas.trim(),
            urutan: idx + 1,
          }))
          await supabase.from("tugas_lembaga_organisasi").insert(tugasPayload)
        }

        // Step 4: Delete Pending Deleted Galeri Items
        if (pendingDeleteGaleriIds.length > 0) {
          const { data: rowsToDelete } = await supabase
            .from("galeri_lembaga_organisasi")
            .select("foto_storage_path")
            .in("id", pendingDeleteGaleriIds)

          const paths = rowsToDelete
            ?.map((r) => r.foto_storage_path)
            .filter((p): p is string => Boolean(p))

          if (paths && paths.length > 0) {
            await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove(paths)
          }

          await supabase
            .from("galeri_lembaga_organisasi")
            .delete()
            .in("id", pendingDeleteGaleriIds)
        }

        // Step 5: Upload & Insert New Local Galeri Photos
        if (localGaleriFiles.length > 0) {
          const existingCount = existingGaleri.length
          const hasExistingCover = existingGaleri.some((g) => g.is_cover && g.is_active)

          for (let i = 0; i < localGaleriFiles.length; i++) {
            const item = localGaleriFiles[i]
            const galleryRowId = crypto.randomUUID()
            const filename = generateSafeFilename(item.file)
            const storagePath = `lembaga-organisasi/${editingId}/galeri/${galleryRowId}/${filename}`

            const { error: uploadErr } = await supabase.storage
              .from(LEMBAGA_ORGANISASI_BUCKET)
              .upload(storagePath, item.file, { contentType: item.file.type })

            if (!uploadErr) {
              const { data: pubData } = supabase.storage
                .from(LEMBAGA_ORGANISASI_BUCKET)
                .getPublicUrl(storagePath)

              const isCoverItem = !hasExistingCover && i === 0
              const { error: insErr } = await supabase.from("galeri_lembaga_organisasi").insert({
                id: galleryRowId,
                lembaga_organisasi_id: editingId,
                foto_url: pubData.publicUrl,
                foto_storage_path: storagePath,
                teks_alt: item.teks_alt.trim() || null,
                is_cover: isCoverItem,
                is_active: true,
                urutan: existingCount + i + 1,
              })

              if (insErr) {
                console.error("Gagal insert metadata galeri edit:", insErr)
                await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove([storagePath])
              }
            } else {
              console.error("Upload error galeri edit:", uploadErr)
            }
          }
        }

        clearLocalGaleriPreviews()
        setIsFormOpen(false)
        setFormMode(null)
        setEditingId(null)
        setPesanSukses(`Lembaga / Organisasi '${dataUtama.nama}' berhasil diperbarui.`)
        await loadData()
      }
    } catch (err) {
      setPesanError(parseErrorMessage(err as SupabaseErrorLike, "Terjadi kesalahan saat menyimpan."))
    } finally {
      setSubmittingForm(false)
    }
  }

  // Safe Delete Completer with Storage Cleanup
  const executeSafeDelete = async (id: string, nama: string) => {
    setDeletingId(id)
    setPesanSukses(null)
    setPesanError(null)

    try {
      // Fetch Galeri Storage files
      const { data: galeriFiles } = await supabase
        .from("galeri_lembaga_organisasi")
        .select("foto_url")
        .eq("lembaga_organisasi_id", id)

      // Fetch Pengurus Storage files
      const { data: pengurusFiles } = await supabase
        .from("pengurus_lembaga_organisasi")
        .select("foto_url")
        .eq("lembaga_organisasi_id", id)

      const storagePaths: string[] = []
      const extractPath = (url: string | null | undefined): string | null => {
        if (!url) return null
        try {
          const parts = url.split(`${LEMBAGA_ORGANISASI_BUCKET}/`)
          if (parts.length >= 2) return parts[1]
        } catch {
          // ignore
        }
        return null
      }

      galeriFiles?.forEach((g) => {
        const p = extractPath(g.foto_url)
        if (p) storagePaths.push(p)
      })

      pengurusFiles?.forEach((p) => {
        const pathStr = extractPath(p.foto_url)
        if (pathStr) storagePaths.push(pathStr)
      })

      if (storagePaths.length > 0) {
        await supabase.storage.from(LEMBAGA_ORGANISASI_BUCKET).remove(storagePaths)
      }

      await supabase.from("galeri_lembaga_organisasi").delete().eq("lembaga_organisasi_id", id)
      await supabase.from("tugas_lembaga_organisasi").delete().eq("lembaga_organisasi_id", id)
      await supabase.from("pengurus_lembaga_organisasi").delete().eq("lembaga_organisasi_id", id)

      const { data: delData, error: errDelete } = await supabase
        .from("lembaga_organisasi")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle()

      if (errDelete || !delData) {
        const msg = parseErrorMessage(errDelete, "Gagal menghapus data utama.")
        setPesanError(msg)
        setDeletingId(null)
        return
      }

      const msg = `Lembaga / Organisasi '${nama}' berhasil dihapus.`
      setPesanSukses(msg)
      await loadData()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      const msg = parseErrorMessage(e, "Terjadi kesalahan saat menghapus data.")
      setPesanError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f2e8]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Memeriksa sesi admin...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
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
                  Kelola Lembaga &amp; Organisasi
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6A587]/20 text-[#B6A587] border border-[#B6A587]/30">
                  Kemasyarakatan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E6DDCF] font-medium mt-0.5">
                Kelola data lembaga adat, kemasyarakatan &amp; organisasi Nagari Aia Manggih Barat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isFormOpen && (
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-[#B6A587] hover:bg-[#c9b99b] text-[#1A1200] font-bold px-4 py-2.5 text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#1A1200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Lembaga / Organisasi</span>
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Global Toast Messages */}
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

        {/* SECTION: UNIFIED FORM TAMBAH / EDIT LEMBAGA/ORGANISASI */}
        {isFormOpen && (
          <div
            ref={formRef}
            id="form-lembaga-section"
            className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {formMode === "edit" ? "Edit Lembaga / Organisasi" : "Tambah Lembaga / Organisasi Baru"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {formMode === "edit"
                  ? "Ubah data utama, kepengurusan, tugas, dan galeri."
                  : "Lengkapi data utama, struktur pengurus, daftar tugas, dan galeri foto."}
              </p>
            </div>

            {/* Body Form Putih */}
            {loadingEditData ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#6b4b1d] border-r-transparent"></div>
                <p className="mt-2 text-xs font-semibold text-gray-600">Memuat rincian data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-8" noValidate>
                {/* BAGIAN 1: DATA UTAMA */}
                <div className="space-y-5 rounded-xl border border-gray-200/80 bg-gray-50/50 p-5">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Data Utama</h3>
                  </div>

                  {/* Kategori (Lembaga vs Organisasi) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                        <input
                          type="radio"
                          name="jenis"
                          value="lembaga"
                          checked={dataUtama.jenis === "lembaga"}
                          onChange={() => setDataUtama({ ...dataUtama, jenis: "lembaga" })}
                          disabled={submittingForm}
                          className="h-4 w-4 text-[#6b4b1d] focus:ring-[#6b4b1d]"
                        />
                        <span>Lembaga Nagari</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                        <input
                          type="radio"
                          name="jenis"
                          value="organisasi"
                          checked={dataUtama.jenis === "organisasi"}
                          onChange={() => setDataUtama({ ...dataUtama, jenis: "organisasi" })}
                          disabled={submittingForm}
                          className="h-4 w-4 text-[#6b4b1d] focus:ring-[#6b4b1d]"
                        />
                        <span>Organisasi Nagari</span>
                      </label>
                    </div>
                  </div>

                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nama Lembaga / Organisasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dataUtama.nama}
                      onChange={(e) => setDataUtama({ ...dataUtama, nama: e.target.value })}
                      onFocus={(e) => e.currentTarget.select()}
                      disabled={submittingForm}
                      placeholder="Contoh: Posyandu Lansia Manggih"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.nama && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.nama}</p>
                    )}
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Deskripsi / Profil <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={dataUtama.deskripsi}
                      onChange={(e) => setDataUtama({ ...dataUtama, deskripsi: e.target.value })}
                      onFocus={(e) => e.currentTarget.select()}
                      disabled={submittingForm}
                      placeholder="Tuliskan profil dan visi misi..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.deskripsi && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.deskripsi}</p>
                    )}
                  </div>

                  {/* Alamat */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Alamat Kantor / Sekelompok <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={dataUtama.alamat}
                      onChange={(e) => setDataUtama({ ...dataUtama, alamat: e.target.value })}
                      onFocus={(e) => e.currentTarget.select()}
                      disabled={submittingForm}
                      placeholder="Jalan, Jorong, atau lokasi gedung kantor..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.alamat && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.alamat}</p>
                    )}
                  </div>

                  {/* Kontak & Jam Kerja Grid */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nomor Kontak <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={dataUtama.kontak}
                        onChange={(e) => setDataUtama({ ...dataUtama, kontak: e.target.value })}
                        onFocus={(e) => e.currentTarget.select()}
                        disabled={submittingForm}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Jam Operasional <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={dataUtama.jam_kerja}
                        onChange={(e) => setDataUtama({ ...dataUtama, jam_kerja: e.target.value })}
                        onFocus={(e) => e.currentTarget.select()}
                        disabled={submittingForm}
                        placeholder="Contoh: Senin - Jumat (08.00 - 16.00 WIB)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* BAGIAN 2: STRUKTUR PENGURUS */}
                <div className="space-y-5 rounded-xl border border-gray-200/80 bg-gray-50/50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                        2
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">Struktur Pengurus</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPengurusRow}
                      disabled={submittingForm}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] hover:bg-[#ebdcc4] shadow-sm transition-colors disabled:opacity-50 cursor-pointer w-fit"
                    >
                      + Tambah Pengurus
                    </button>
                  </div>

                  {draftPengurus.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-4">
                      Belum ada pengurus yang ditambahkan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {draftPengurus.map((p, idx) => (
                        <div
                          key={p.clientId}
                          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center"
                        >
                          <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0">
                            #{idx + 1}
                          </span>

                          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <input
                                type="text"
                                value={p.nama_jabatan}
                                onChange={(e) =>
                                  handleUpdatePengurusRow(p.clientId, "nama_jabatan", e.target.value)
                                }
                                onFocus={(e) => e.currentTarget.select()}
                                disabled={submittingForm}
                                placeholder="Nama Jabatan (misal: Ketua)"
                                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none disabled:opacity-50"
                              />
                              {fieldErrors[`pengurus_jabatan_${p.clientId}`] && (
                                <p className="mt-1 text-[11px] text-red-600">
                                  {fieldErrors[`pengurus_jabatan_${p.clientId}`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <input
                                type="text"
                                value={p.nama_pengurus}
                                onChange={(e) =>
                                  handleUpdatePengurusRow(p.clientId, "nama_pengurus", e.target.value)
                                }
                                onFocus={(e) => e.currentTarget.select()}
                                disabled={submittingForm}
                                placeholder="Nama Pejabat (misal: Ahmad, S.Pd)"
                                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* Control Buttons */}
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleMovePengurusRow(idx, "up")}
                              disabled={idx === 0 || submittingForm}
                              aria-label={`Naikkan pengurus ${idx + 1}`}
                              className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePengurusRow(idx, "down")}
                              disabled={idx === draftPengurus.length - 1 || submittingForm}
                              aria-label={`Turunkan pengurus ${idx + 1}`}
                              className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePengurusRow(p.clientId)}
                              disabled={submittingForm}
                              aria-label={`Hapus baris pengurus ${idx + 1}`}
                              className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BAGIAN 3: DAFTAR TUGAS */}
                <div className="space-y-5 rounded-xl border border-gray-200/80 bg-gray-50/50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                        3
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">Daftar Tugas</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTugasRow}
                      disabled={submittingForm}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] hover:bg-[#ebdcc4] shadow-sm transition-colors disabled:opacity-50 cursor-pointer w-fit"
                    >
                      + Tambah Tugas
                    </button>
                  </div>

                  {draftTugas.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-4">
                      Belum ada tugas yang ditambahkan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {draftTugas.map((t, idx) => (
                        <div
                          key={t.clientId}
                          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-start"
                        >
                          <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0 mt-2">
                            #{idx + 1}
                          </span>

                          <div className="flex-1">
                            <textarea
                              rows={2}
                              value={t.isi_tugas}
                              onChange={(e) => handleUpdateTugasRow(t.clientId, e.target.value)}
                              disabled={submittingForm}
                              placeholder="Deskripsi tugas dan fungsi..."
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none disabled:opacity-50"
                            />
                            {fieldErrors[`tugas_${t.clientId}`] && (
                              <p className="mt-1 text-[11px] text-red-600">
                                {fieldErrors[`tugas_${t.clientId}`]}
                              </p>
                            )}
                          </div>

                          {/* Control Buttons */}
                          <div className="flex items-center gap-1.5 justify-end mt-2 sm:mt-0">
                            <button
                              type="button"
                              onClick={() => handleMoveTugasRow(idx, "up")}
                              disabled={idx === 0 || submittingForm}
                              aria-label={`Naikkan tugas ${idx + 1}`}
                              className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTugasRow(idx, "down")}
                              disabled={idx === draftTugas.length - 1 || submittingForm}
                              aria-label={`Turunkan tugas ${idx + 1}`}
                              className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTugasRow(t.clientId)}
                              disabled={submittingForm}
                              aria-label={`Hapus baris tugas ${idx + 1}`}
                              className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BAGIAN 4: GALERI FOTO DOKUMENTASI (OPSIONAL) */}
                <div className="space-y-5 rounded-xl border border-gray-200/80 bg-gray-50/50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                        4
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Galeri Foto Dokumen <span className="text-xs font-normal text-gray-500">(Opsional)</span></h3>
                        <p className="text-xs text-gray-500">
                          Tambahkan foto kegiatan/gedung (opsional). Foto pertama otomatis menjadi cover.
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] hover:bg-[#ebdcc4] shadow-sm transition-colors cursor-pointer w-fit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>+ Tambah Foto</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleAddLocalGaleriFiles}
                        disabled={submittingForm}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Existing Galeri Items (Edit Mode) */}
                  {formMode === "edit" && existingGaleri.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Foto Tersimpan ({existingGaleri.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {existingGaleri.map((g) => (
                          <div
                            key={g.id}
                            className="group relative rounded-lg border border-gray-200 bg-white p-2 shadow-xs"
                          >
                            <img
                              src={g.foto_url}
                              alt={g.teks_alt || "Foto Galeri"}
                              className="h-28 w-full rounded-md object-cover"
                            />
                            {g.is_cover && (
                              <span className="absolute top-3 left-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-gray-950 shadow-xs">
                                Cover
                              </span>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[11px] text-gray-500 truncate max-w-[110px]">
                                {g.teks_alt || "Tanpa Keterangan"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleMarkExistingGaleriDelete(g.id)}
                                disabled={submittingForm}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Local Galeri Files (Preview before Save) */}
                  {localGaleriFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Foto Baru Dibarukan ({localGaleriFiles.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {localGaleriFiles.map((item, idx) => (
                          <div
                            key={item.clientId}
                            className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs space-y-2"
                          >
                            <div className="relative">
                              <img
                                src={item.previewUrl}
                                alt={`Preview #${idx + 1}`}
                                className="h-28 w-full rounded-md object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLocalGaleriItem(item.clientId)}
                                className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700 cursor-pointer"
                                title="Hapus foto dari pilihan"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.teks_alt}
                              onChange={(e) => handleUpdateLocalGaleriAlt(item.clientId, e.target.value)}
                              placeholder="Keterangan foto / Teks Alt (Opsional)"
                              className="w-full rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingGaleri.length === 0 && localGaleriFiles.length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-4">
                      Belum ada foto galeri yang ditambahkan (opsional). Klik &apos;+ Tambah Foto&apos; jika ingin mengunggah foto.
                    </p>
                  )}
                </div>

                {/* ACTION BUTTONS (Single Batal Button + Save) */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    disabled={submittingForm}
                    className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingForm || loadingEditData}
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                  >
                    {submittingForm ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : formMode === "edit" ? (
                      <span>Simpan Perubahan</span>
                    ) : (
                      <span>Simpan Data</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* RIWAYAT / DAFTAR LEMBAGA DAN ORGANISASI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Daftar Lembaga dan Organisasi</h2>
          </div>

          {loadingList ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b4b1d] border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-gray-600">Memuat data lembaga dan organisasi...</p>
            </div>
          ) : listData.length === 0 ? (
            /* Empty State */
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-[#6b4b1d]">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Belum ada lembaga atau organisasi.</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tambahkan data pertama melalui tombol di atas.
              </p>
              {!isFormOpen && (
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Lembaga / Organisasi Baru
                </button>
              )}
            </div>
          ) : (
            /* Table Desktop & Responsive Cards Mobile */
            <div>
              {/* Desktop Table View */}
              <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-bold">Cover</th>
                      <th scope="col" className="px-6 py-4 font-bold">Nama Lembaga / Organisasi</th>
                      <th scope="col" className="px-6 py-4 font-bold">Alamat</th>
                      <th scope="col" className="px-6 py-4 font-bold">Kontak</th>
                      <th scope="col" className="px-6 py-4 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listData.map((item) => {
                      const isDeleting = deletingId === item.id

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Cover Photo */}
                          <td className="px-6 py-4">
                            {item.foto_cover_url ? (
                              <img
                                src={item.foto_cover_url}
                                alt={item.foto_cover_alt || item.nama}
                                className="h-12 w-16 rounded-lg object-cover shadow-sm"
                              />
                            ) : (
                              <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400">
                                No Cover
                              </div>
                            )}
                          </td>

                          {/* Nama */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 break-words max-w-xs">{item.nama}</div>
                            <span className="text-[11px] font-medium text-gray-400 capitalize">{item.jenis}</span>
                          </td>

                          {/* Alamat */}
                          <td className="px-6 py-4 max-w-xs break-words text-gray-600">
                            {item.alamat}
                          </td>

                          {/* Kontak */}
                          <td className="px-6 py-4 text-gray-600">
                            {item.kontak || <span className="italic text-gray-400">Belum tersedia</span>}
                          </td>

                          {/* Aksi */}
                          <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 flex-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(item)}
                                className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4] cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                Kelola Rincian
                              </button>

                              {/* Safe Delete Completer */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                disabled={isDeleting}
                                className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
                              >
                                {isDeleting ? "Menghapus..." : "Hapus"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {listData.map((item) => {
                  const isDeleting = deletingId === item.id

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        {item.foto_cover_url ? (
                          <img
                            src={item.foto_cover_url}
                            alt={item.foto_cover_alt || item.nama}
                            className="h-16 w-20 flex-shrink-0 rounded-xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-400">
                            No Cover
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-gray-900 break-words">{item.nama}</h3>
                          <span className="text-xs font-medium text-gray-500 capitalize">{item.jenis}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                        <p className="break-words">
                          <span className="font-semibold text-gray-700">Alamat:</span> {item.alamat}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">Kontak:</span>{" "}
                          {item.kontak || <span className="italic text-gray-400">Belum tersedia</span>}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(item)}
                          className="rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4] cursor-pointer"
                        >
                          Kelola Rincian
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: item.id, nama: item.nama })}
                          disabled={isDeleting}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                        >
                          {isDeleting ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modals */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="⚠ Hapus Lembaga / Organisasi?"
        message={
          <>
            Apakah Anda yakin ingin menghapus <strong>&quot;{deleteTarget?.nama}&quot;</strong>?
            <br />
            Seluruh data terkait (foto, pengurus, tugas, dan galeri) akan dihapus secara permanen.
          </>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={Boolean(deletingId)}
        loadingText="Menghapus..."
        onConfirm={async () => {
          if (deleteTarget) {
            await executeSafeDelete(deleteTarget.id, deleteTarget.nama)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={isCloseConfirmOpen}
        title="Batal Memproses Form?"
        message="Apakah Anda yakin ingin membatalkan? Perubahan yang belum disimpan pada form ini akan hilang."
        confirmText="Ya, Batalkan"
        cancelText="Kembali Edit"
        variant="warning"
        onConfirm={() => {
          setIsCloseConfirmOpen(false)
          resetFormState()
        }}
        onCancel={() => setIsCloseConfirmOpen(false)}
      />
    </div>
  )
}
