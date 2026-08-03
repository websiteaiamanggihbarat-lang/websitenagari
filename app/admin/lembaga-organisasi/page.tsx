"use client"

import { useEffect, useState, FormEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  DaftarLembagaOrganisasiAdmin,
  JenisLembagaOrganisasi,
  fetchDaftarLembagaOrganisasiAdmin,
  formatJenisLembagaOrganisasi,
  isJenisLembagaOrganisasi,
  isValidLembagaOrganisasiId,
} from "@/lib/lembagaOrganisasi"

interface FormValues {
  jenis: JenisLembagaOrganisasi
  nama: string
  deskripsi: string
  alamat: string
  kontak: string
  jam_kerja: string
}

const INITIAL_FORM_VALUES: FormValues = {
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
}

function parseErrorMessage(err: SupabaseErrorLike | null | undefined, defaultMsg: string): string {
  if (!err) return defaultMsg
  const code = err.code || ""
  if (code === "23505") {
    return "Nama tersebut sudah digunakan pada jenis yang sama."
  }
  if (code === "23514") {
    return "Data tidak memenuhi aturan validasi database."
  }
  if (code === "23503") {
    return "Data masih mempunyai rincian terkait."
  }
  if (code === "P0001") {
    return "Operasi ditolak oleh aturan bisnis."
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
  const [loadingForm, setLoadingForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES)
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

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormValues(INITIAL_FORM_VALUES)
    setFieldErrors({})
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: DaftarLembagaOrganisasiAdmin) => {
    setEditingId(item.id)
    setFormValues({
      jenis: item.jenis,
      nama: item.nama,
      deskripsi: item.deskripsi,
      alamat: item.alamat,
      kontak: item.kontak || "",
      jam_kerja: item.jam_kerja || "",
    })
    setFieldErrors({})
    setPesanSukses(null)
    setPesanError(null)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormValues(INITIAL_FORM_VALUES)
    setFieldErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!isJenisLembagaOrganisasi(formValues.jenis)) {
      errors.jenis = "Pilih jenis yang valid (Lembaga atau Organisasi)."
    }

    const namaTrim = formValues.nama.trim()
    if (namaTrim.length < 2 || namaTrim.length > 200) {
      errors.nama = "Nama harus diisi 2 sampai 200 karakter."
    }

    const deskripsiTrim = formValues.deskripsi.trim()
    if (deskripsiTrim.length < 10 || deskripsiTrim.length > 5000) {
      errors.deskripsi = "Deskripsi harus diisi 10 sampai 5000 karakter."
    }

    const alamatTrim = formValues.alamat.trim()
    if (alamatTrim.length < 3 || alamatTrim.length > 500) {
      errors.alamat = "Alamat harus diisi 3 sampai 500 karakter."
    }

    const kontakTrim = formValues.kontak.trim()
    if (kontakTrim.length > 0 && (kontakTrim.length < 1 || kontakTrim.length > 100)) {
      errors.kontak = "Kontak maksimal 100 karakter."
    }

    const jamKerjaTrim = formValues.jam_kerja.trim()
    if (jamKerjaTrim.length > 0 && (jamKerjaTrim.length < 1 || jamKerjaTrim.length > 300)) {
      errors.jam_kerja = "Jam kerja maksimal 300 karakter."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setPesanSukses(null)
    setPesanError(null)

    if (!validateForm()) {
      return
    }

    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    setLoadingForm(true)

    const payload = {
      jenis: formValues.jenis,
      nama: formValues.nama.trim(),
      deskripsi: formValues.deskripsi.trim(),
      alamat: formValues.alamat.trim(),
      kontak: formValues.kontak.trim() || null,
      jam_kerja: formValues.jam_kerja.trim() || null,
    }

    try {
      if (editingId) {
        // Edit mode (does NOT alter is_active)
        const { data: updatedData, error: updateErr } = await supabase
          .from("lembaga_organisasi")
          .update(payload)
          .eq("id", editingId)
          .select("id")
          .maybeSingle()

        if (updateErr) {
          setPesanError(parseErrorMessage(updateErr, "Gagal memperbarui data utama."))
          setLoadingForm(false)
          return
        }

        if (!updatedData) {
          setPesanError("Data tidak ditemukan atau tidak dapat diubah.")
          setLoadingForm(false)
          return
        }

        handleCloseForm()
        try {
          await loadData()
          setPesanSukses("Data utama berhasil diperbarui.")
        } catch {
          setPesanSukses("Data utama berhasil diperbarui (Gagal memuat ulang daftar).")
        }
      } else {
        // Create mode (always is_active = false)
        const { data: insertedData, error: insertErr } = await supabase
          .from("lembaga_organisasi")
          .insert({
            ...payload,
            is_active: false,
          })
          .select("id")
          .single()

        if (insertErr || !insertedData || !insertedData.id) {
          setPesanError(parseErrorMessage(insertErr, "Gagal menambahkan data baru."))
          setLoadingForm(false)
          return
        }

        handleCloseForm()
        try {
          await loadData()
          setPesanSukses("Data lembaga/organisasi berhasil ditambahkan sebagai draft.")
        } catch {
          setPesanSukses("Data lembaga/organisasi berhasil ditambahkan sebagai draft (Gagal memuat ulang daftar).")
        }
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Terjadi kesalahan saat menyimpan data."))
    } finally {
      setLoadingForm(false)
    }
  }

  const handleDelete = async (id: string, nama: string) => {
    if (deletingId) return
    if (!isValidLembagaOrganisasiId(id)) return

    setPesanSukses(null)
    setPesanError(null)

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus '${nama}'?`
    )
    if (!confirmDelete) return

    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    setDeletingId(id)

    try {
      // Parallel child check
      const [resPengurus, resTugas, resGaleri] = await Promise.all([
        supabase
          .from("pengurus_lembaga_organisasi")
          .select("id")
          .eq("lembaga_organisasi_id", id)
          .limit(1),
        supabase
          .from("tugas_lembaga_organisasi")
          .select("id")
          .eq("lembaga_organisasi_id", id)
          .limit(1),
        supabase
          .from("galeri_lembaga_organisasi")
          .select("id")
          .eq("lembaga_organisasi_id", id)
          .limit(1),
      ])

      // Fail-closed on query error
      if (resPengurus.error || resTugas.error || resGaleri.error) {
        setPesanError("Gagal memeriksa rincian data. Penghapusan dibatalkan.")
        setDeletingId(null)
        return
      }

      const hasPengurus = Boolean(resPengurus.data && resPengurus.data.length > 0)
      const hasTugas = Boolean(resTugas.data && resTugas.data.length > 0)
      const hasGaleri = Boolean(resGaleri.data && resGaleri.data.length > 0)

      if (hasPengurus || hasTugas || hasGaleri) {
        setPesanError(
          "Data mempunyai rincian. Buka Kelola Rincian untuk menghapus pengurus, tugas, dan galeri terlebih dahulu."
        )
        setDeletingId(null)
        return
      }

      // Perform parent delete
      const { data: delData, error: errDelete } = await supabase
        .from("lembaga_organisasi")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle()

      if (errDelete) {
        setPesanError(parseErrorMessage(errDelete, "Gagal menghapus data."))
        setDeletingId(null)
        return
      }

      if (!delData) {
        setPesanError("Data tidak ditemukan atau tidak terhapus.")
        setDeletingId(null)
        return
      }

      setPesanSukses(`Data '${nama}' berhasil dihapus.`)
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
                Kelola data utama lembaga dan organisasi Nagari Aia Manggih Barat.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95 sm:w-auto"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambahkan Lembaga/Organisasi
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

        {/* Modal / Panel Form Create & Edit */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Data Utama" : "Tambah Lembaga / Organisasi Baru"}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={loadingForm}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-5">
                {/* Jenis */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Jenis <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formValues.jenis}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        jenis: e.target.value as JenisLembagaOrganisasi,
                      })
                    }
                    disabled={loadingForm}
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                  >
                    <option value="lembaga">Lembaga</option>
                    <option value="organisasi">Organisasi</option>
                  </select>
                  {fieldErrors.jenis && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.jenis}</p>
                  )}
                </div>

                {/* Nama */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nama Lembaga / Organisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formValues.nama}
                    onChange={(e) => setFormValues({ ...formValues, nama: e.target.value })}
                    disabled={loadingForm}
                    placeholder="Contoh: LPMN Nagari Aia Manggih Barat"
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
                    value={formValues.deskripsi}
                    onChange={(e) => setFormValues({ ...formValues, deskripsi: e.target.value })}
                    disabled={loadingForm}
                    placeholder="Tuliskan deskripsi lengkap lembaga/organisasi..."
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
                    value={formValues.alamat}
                    onChange={(e) => setFormValues({ ...formValues, alamat: e.target.value })}
                    disabled={loadingForm}
                    placeholder="Jalan, Jorong, atau lokasi kantor resmi..."
                    className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                  />
                  {fieldErrors.alamat && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.alamat}</p>
                  )}
                </div>

                {/* Grid Kontak & Jam Kerja */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Kontak */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nomor Kontak / Telepon <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={formValues.kontak}
                      onChange={(e) => setFormValues({ ...formValues, kontak: e.target.value })}
                      disabled={loadingForm}
                      placeholder="Contoh: 0812-3456-7890"
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.kontak && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.kontak}</p>
                    )}
                  </div>

                  {/* Jam Kerja */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Jam Kerja / Operasional <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={formValues.jam_kerja}
                      onChange={(e) => setFormValues({ ...formValues, jam_kerja: e.target.value })}
                      disabled={loadingForm}
                      placeholder="Contoh: Senin - Jumat (08.00 - 16.00 WIB)"
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] disabled:opacity-50"
                    />
                    {fieldErrors.jam_kerja && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.jam_kerja}</p>
                    )}
                  </div>
                </div>

                {/* Tombol Form Aksi */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={loadingForm}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loadingForm}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {loadingForm ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State Daftar */}
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
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambahkan Lembaga/Organisasi
            </button>
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
                    <th scope="col" className="px-6 py-4 font-bold">Jenis</th>
                    <th scope="col" className="px-6 py-4 font-bold">Alamat</th>
                    <th scope="col" className="px-6 py-4 font-bold">Kontak</th>
                    <th scope="col" className="px-6 py-4 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listData.map((item) => (
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

                      {/* Jenis */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">
                          {formatJenisLembagaOrganisasi(item.jenis)}
                        </span>
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
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            disabled={deletingId === item.id}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.nama)}
                            disabled={deletingId === item.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === item.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {listData.map((item) => (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#6b4b1d]">
                          {formatJenisLembagaOrganisasi(item.jenis)}
                        </span>
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
                      <h3 className="mt-1 text-base font-bold text-gray-900 break-words">{item.nama}</h3>
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

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                    <Link
                      href={`/admin/lembaga-organisasi/${item.id}`}
                      className="rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] shadow-sm hover:bg-[#ebdcc4]"
                    >
                      Kelola Rincian
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      disabled={deletingId === item.id}
                      className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.nama)}
                      disabled={deletingId === item.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
