"use client"

import { useEffect, useState, FormEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  DaftarLembagaOrganisasiAdmin,
  fetchDaftarLembagaOrganisasiAdmin,
  fetchDetailLembagaOrganisasiAdmin,
  isValidLembagaOrganisasiId,
} from "@/lib/lembagaOrganisasi"

const LEMBAGA_ORGANISASI_BUCKET = "foto-lembaga-organisasi"

interface FormDataUtama {
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

const INITIAL_DATA_UTAMA: FormDataUtama = {
  nama: "",
  deskripsi: "",
  alamat: "",
  kontak: "",
  jam_kerja: "",
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
    return "Relasi data tidak valid."
  }
  if (code === "P0001") {
    return "Operasi ditolak oleh aturan bisnis database."
  }
  if (code === "42501") {
    return "Sesi tidak valid atau akses ditolak."
  }
  return defaultMsg
}

export default function AdminLembagaOrganisasiPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [listData, setListData] = useState<DaftarLembagaOrganisasiAdmin[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [submittingForm, setSubmittingForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [dataUtama, setDataUtama] = useState<FormDataUtama>(INITIAL_DATA_UTAMA)
  const [draftPengurus, setDraftPengurus] = useState<DraftPengurusItem[]>([])
  const [draftTugas, setDraftTugas] = useState<DraftTugasItem[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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

  const handleToggleForm = () => {
    if (isFormOpen) {
      // Check if dirty
      const hasContent =
        dataUtama.nama.trim() ||
        dataUtama.deskripsi.trim() ||
        dataUtama.alamat.trim() ||
        dataUtama.kontak.trim() ||
        dataUtama.jam_kerja.trim() ||
        draftPengurus.length > 0 ||
        draftTugas.length > 0

      if (hasContent) {
        const confirmClose = window.confirm(
          "Apakah Anda yakin ingin menutup form? Isian yang belum disimpan akan hilang."
        )
        if (!confirmClose) return
      }

      setIsFormOpen(false)
      setDataUtama(INITIAL_DATA_UTAMA)
      setDraftPengurus([])
      setDraftTugas([])
      setFieldErrors({})
    } else {
      setDataUtama(INITIAL_DATA_UTAMA)
      setDraftPengurus([])
      setDraftTugas([])
      setFieldErrors({})
      setPesanSukses(null)
      setPesanError(null)
      setIsFormOpen(true)
    }
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

  // Validation
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
    if (kontakTrim.length > 0 && (kontakTrim.length < 1 || kontakTrim.length > 100)) {
      errors.kontak = "Kontak maksimal 100 karakter."
    }

    const jamKerjaTrim = dataUtama.jam_kerja.trim()
    if (jamKerjaTrim.length > 0 && (jamKerjaTrim.length < 1 || jamKerjaTrim.length > 300)) {
      errors.jam_kerja = "Jam kerja maksimal 300 karakter."
    }

    // Validate pengurus rows
    draftPengurus.forEach((p, idx) => {
      const jabatanTrim = p.nama_jabatan.trim()
      if (jabatanTrim.length < 2 || jabatanTrim.length > 150) {
        errors[`pengurus_jabatan_${p.clientId}`] = `Baris #${idx + 1}: Nama jabatan harus 2-150 karakter.`
      }
      const pengurusTrim = p.nama_pengurus.trim()
      if (pengurusTrim.length > 0 && pengurusTrim.length > 200) {
        errors[`pengurus_nama_${p.clientId}`] = `Baris #${idx + 1}: Nama pengurus maksimal 200 karakter.`
      }
    })

    // Validate tugas rows
    draftTugas.forEach((t, idx) => {
      const tugasTrim = t.isi_tugas.trim()
      if (tugasTrim.length < 3 || tugasTrim.length > 1000) {
        errors[`tugas_${t.clientId}`] = `Tugas #${idx + 1}: Isi tugas harus 3-1000 karakter.`
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Create Submit Logic with Rollback Protection
  const handleSubmitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (submittingForm) return

    setPesanSukses(null)
    setPesanError(null)

    if (!validateForm()) {
      return
    }

    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    setSubmittingForm(true)

    const parentId = crypto.randomUUID()
    const payloadParent = {
      id: parentId,
      jenis: "lembaga",
      nama: dataUtama.nama.trim(),
      deskripsi: dataUtama.deskripsi.trim(),
      alamat: dataUtama.alamat.trim(),
      kontak: dataUtama.kontak.trim() || null,
      jam_kerja: dataUtama.jam_kerja.trim() || null,
      is_active: false,
    }

    try {
      // Step 1: Insert Parent
      const { error: insertParentErr } = await supabase
        .from("lembaga_organisasi")
        .insert(payloadParent)

      if (insertParentErr) {
        setPesanError(parseErrorMessage(insertParentErr, "Gagal menyimpan data utama."))
        setSubmittingForm(false)
        return
      }

      // Step 2: Insert Pengurus Batch (if any)
      if (draftPengurus.length > 0) {
        const pengurusPayload = draftPengurus.map((p, idx) => ({
          id: crypto.randomUUID(),
          lembaga_organisasi_id: parentId,
          nama_jabatan: p.nama_jabatan.trim(),
          nama_pengurus: p.nama_pengurus.trim() || null,
          foto_url: null,
          foto_storage_path: null,
          urutan: idx + 1,
        }))

        const { error: insertPengurusErr } = await supabase
          .from("pengurus_lembaga_organisasi")
          .insert(pengurusPayload)

        if (insertPengurusErr) {
          // Rollback parent
          await supabase.from("lembaga_organisasi").delete().eq("id", parentId)
          setPesanError(parseErrorMessage(insertPengurusErr, "Gagal menyimpan pengurus. Data dibatalkan."))
          setSubmittingForm(false)
          return
        }
      }

      // Step 3: Insert Tugas Batch (if any)
      if (draftTugas.length > 0) {
        const tugasPayload = draftTugas.map((t, idx) => ({
          id: crypto.randomUUID(),
          lembaga_organisasi_id: parentId,
          isi_tugas: t.isi_tugas.trim(),
          urutan: idx + 1,
        }))

        const { error: insertTugasErr } = await supabase
          .from("tugas_lembaga_organisasi")
          .insert(tugasPayload)

        if (insertTugasErr) {
          // Rollback pengurus and parent
          await supabase.from("pengurus_lembaga_organisasi").delete().eq("lembaga_organisasi_id", parentId)
          await supabase.from("lembaga_organisasi").delete().eq("id", parentId)
          setPesanError(parseErrorMessage(insertTugasErr, "Gagal menyimpan daftar tugas. Data dibatalkan."))
          setSubmittingForm(false)
          return
        }
      }

      // All Succeeded
      setIsFormOpen(false)
      setDataUtama(INITIAL_DATA_UTAMA)
      setDraftPengurus([])
      setDraftTugas([])
      setFieldErrors({})

      setPesanSukses("Data lembaga/organisasi dan rincian awal berhasil disimpan sebagai draft.")
      await loadData()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat menyimpan data."))
    } finally {
      setSubmittingForm(false)
    }
  }

  // Toggle Activation Logic
  const handleToggleStatus = async (item: DaftarLembagaOrganisasiAdmin) => {
    if (togglingStatusId || deletingId) return
    if (!isValidLembagaOrganisasiId(item.id)) return

    setPesanSukses(null)
    setPesanError(null)

    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    setTogglingStatusId(item.id)

    try {
      if (!item.is_active) {
        // Wants to ACTIVATE: Check cover photo availability
        const { data: coverData, error: coverErr } = await supabase
          .from("galeri_lembaga_organisasi")
          .select("id")
          .eq("lembaga_organisasi_id", item.id)
          .eq("is_cover", true)
          .eq("is_active", true)
          .limit(1)

        if (coverErr) {
          setPesanError("Gagal memeriksa status cover foto. Aktivasi dibatalkan.")
          setTogglingStatusId(null)
          return
        }

        if (!coverData || coverData.length === 0) {
          setPesanError("Tentukan foto cover terlebih dahulu melalui Kelola Rincian.")
          setTogglingStatusId(null)
          return
        }

        // Perform activation
        const { error: actErr } = await supabase
          .from("lembaga_organisasi")
          .update({ is_active: true })
          .eq("id", item.id)

        if (actErr) {
          setPesanError(parseErrorMessage(actErr, "Gagal mengaktifkan data."))
          setTogglingStatusId(null)
          return
        }

        setPesanSukses("Data berhasil diaktifkan dan ditampilkan pada halaman publik.")
        await loadData()
      } else {
        // Wants to DEACTIVATE
        const confirmDeactivate = window.confirm(
          `Apakah Anda yakin ingin menonaktifkan '${item.nama}' dari halaman publik?`
        )
        if (!confirmDeactivate) {
          setTogglingStatusId(null)
          return
        }

        const { error: deactErr } = await supabase
          .from("lembaga_organisasi")
          .update({ is_active: false })
          .eq("id", item.id)

        if (deactErr) {
          setPesanError(parseErrorMessage(deactErr, "Gagal menonaktifkan data."))
          setTogglingStatusId(null)
          return
        }

        setPesanSukses("Data berhasil dinonaktifkan dari halaman publik.")
        await loadData()
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat mengubah status publikasi."))
    } finally {
      setTogglingStatusId(null)
    }
  }

  // Safe Delete Complete Logic
  const handleSafeDelete = async (id: string, nama: string) => {
    if (deletingId || togglingStatusId) return
    if (!isValidLembagaOrganisasiId(id)) return

    setPesanSukses(null)
    setPesanError(null)

    const confirmDelete = window.confirm(
      `PERINGATAN HAPUS PERMANEN!\n\nApakah Anda yakin ingin menghapus '${nama}'?\n\nSeluruh data pengurus, tugas, galeri, dan file foto di Storage akan dihapus secara permanen.`
    )
    if (!confirmDelete) return

    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    setDeletingId(id)

    try {
      // Step 1: Deactivate parent first for safety
      await supabase
        .from("lembaga_organisasi")
        .update({ is_active: false })
        .eq("id", id)

      // Step 2: Fetch detail admin to get all storage paths
      const detailAdmin = await fetchDetailLembagaOrganisasiAdmin(id)

      if (detailAdmin) {
        const storagePaths: string[] = []

        detailAdmin.pengurus.forEach((p) => {
          if (p.foto_storage_path) storagePaths.push(p.foto_storage_path)
        })

        detailAdmin.galeri.forEach((g) => {
          if (g.foto_storage_path) storagePaths.push(g.foto_storage_path)
        })

        const uniquePaths = Array.from(new Set(storagePaths))

        // Step 3: Remove storage objects if any
        if (uniquePaths.length > 0) {
          const { error: storageRemoveErr } = await supabase.storage
            .from(LEMBAGA_ORGANISASI_BUCKET)
            .remove(uniquePaths)

          if (storageRemoveErr) {
            setPesanError("Gagal menghapus file foto di Storage. Penghapusan data dibatalkan demi keamanan.")
            setDeletingId(null)
            return
          }
        }
      }

      // Step 4: Delete Galeri Child rows
      const { error: errGaleri } = await supabase
        .from("galeri_lembaga_organisasi")
        .delete()
        .eq("lembaga_organisasi_id", id)

      if (errGaleri) {
        setPesanError(parseErrorMessage(errGaleri, "Gagal menghapus data galeri."))
        setDeletingId(null)
        return
      }

      // Step 5: Delete Tugas Child rows
      const { error: errTugas } = await supabase
        .from("tugas_lembaga_organisasi")
        .delete()
        .eq("lembaga_organisasi_id", id)

      if (errTugas) {
        setPesanError(parseErrorMessage(errTugas, "Gagal menghapus data tugas."))
        setDeletingId(null)
        return
      }

      // Step 6: Delete Pengurus Child rows
      const { error: errPengurus } = await supabase
        .from("pengurus_lembaga_organisasi")
        .delete()
        .eq("lembaga_organisasi_id", id)

      if (errPengurus) {
        setPesanError(parseErrorMessage(errPengurus, "Gagal menghapus data pengurus."))
        setDeletingId(null)
        return
      }

      // Step 7: Delete Parent Row
      const { data: delData, error: errDelete } = await supabase
        .from("lembaga_organisasi")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle()

      if (errDelete || !delData) {
        setPesanError(parseErrorMessage(errDelete, "Gagal menghapus data utama."))
        setDeletingId(null)
        return
      }

      setPesanSukses(`Data '${nama}' beserta seluruh rincian dan file Storage berhasil dihapus.`)
      await loadData()
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat menghapus data."))
    } finally {
      setDeletingId(null)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b4b1d] border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-gray-600">Memeriksa sesi autentikasi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                  title="Kembali ke Dashboard Admin"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Kelola Lembaga dan Organisasi
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-600 sm:ml-12">
                Kelola data lembaga dan organisasi Nagari Aia Manggih Barat.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleForm}
              disabled={submittingForm}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 sm:w-auto ${
                isFormOpen
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] hover:opacity-90"
              }`}
            >
              {isFormOpen ? (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Tutup Form</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambahkan Lembaga/Organisasi</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#2c1b01] to-[#b6a587]" />
        </div>

        {/* Notifikasi Global */}
        {pesanSukses && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 shadow-sm">
            {pesanSukses}
          </div>
        )}
        {pesanError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
            {pesanError}
          </div>
        )}

        {/* Form Tambah Lengkap Inline (Di Atas Riwayat) */}
        {isFormOpen && (
          <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8 space-y-8">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tambah Lembaga / Organisasi Baru</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Lengkapi data utama, struktur pengurus, dan daftar tugas. Data baru otomatis menjadi Draft.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleForm}
                disabled={submittingForm}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-8">
              {/* BAGIAN 1: DATA UTAMA */}
              <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 border-b border-gray-200/60 pb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="text-base font-bold text-gray-900">Data Utama</h3>
                </div>

                {/* Nama */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nama Lembaga / Organisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dataUtama.nama}
                    onChange={(e) => setDataUtama({ ...dataUtama, nama: e.target.value })}
                    disabled={submittingForm}
                    placeholder="Contoh: Posyandu Lansia Manggih"
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                  />
                  {fieldErrors.nama && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.nama}</p>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Deskripsi / Profil <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={dataUtama.deskripsi}
                    onChange={(e) => setDataUtama({ ...dataUtama, deskripsi: e.target.value })}
                    disabled={submittingForm}
                    placeholder="Tuliskan profil dan visi misi..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                  />
                  {fieldErrors.deskripsi && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.deskripsi}</p>
                  )}
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Alamat Kantor / Sekelompok <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={dataUtama.alamat}
                    onChange={(e) => setDataUtama({ ...dataUtama, alamat: e.target.value })}
                    disabled={submittingForm}
                    placeholder="Jalan, Jorong, atau lokasi gedung kantor..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                  />
                  {fieldErrors.alamat && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.alamat}</p>
                  )}
                </div>

                {/* Kontak & Jam Kerja Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nomor Kontak <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={dataUtama.kontak}
                      onChange={(e) => setDataUtama({ ...dataUtama, kontak: e.target.value })}
                      disabled={submittingForm}
                      placeholder="Contoh: 0812-3456-7890"
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.kontak && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.kontak}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Jam Operasional <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={dataUtama.jam_kerja}
                      onChange={(e) => setDataUtama({ ...dataUtama, jam_kerja: e.target.value })}
                      disabled={submittingForm}
                      placeholder="Contoh: Senin - Jumat (08.00 - 16.00 WIB)"
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.jam_kerja && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.jam_kerja}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: STRUKTUR PENGURUS */}
              <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                      2
                    </span>
                    <h3 className="text-base font-bold text-gray-900">Struktur Pengurus</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPengurusRow}
                    disabled={submittingForm}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#6b4b1d] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-amber-50 disabled:opacity-50 w-fit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Pengurus
                  </button>
                </div>

                {draftPengurus.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4">
                    Belum ada pengurus yang ditambahkan. Foto pengurus dapat diunggah melalui Kelola Rincian setelah disimpan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {draftPengurus.map((p, idx) => (
                      <div
                        key={p.clientId}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
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
                              disabled={submittingForm}
                              placeholder="Nama Jabatan (misal: Ketua)"
                              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none disabled:opacity-50"
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
                              disabled={submittingForm}
                              placeholder="Nama Pejabat (misal: Ahmad, S.Pd)"
                              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none disabled:opacity-50"
                            />
                            {fieldErrors[`pengurus_nama_${p.clientId}`] && (
                              <p className="mt-1 text-[11px] text-red-600">
                                {fieldErrors[`pengurus_nama_${p.clientId}`]}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleMovePengurusRow(idx, "up")}
                            disabled={idx === 0 || submittingForm}
                            aria-label={`Naikkan pengurus ${idx + 1}`}
                            className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
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
                            className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
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
                            className="rounded-md border border-red-200 p-1 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BAGIAN 3: DAFTAR TUGAS */}
              <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                      3
                    </span>
                    <h3 className="text-base font-bold text-gray-900">Daftar Tugas</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTugasRow}
                    disabled={submittingForm}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#6b4b1d] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-amber-50 disabled:opacity-50 w-fit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Tugas
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
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start"
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
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#6b4b1d] focus:outline-none disabled:opacity-50"
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
                            className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
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
                            className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
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
                            className="rounded-md border border-red-200 p-1 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleToggleForm}
                  disabled={submittingForm}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {submittingForm ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RIWAYAT DATA LEMBAGA DAN ORGANISASI */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Riwayat Lembaga dan Organisasi</h2>

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
                  onClick={handleToggleForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambahkan Lembaga/Organisasi
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
                      <th scope="col" className="px-6 py-4 font-bold">Nama & Status</th>
                      <th scope="col" className="px-6 py-4 font-bold">Alamat</th>
                      <th scope="col" className="px-6 py-4 font-bold">Kontak</th>
                      <th scope="col" className="px-6 py-4 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listData.map((item) => {
                      const isDeleting = deletingId === item.id
                      const isToggling = togglingStatusId === item.id
                      const isDisabled = isDeleting || isToggling

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

                          {/* Nama & Badge Status */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 break-words max-w-xs">{item.nama}</div>
                            <div className="mt-1">
                              {item.is_active ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                                  Draft
                                </span>
                              )}
                            </div>
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
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/lembaga-organisasi/${item.id}`}
                                className="rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4]"
                              >
                                Kelola Rincian
                              </Link>

                              {/* Toggle Status Aktif/Nonaktif */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(item)}
                                disabled={isDisabled}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 ${
                                  item.is_active
                                    ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                }`}
                              >
                                {isToggling
                                  ? item.is_active
                                    ? "Menonaktifkan..."
                                    : "Mengaktifkan..."
                                  : item.is_active
                                  ? "Nonaktifkan"
                                  : "Aktifkan"}
                              </button>

                              {/* Safe Delete Completer */}
                              <button
                                type="button"
                                onClick={() => handleSafeDelete(item.id, item.nama)}
                                disabled={isDisabled}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50"
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
                  const isToggling = togglingStatusId === item.id
                  const isDisabled = isDeleting || isToggling

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
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {item.is_active ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                                Draft
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 break-words">{item.nama}</h3>
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
                        <Link
                          href={`/admin/lembaga-organisasi/${item.id}`}
                          className="rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4]"
                        >
                          Kelola Rincian
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={isDisabled}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 ${
                            item.is_active
                              ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {isToggling
                            ? item.is_active
                              ? "Menonaktifkan..."
                              : "Mengaktifkan..."
                            : item.is_active
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSafeDelete(item.id, item.nama)}
                          disabled={isDisabled}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50"
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
    </div>
  )
}
