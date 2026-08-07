"use client"

import { useEffect, useState, FormEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  fetchPengaturanLayananInformasi,
  fetchLayananSuratAdmin,
  getSafeHttpsUrl,
  PENGATURAN_LAYANAN_INFORMASI_TABLE,
  LAYANAN_SURAT_TABLE,
  PERSYARATAN_LAYANAN_SURAT_TABLE,
  PengaturanLayananInformasi,
  LayananSuratDenganPersyaratan,
  PersyaratanLayananSurat,
} from "@/lib/layananInformasi"

interface FormState {
  jadwal_pelayanan: string
  whatsapp_pelayanan: string
  email_pelayanan: string
  telepon_pelayanan: string
  telepon_pelayanan_alternatif: string
  alamat_pelayanan: string
  google_maps_url: string
  whatsapp_pengaduan: string
  form_pengaduan_url: string
}

const INITIAL_FORM_STATE: FormState = {
  jadwal_pelayanan: "",
  whatsapp_pelayanan: "",
  email_pelayanan: "",
  telepon_pelayanan: "",
  telepon_pelayanan_alternatif: "",
  alamat_pelayanan: "",
  google_maps_url: "",
  whatsapp_pengaduan: "",
  form_pengaduan_url: "",
}

interface PersyaratanFormRow {
  localId: string
  id: string | null
  isi_persyaratan: string
  urutan: number
}

interface FormLayananState {
  nama_layanan: string
  deskripsi: string
  estimasi_pembuatan: string
  form_pendataan_url: string
  urutan_layanan: number
}

const INITIAL_LAYANAN_FORM: FormLayananState = {
  nama_layanan: "",
  deskripsi: "",
  estimasi_pembuatan: "",
  form_pendataan_url: "",
  urutan_layanan: 1,
}

const REGEX_PHONE_CHAR = /^[0-9\+\-\s\(\)\.]*$/
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

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
  if (code === "42501") {
    return "Anda tidak memiliki izin untuk melakukan operasi ini."
  }
  if (code === "P0001") {
    return "Layanan surat aktif wajib memiliki minimal satu persyaratan."
  }
  if (code === "PGRST116") {
    return "Data tidak ditemukan."
  }
  return defaultMsg
}

export default function AdminLayananInformasiPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Pengaturan Singleton State
  const [loadingPengaturan, setLoadingPengaturan] = useState(true)
  const [submittingPengaturan, setSubmittingPengaturan] = useState(false)
  const [pengaturan, setPengaturan] = useState<PengaturanLayananInformasi | null>(null)
  const [snapshotPengaturan, setSnapshotPengaturan] = useState<PengaturanLayananInformasi | null>(null)
  const [formPengaturan, setFormPengaturan] = useState<FormState>(INITIAL_FORM_STATE)
  const [fieldErrorsPengaturan, setFieldErrorsPengaturan] = useState<Record<string, string>>({})

  // Layanan Surat List State
  const [loadingLayanan, setLoadingLayanan] = useState(true)
  const [layananList, setLayananList] = useState<LayananSuratDenganPersyaratan[]>([])

  // Layanan Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formLayanan, setFormLayanan] = useState<FormLayananState>(INITIAL_LAYANAN_FORM)
  const [persyaratanRows, setPersyaratanRows] = useState<PersyaratanFormRow[]>([
    { localId: "init-1", id: null, isi_persyaratan: "", urutan: 1 },
  ])
  const [fieldErrorsLayanan, setFieldErrorsLayanan] = useState<Record<string, string>>({})
  const [submittingLayanan, setSubmittingLayanan] = useState(false)

  // Actions State
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)
  const [deletingLayananId, setDeletingLayananId] = useState<string | null>(null)

  // Global Toast Messages
  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

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

  const loadDataPengaturan = async () => {
    setLoadingPengaturan(true)
    try {
      const data = await fetchPengaturanLayananInformasi()
      if (!data) {
        setPengaturan(null)
        setSnapshotPengaturan(null)
        return
      }

      setPengaturan(data)
      setSnapshotPengaturan(data)
      setFormPengaturan({
        jadwal_pelayanan: data.jadwal_pelayanan || "",
        whatsapp_pelayanan: data.whatsapp_pelayanan || "",
        email_pelayanan: data.email_pelayanan || "",
        telepon_pelayanan: data.telepon_pelayanan || "",
        telepon_pelayanan_alternatif: data.telepon_pelayanan_alternatif || "",
        alamat_pelayanan: data.alamat_pelayanan || "",
        google_maps_url: data.google_maps_url || "",
        whatsapp_pengaduan: data.whatsapp_pengaduan || "",
        form_pengaduan_url: data.form_pengaduan_url || "",
      })
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal memuat pengaturan pelayanan."))
    } fontally: {
      setLoadingPengaturan(false)
    }
  }

  const loadDataLayanan = async () => {
    setLoadingLayanan(true)
    try {
      const data = await fetchLayananSuratAdmin()
      setLayananList(data)

      // Calculate next default urutan if not editing
      if (editingId === null && data.length > 0) {
        const maxUrutan = Math.max(...data.map((item) => item.urutan), 0)
        setFormLayanan((prev) => ({ ...prev, urutan_layanan: maxUrutan + 1 }))
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal memuat daftar layanan surat admin."))
    } finally {
      setLoadingLayanan(false)
    }
  }

  const loadAllData = async () => {
    setPesanError(null)
    await Promise.all([loadDataPengaturan(), loadDataLayanan()])
  }

  useEffect(() => {
    const init = async () => {
      const authed = await periksaAuth()
      if (authed) {
        await loadAllData()
      }
    }
    init()
  }, [])

  // ==========================================
  // HANDLERS FOR PENGATURAN FORM
  // ==========================================

  const handlePengaturanChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormPengaturan((prev) => ({ ...prev, [name]: value }))
    if (fieldErrorsPengaturan[name]) {
      setFieldErrorsPengaturan((prev) => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
    if (pesanSukses) setPesanSukses(null)
  }

  const validatePengaturanForm = (): boolean => {
    const errors: Record<string, string> = {}

    const jadwalTrim = formPengaturan.jadwal_pelayanan.trim()
    if (!jadwalTrim) {
      errors.jadwal_pelayanan = "Jadwal pelayanan wajib diisi."
    } else if (formPengaturan.jadwal_pelayanan.length > 5000) {
      errors.jadwal_pelayanan = "Jadwal pelayanan maksimal 5000 karakter."
    }

    const waPelayananTrim = formPengaturan.whatsapp_pelayanan.trim()
    if (waPelayananTrim) {
      if (waPelayananTrim.length > 50) {
        errors.whatsapp_pelayanan = "WhatsApp pelayanan maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(waPelayananTrim)) {
        errors.whatsapp_pelayanan = "Format WhatsApp hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    const emailTrim = formPengaturan.email_pelayanan.trim()
    if (emailTrim) {
      if (emailTrim.length > 320) {
        errors.email_pelayanan = "Email pelayanan maksimal 320 karakter."
      } else if (!REGEX_EMAIL.test(emailTrim)) {
        errors.email_pelayanan = "Format email tidak valid (contoh: nama@domain.com)."
      }
    }

    const telUtamaTrim = formPengaturan.telepon_pelayanan.trim()
    if (telUtamaTrim) {
      if (telUtamaTrim.length > 50) {
        errors.telepon_pelayanan = "Telepon utama maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(telUtamaTrim)) {
        errors.telepon_pelayanan = "Format telepon hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    const telAltTrim = formPengaturan.telepon_pelayanan_alternatif.trim()
    if (telAltTrim) {
      if (telAltTrim.length > 50) {
        errors.telepon_pelayanan_alternatif = "Telepon alternatif maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(telAltTrim)) {
        errors.telepon_pelayanan_alternatif = "Format telepon hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    if (formPengaturan.alamat_pelayanan.length > 1000) {
      errors.alamat_pelayanan = "Alamat pelayanan maksimal 1000 karakter."
    }

    const mapsTrim = formPengaturan.google_maps_url.trim()
    if (mapsTrim) {
      if (mapsTrim.length > 2048) {
        errors.google_maps_url = "Link Google Maps maksimal 2048 karakter."
      } else if (/\s/.test(mapsTrim)) {
        errors.google_maps_url = "Link Google Maps tidak boleh memuat spasi."
      } else if (!getSafeHttpsUrl(mapsTrim)) {
        errors.google_maps_url = "Link Google Maps harus berupa URL HTTPS yang valid."
      }
    }

    const waPengaduanTrim = formPengaturan.whatsapp_pengaduan.trim()
    if (waPengaduanTrim) {
      if (waPengaduanTrim.length > 50) {
        errors.whatsapp_pengaduan = "WhatsApp pengaduan maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(waPengaduanTrim)) {
        errors.whatsapp_pengaduan = "Format WhatsApp hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    const formPengaduanTrim = formPengaturan.form_pengaduan_url.trim()
    if (formPengaduanTrim) {
      if (formPengaduanTrim.length > 2048) {
        errors.form_pengaduan_url = "Link Form Pengaduan maksimal 2048 karakter."
      } else if (/\s/.test(formPengaduanTrim)) {
        errors.form_pengaduan_url = "Link Form Pengaduan tidak boleh memuat spasi."
      } else if (!getSafeHttpsUrl(formPengaduanTrim)) {
        errors.form_pengaduan_url = "Link Form Pengaduan harus berupa URL HTTPS yang valid."
      }
    }

    setFieldErrorsPengaturan(errors)
    return Object.keys(errors).length === 0
  }

  const handleSimpanPengaturan = async (e: FormEvent) => {
    e.preventDefault()
    setPesanSukses(null)
    setPesanError(null)

    if (submittingPengaturan) return
    if (!pengaturan) {
      setPesanError("Data pengaturan tidak tersedia untuk diperbarui.")
      return
    }

    if (!validatePengaturanForm()) {
      setPesanError("Silakan periksa kembali isian form pengaturan di bawah.")
      return
    }

    setSubmittingPengaturan(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setPesanError("Sesi admin tidak tersedia. Silakan masuk kembali.")
        return
      }

      const payload = {
        jadwal_pelayanan: formPengaturan.jadwal_pelayanan.trim(),
        whatsapp_pelayanan: formPengaturan.whatsapp_pelayanan.trim() || null,
        email_pelayanan: formPengaturan.email_pelayanan.trim() || null,
        telepon_pelayanan: formPengaturan.telepon_pelayanan.trim() || null,
        telepon_pelayanan_alternatif: formPengaturan.telepon_pelayanan_alternatif.trim() || null,
        alamat_pelayanan: formPengaturan.alamat_pelayanan.trim() || null,
        google_maps_url: formPengaturan.google_maps_url.trim()
          ? getSafeHttpsUrl(formPengaturan.google_maps_url.trim())
          : null,
        whatsapp_pengaduan: formPengaturan.whatsapp_pengaduan.trim() || null,
        form_pengaduan_url: formPengaturan.form_pengaduan_url.trim()
          ? getSafeHttpsUrl(formPengaturan.form_pengaduan_url.trim())
          : null,
      }

      const { data: updatedRow, error: updateError } = await supabase
        .from(PENGATURAN_LAYANAN_INFORMASI_TABLE)
        .update(payload)
        .eq("id", pengaturan.id)
        .eq("slot_key", "utama")
        .select(`
          id,
          slot_key,
          jadwal_pelayanan,
          whatsapp_pelayanan,
          email_pelayanan,
          telepon_pelayanan,
          telepon_pelayanan_alternatif,
          alamat_pelayanan,
          google_maps_url,
          whatsapp_pengaduan,
          form_pengaduan_url,
          created_at,
          updated_at
        `)
        .maybeSingle()

      if (updateError) throw updateError

      if (!updatedRow) {
        setPesanError("Gagal memperbarui pengaturan: data tidak ditemukan.")
        return
      }

      const updatedParsed: PengaturanLayananInformasi = {
        id: updatedRow.id,
        slot_key: "utama",
        jadwal_pelayanan: updatedRow.jadwal_pelayanan,
        whatsapp_pelayanan: updatedRow.whatsapp_pelayanan,
        email_pelayanan: updatedRow.email_pelayanan,
        telepon_pelayanan: updatedRow.telepon_pelayanan,
        telepon_pelayanan_alternatif: updatedRow.telepon_pelayanan_alternatif,
        alamat_pelayanan: updatedRow.alamat_pelayanan,
        google_maps_url: updatedRow.google_maps_url,
        whatsapp_pengaduan: updatedRow.whatsapp_pengaduan,
        form_pengaduan_url: updatedRow.form_pengaduan_url,
        created_at: String(updatedRow.created_at || ""),
        updated_at: String(updatedRow.updated_at || ""),
      }

      setPengaturan(updatedParsed)
      setSnapshotPengaturan(updatedParsed)
      setPesanSukses("Pengaturan pelayanan berhasil diperbarui.")
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal menyimpan perubahan pengaturan."))
    } finally {
      setSubmittingPengaturan(false)
    }
  }

  const handleBatalkanPengaturan = () => {
    if (!snapshotPengaturan) return
    setFormPengaturan({
      jadwal_pelayanan: snapshotPengaturan.jadwal_pelayanan || "",
      whatsapp_pelayanan: snapshotPengaturan.whatsapp_pelayanan || "",
      email_pelayanan: snapshotPengaturan.email_pelayanan || "",
      telepon_pelayanan: snapshotPengaturan.telepon_pelayanan || "",
      telepon_pelayanan_alternatif: snapshotPengaturan.telepon_pelayanan_alternatif || "",
      alamat_pelayanan: snapshotPengaturan.alamat_pelayanan || "",
      google_maps_url: snapshotPengaturan.google_maps_url || "",
      whatsapp_pengaduan: snapshotPengaturan.whatsapp_pengaduan || "",
      form_pengaduan_url: snapshotPengaturan.form_pengaduan_url || "",
    })
    setFieldErrorsPengaturan({})
    setPesanSukses(null)
    setPesanError(null)
  }

  // ==========================================
  // HANDLERS FOR LAYANAN SURAT & PERSYARATAN
  // ==========================================

  const handleLayananChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormLayanan((prev) => ({
      ...prev,
      [name]: name === "urutan_layanan" ? Math.max(1, parseInt(value, 10) || 1) : value,
    }))

    if (fieldErrorsLayanan[name]) {
      setFieldErrorsLayanan((prev) => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
    if (pesanSukses) setPesanSukses(null)
  }

  const handleAddPersyaratanRow = () => {
    setPersyaratanRows((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        id: null,
        isi_persyaratan: "",
        urutan: prev.length + 1,
      },
    ])
  }

  const handleRemovePersyaratanRow = (localId: string) => {
    if (persyaratanRows.length <= 1) {
      alert("Layanan surat wajib memiliki minimal 1 persyaratan.")
      return
    }
    setPersyaratanRows((prev) => {
      const filtered = prev.filter((r) => r.localId !== localId)
      return filtered.map((r, idx) => ({ ...r, urutan: idx + 1 }))
    })
  }

  const handlePersyaratanChange = (localId: string, value: string) => {
    setPersyaratanRows((prev) =>
      prev.map((r) => (r.localId === localId ? { ...r, isi_persyaratan: value } : r))
    )
    if (fieldErrorsLayanan.persyaratan) {
      setFieldErrorsLayanan((prev) => {
        const copy = { ...prev }
        delete copy.persyaratan
        return copy
      })
    }
  }

  const handleMovePersyaratan = (localId: string, direction: "up" | "down") => {
    const index = persyaratanRows.findIndex((r) => r.localId === localId)
    if (index < 0) return

    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= persyaratanRows.length) return

    const newRows = [...persyaratanRows]
    const temp = newRows[index]
    newRows[index] = newRows[targetIndex]
    newRows[targetIndex] = temp

    setPersyaratanRows(newRows.map((r, idx) => ({ ...r, urutan: idx + 1 })))
  }

  const resetLayananForm = () => {
    setEditingId(null)
    const maxUrutan = Math.max(...layananList.map((item) => item.urutan), 0)
    setFormLayanan({
      nama_layanan: "",
      deskripsi: "",
      estimasi_pembuatan: "",
      form_pendataan_url: "",
      urutan_layanan: maxUrutan + 1,
    })
    setPersyaratanRows([
      { localId: crypto.randomUUID(), id: null, isi_persyaratan: "", urutan: 1 },
    ])
    setFieldErrorsLayanan({})
  }

  const handleStartEdit = (item: LayananSuratDenganPersyaratan) => {
    setEditingId(item.id)
    setFormLayanan({
      nama_layanan: item.nama_layanan,
      deskripsi: item.deskripsi || "",
      estimasi_pembuatan: item.estimasi_pembuatan,
      form_pendataan_url: item.form_pendataan_url,
      urutan_layanan: item.urutan,
    })

    const rows: PersyaratanFormRow[] =
      item.persyaratan.length > 0
        ? item.persyaratan.map((p) => ({
            localId: crypto.randomUUID(),
            id: p.id,
            isi_persyaratan: p.isi_persyaratan,
            urutan: p.urutan,
          }))
        : [{ localId: crypto.randomUUID(), id: null, isi_persyaratan: "", urutan: 1 }]

    setPersyaratanRows(rows)
    setFieldErrorsLayanan({})
    setPesanSukses(null)
    setPesanError(null)

    // Scroll smoothly to form
    const formElement = document.getElementById("form-layanan-surat-section")
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  const validateLayananForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Nama Layanan
    const namaTrim = formLayanan.nama_layanan.trim()
    if (!namaTrim) {
      errors.nama_layanan = "Nama layanan surat wajib diisi."
    } else if (namaTrim.length < 2 || namaTrim.length > 200) {
      errors.nama_layanan = "Nama layanan surat harus 2 sampai 200 karakter."
    }

    // Deskripsi
    if (formLayanan.deskripsi.length > 3000) {
      errors.deskripsi = "Deskripsi layanan maksimal 3000 karakter."
    }

    // Estimasi Pembuatan
    const estimasiTrim = formLayanan.estimasi_pembuatan.trim()
    if (!estimasiTrim) {
      errors.estimasi_pembuatan = "Estimasi pembuatan wajib diisi."
    } else if (estimasiTrim.length > 200) {
      errors.estimasi_pembuatan = "Estimasi pembuatan maksimal 200 karakter."
    }

    // Form Pendataan URL
    const urlTrim = formLayanan.form_pendataan_url.trim()
    if (!urlTrim) {
      errors.form_pendataan_url = "Link formulir pendataan online wajib diisi."
    } else if (urlTrim.length > 2048) {
      errors.form_pendataan_url = "Link formulir pendataan maksimal 2048 karakter."
    } else if (/\s/.test(urlTrim)) {
      errors.form_pendataan_url = "Link formulir pendataan tidak boleh memuat spasi."
    } else if (!getSafeHttpsUrl(urlTrim)) {
      errors.form_pendataan_url = "Link formulir pendataan harus berupa URL HTTPS yang valid (contoh: https://docs.google.com/forms/d/e/...)."
    }

    // Urutan
    if (!formLayanan.urutan_layanan || formLayanan.urutan_layanan < 1) {
      errors.urutan_layanan = "Urutan harus minimal 1."
    }

    // Persyaratan
    if (persyaratanRows.length === 0) {
      errors.persyaratan = "Minimal harus ada satu poin persyaratan."
    } else {
      let emptyCount = 0
      for (const row of persyaratanRows) {
        if (!row.isi_persyaratan.trim()) {
          emptyCount++
        } else if (row.isi_persyaratan.length > 1000) {
          errors.persyaratan = "Setiap poin persyaratan maksimal 1000 karakter."
          break
        }
      }
      if (emptyCount > 0 && !errors.persyaratan) {
        errors.persyaratan = "Seluruh poin persyaratan wajib diisi (tidak boleh ada poin yang kosong)."
      }
    }

    setFieldErrorsLayanan(errors)
    return Object.keys(errors).length === 0
  }

  const handleSimpanLayanan = async (e: FormEvent) => {
    e.preventDefault()
    setPesanSukses(null)
    setPesanError(null)

    if (submittingLayanan) return

    if (!validateLayananForm()) {
      setPesanError("Silakan periksa kembali isian form layanan surat di bawah.")
      return
    }

    setSubmittingLayanan(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setPesanError("Sesi admin tidak tersedia. Silakan masuk kembali.")
        return
      }

      const parentPayload = {
        nama_layanan: formLayanan.nama_layanan.trim(),
        deskripsi: formLayanan.deskripsi.trim() || null,
        estimasi_pembuatan: formLayanan.estimasi_pembuatan.trim(),
        form_pendataan_url: getSafeHttpsUrl(formLayanan.form_pendataan_url.trim())!,
        urutan: Number(formLayanan.urutan_layanan),
      }

      if (editingId === null) {
        // MODE TAMAH: Create Layanan sebagai Draft
        const { data: newParent, error: parentInsertError } = await supabase
          .from(LAYANAN_SURAT_TABLE)
          .insert({
            ...parentPayload,
            is_active: false,
          })
          .select(`
            id,
            nama_layanan,
            deskripsi,
            estimasi_pembuatan,
            form_pendataan_url,
            is_active,
            urutan,
            created_at,
            updated_at
          `)
          .maybeSingle()

        if (parentInsertError) throw parentInsertError
        if (!newParent) throw new Error("Gagal membuat data utama layanan surat.")

        // Insert Children
        const childPayloads = persyaratanRows.map((r, idx) => ({
          layanan_surat_id: newParent.id,
          isi_persyaratan: r.isi_persyaratan.trim(),
          urutan: idx + 1,
        }))

        const { error: childInsertError } = await supabase
          .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
          .insert(childPayloads)

        if (childInsertError) {
          // COMPENSATING ROLLBACK: Hapus parent yang baru dibuat jika child gagal
          await supabase.from(LAYANAN_SURAT_TABLE).delete().eq("id", newParent.id)
          throw new Error(`Gagal menyimpan persyaratan. Data layanan dibatalkan otomatis: ${childInsertError.message}`)
        }

        await loadDataLayanan()
        resetLayananForm()
        setPesanSukses("Layanan surat baru berhasil dibuat sebagai Draft.")
      } else {
        // MODE EDIT: Update Parent & Rekonsiliasi Child secara berurutan & aman
        const { data: updatedParent, error: parentUpdateError } = await supabase
          .from(LAYANAN_SURAT_TABLE)
          .update(parentPayload)
          .eq("id", editingId)
          .select(`
            id,
            nama_layanan,
            deskripsi,
            estimasi_pembuatan,
            form_pendataan_url,
            is_active,
            urutan,
            created_at,
            updated_at
          `)
          .maybeSingle()

        if (parentUpdateError) throw parentUpdateError
        if (!updatedParent) throw new Error("Gagal memperbarui rincian data layanan surat.")

        // Rekonsiliasi Persyaratan Child:
        // 1. Child Existing (Update)
        const existingRows = persyaratanRows.filter((r) => r.id !== null)
        for (const row of existingRows) {
          const { error: errUpdateChild } = await supabase
            .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
            .update({
              isi_persyaratan: row.isi_persyaratan.trim(),
              urutan: row.urutan,
            })
            .eq("id", row.id!)
            .eq("layanan_surat_id", editingId)

          if (errUpdateChild) throw errUpdateChild
        }

        // 2. Child Baru (Insert)
        const newRows = persyaratanRows.filter((r) => r.id === null)
        if (newRows.length > 0) {
          const newChildPayloads = newRows.map((r) => ({
            layanan_surat_id: editingId,
            isi_persyaratan: r.isi_persyaratan.trim(),
            urutan: r.urutan,
          }))

          const { error: errInsertNewChild } = await supabase
            .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
            .insert(newChildPayloads)

          if (errInsertNewChild) throw errInsertNewChild
        }

        // 3. Child Dihapus (Delete)
        const currentItem = layananList.find((item) => item.id === editingId)
        if (currentItem) {
          const keptChildIds = existingRows.map((r) => r.id!)
          const removedChildIds = currentItem.persyaratan
            .map((p) => p.id)
            .filter((id) => !keptChildIds.includes(id))

          if (removedChildIds.length > 0) {
            const { error: errDeleteOldChild } = await supabase
              .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
              .delete()
              .in("id", removedChildIds)
              .eq("layanan_surat_id", editingId)

            if (errDeleteOldChild) throw errDeleteOldChild
          }
        }

        await loadDataLayanan()
        resetLayananForm()
        setPesanSukses("Perubahan layanan surat dan persyaratannya berhasil disimpan.")
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal menyimpan data layanan surat."))
    } finally {
      setSubmittingLayanan(false)
    }
  }

  const handleToggleStatus = async (item: LayananSuratDenganPersyaratan) => {
    setPesanSukses(null)
    setPesanError(null)

    if (togglingStatusId) return

    const targetActive = !item.is_active

    // Guard UI: cegah mengaktifkan jika tidak ada persyaratan
    if (targetActive && item.persyaratan.length === 0) {
      setPesanError("Layanan surat tidak dapat diaktifkan karena belum memiliki persyaratan.")
      return
    }

    setTogglingStatusId(item.id)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setPesanError("Sesi admin tidak tersedia. Silakan masuk kembali.")
        return
      }

      const { data: updatedRow, error: updateError } = await supabase
        .from(LAYANAN_SURAT_TABLE)
        .update({ is_active: targetActive })
        .eq("id", item.id)
        .select("id, is_active")
        .maybeSingle()

      if (updateError) throw updateError

      if (!updatedRow) {
        setPesanError("Gagal memperbarui status layanan surat.")
        return
      }

      await loadDataLayanan()
      setPesanSukses(
        targetActive
          ? `Layanan surat '${item.nama_layanan}' berhasil diaktifkan.`
          : `Layanan surat '${item.nama_layanan}' berhasil dinonaktifkan.`
      )
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal mengubah status layanan surat."))
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleDeleteLayanan = async (item: LayananSuratDenganPersyaratan) => {
    setPesanSukses(null)
    setPesanError(null)

    if (deletingLayananId) return

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus layanan '${item.nama_layanan}'?\n\n` +
        `Seluruh poin persyaratannya (${item.persyaratan.length} poin) akan ikut terhapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
    )

    if (!confirmed) return

    setDeletingLayananId(item.id)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setPesanError("Sesi admin tidak tersedia. Silakan masuk kembali.")
        return
      }

      const { data: deletedRow, error: deleteError } = await supabase
        .from(LAYANAN_SURAT_TABLE)
        .delete()
        .eq("id", item.id)
        .select("id")
        .maybeSingle()

      if (deleteError) throw deleteError

      if (!deletedRow) {
        setPesanError("Gagal menghapus layanan surat: data tidak ditemukan.")
        return
      }

      if (editingId === item.id) {
        resetLayananForm()
      }

      await loadDataLayanan()
      setPesanSukses(`Layanan surat '${item.nama_layanan}' beserta persyaratannya berhasil dihapus.`)
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal menghapus layanan surat."))
    } finally {
      setDeletingLayananId(null)
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Link href="/admin" className="hover:text-gray-900">
                Admin Panel
              </Link>
              <span>/</span>
              <span className="text-gray-900">Layanan Informasi</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              Kelola Layanan Informasi
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Atur jadwal, kontak pelayanan, serta daftar jenis layanan surat administrasi nagari.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Alert Messages */}
        <div aria-live="polite">
          {pesanSukses && (
            <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* SECTION A: PENGATURAN PELAYANAN & PENGADUAN */}
        {loadingPengaturan ? (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-600">Memuat pengaturan pelayanan...</p>
          </div>
        ) : !pengaturan ? (
          <div className="mb-8 rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Data Pengaturan Tidak Tersedia</h2>
            <p className="mt-1 text-sm text-gray-600">
              Data singleton pengaturan belum ditemukan di Supabase Development.
            </p>
            <button
              onClick={loadDataPengaturan}
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSimpanPengaturan} className="mb-10 space-y-6" noValidate>
            <div className="border-b border-gray-300 pb-3">
              <h2 className="text-xl font-bold text-gray-900">Bagian 1: Pengaturan Pelayanan & Saluran Pengaduan</h2>
              <p className="text-xs text-gray-500">
                Atur jadwal operasional, kontak pelayanan, serta saluran pengaduan masyarakat.
              </p>
            </div>

            {/* Status Information Box */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-900 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-semibold">Slot Pengaturan:</span> Utama (`utama`)
              </div>
              {pengaturan.updated_at && (
                <div className="text-xs text-teal-700">
                  Terakhir diperbarui: {new Date(pengaturan.updated_at).toLocaleString("id-ID")}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Jadwal Pelayanan */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <label htmlFor="jadwal_pelayanan" className="block text-sm font-semibold text-gray-700 mb-1">
                  Jadwal Pelayanan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="jadwal_pelayanan"
                  name="jadwal_pelayanan"
                  rows={3}
                  value={formPengaturan.jadwal_pelayanan}
                  onChange={handlePengaturanChange}
                  aria-invalid={Boolean(fieldErrorsPengaturan.jadwal_pelayanan)}
                  aria-describedby={fieldErrorsPengaturan.jadwal_pelayanan ? "err-jadwal" : undefined}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                    fieldErrorsPengaturan.jadwal_pelayanan
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                  }`}
                  placeholder={"Senin - Kamis: 08.00 - 16.00\nJum'at: 08.00 - 16.30\nSabtu - Minggu: Tutup"}
                />
                <div className="mt-1 flex items-center justify-between">
                  {fieldErrorsPengaturan.jadwal_pelayanan ? (
                    <p id="err-jadwal" className="text-xs text-red-600">
                      {fieldErrorsPengaturan.jadwal_pelayanan}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400">Dukungan teks multiline</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formPengaturan.jadwal_pelayanan.length}/5000
                  </span>
                </div>
              </div>

              {/* Kontak Pelayanan */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b pb-2">Kontak Pelayanan</h3>

                <div>
                  <label htmlFor="whatsapp_pelayanan" className="block text-xs font-semibold text-gray-700 mb-1">
                    WhatsApp Pelayanan (Opsional)
                  </label>
                  <input
                    type="text"
                    id="whatsapp_pelayanan"
                    name="whatsapp_pelayanan"
                    value={formPengaturan.whatsapp_pelayanan}
                    onChange={handlePengaturanChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="+62 823-1586-3113"
                  />
                </div>

                <div>
                  <label htmlFor="email_pelayanan" className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Pelayanan (Opsional)
                  </label>
                  <input
                    type="email"
                    id="email_pelayanan"
                    name="email_pelayanan"
                    value={formPengaturan.email_pelayanan}
                    onChange={handlePengaturanChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="aiamanggihbarat02@gmail.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="telepon_pelayanan" className="block text-xs font-semibold text-gray-700 mb-1">
                      Telepon Utama
                    </label>
                    <input
                      type="text"
                      id="telepon_pelayanan"
                      name="telepon_pelayanan"
                      value={formPengaturan.telepon_pelayanan}
                      onChange={handlePengaturanChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="082268789740"
                    />
                  </div>

                  <div>
                    <label htmlFor="telepon_pelayanan_alternatif" className="block text-xs font-semibold text-gray-700 mb-1">
                      Telepon Alternatif
                    </label>
                    <input
                      type="text"
                      id="telepon_pelayanan_alternatif"
                      name="telepon_pelayanan_alternatif"
                      value={formPengaturan.telepon_pelayanan_alternatif}
                      onChange={handlePengaturanChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="082172235321"
                    />
                  </div>
                </div>
              </div>

              {/* Lokasi & Pengaduan */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b pb-2">Lokasi & Saluran Pengaduan</h3>

                <div>
                  <label htmlFor="alamat_pelayanan" className="block text-xs font-semibold text-gray-700 mb-1">
                    Alamat Pelayanan (Opsional)
                  </label>
                  <textarea
                    id="alamat_pelayanan"
                    name="alamat_pelayanan"
                    rows={2}
                    value={formPengaturan.alamat_pelayanan}
                    onChange={handlePengaturanChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Kantor Wali Nagari Aia Manggih Barat"
                  />
                </div>

                <div>
                  <label htmlFor="google_maps_url" className="block text-xs font-semibold text-gray-700 mb-1">
                    Link Google Maps (HTTPS)
                  </label>
                  <input
                    type="url"
                    id="google_maps_url"
                    name="google_maps_url"
                    value={formPengaturan.google_maps_url}
                    onChange={handlePengaturanChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="whatsapp_pengaduan" className="block text-xs font-semibold text-gray-700 mb-1">
                      WhatsApp Pengaduan
                    </label>
                    <input
                      type="text"
                      id="whatsapp_pengaduan"
                      name="whatsapp_pengaduan"
                      value={formPengaturan.whatsapp_pengaduan}
                      onChange={handlePengaturanChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="+62 823-1586-3113"
                    />
                  </div>

                  <div>
                    <label htmlFor="form_pengaduan_url" className="block text-xs font-semibold text-gray-700 mb-1">
                      Form Pengaduan (HTTPS)
                    </label>
                    <input
                      type="url"
                      id="form_pengaduan_url"
                      name="form_pengaduan_url"
                      value={formPengaturan.form_pengaduan_url}
                      onChange={handlePengaturanChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="https://docs.google.com/forms/d/e/..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleBatalkanPengaturan}
                disabled={submittingPengaturan}
                className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Batalkan Perubahan
              </button>

              <button
                type="submit"
                disabled={submittingPengaturan}
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
              >
                {submittingPengaturan ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </form>
        )}

        {/* SECTION B: FORM TAMBAH / EDIT LAYANAN SURAT */}
        <div id="form-layanan-surat-section" className="mb-10 space-y-6">
          <div className="border-b border-gray-300 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Bagian 2: {editingId !== null ? "Edit Layanan Surat" : "Tambah Layanan Surat Baru"}
              </h2>
              <p className="text-xs text-gray-500">
                {editingId !== null
                  ? "Perbarui rincian data utama dan poin persyaratan layanan surat."
                  : "Layanan baru otomatis dibuat sebagai Draft. Aktifkan dari riwayat setelah siap dipublikasikan."}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetLayananForm}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm"
              >
                ✕ Batalkan Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSimpanLayanan} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6" noValidate>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Nama Layanan */}
              <div className="sm:col-span-2">
                <label htmlFor="nama_layanan" className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Layanan Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nama_layanan"
                  name="nama_layanan"
                  value={formLayanan.nama_layanan}
                  onChange={handleLayananChange}
                  aria-invalid={Boolean(fieldErrorsLayanan.nama_layanan)}
                  aria-describedby={fieldErrorsLayanan.nama_layanan ? "err-nama-layanan" : undefined}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                    fieldErrorsLayanan.nama_layanan
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                  }`}
                  placeholder="e.g. Surat Keterangan Domisili"
                />
                {fieldErrorsLayanan.nama_layanan && (
                  <p id="err-nama-layanan" className="mt-1 text-xs text-red-600">
                    {fieldErrorsLayanan.nama_layanan}
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div className="sm:col-span-2">
                <label htmlFor="deskripsi" className="block text-sm font-semibold text-gray-700 mb-1">
                  Deskripsi Layanan (Opsional)
                </label>
                <textarea
                  id="deskripsi"
                  name="deskripsi"
                  rows={2}
                  value={formLayanan.deskripsi}
                  onChange={handleLayananChange}
                  aria-invalid={Boolean(fieldErrorsLayanan.deskripsi)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Penjelasan singkat mengenai peruntukan atau ketentuan khusus jenis surat ini..."
                />
                {fieldErrorsLayanan.deskripsi && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.deskripsi}</p>
                )}
              </div>

              {/* Estimasi Pembuatan */}
              <div>
                <label htmlFor="estimasi_pembuatan" className="block text-sm font-semibold text-gray-700 mb-1">
                  Estimasi Pembuatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="estimasi_pembuatan"
                  name="estimasi_pembuatan"
                  value={formLayanan.estimasi_pembuatan}
                  onChange={handleLayananChange}
                  aria-invalid={Boolean(fieldErrorsLayanan.estimasi_pembuatan)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                    fieldErrorsLayanan.estimasi_pembuatan
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                  }`}
                  placeholder="e.g. 1 hari kerja / Selesai hari yang sama"
                />
                {fieldErrorsLayanan.estimasi_pembuatan && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.estimasi_pembuatan}</p>
                )}
              </div>

              {/* Urutan Layanan */}
              <div>
                <label htmlFor="urutan_layanan" className="block text-sm font-semibold text-gray-700 mb-1">
                  Urutan Tampil <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="urutan_layanan"
                  name="urutan_layanan"
                  min={1}
                  value={formLayanan.urutan_layanan}
                  onChange={handleLayananChange}
                  aria-invalid={Boolean(fieldErrorsLayanan.urutan_layanan)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {fieldErrorsLayanan.urutan_layanan && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.urutan_layanan}</p>
                )}
              </div>

              {/* Form Pendataan URL */}
              <div className="sm:col-span-2">
                <label htmlFor="form_pendataan_url" className="block text-sm font-semibold text-gray-700 mb-1">
                  Link Formulir Pendataan Online (HTTPS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="form_pendataan_url"
                  name="form_pendataan_url"
                  value={formLayanan.form_pendataan_url}
                  onChange={handleLayananChange}
                  aria-invalid={Boolean(fieldErrorsLayanan.form_pendataan_url)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                    fieldErrorsLayanan.form_pendataan_url
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                  }`}
                  placeholder="https://docs.google.com/forms/d/e/..."
                />
                {fieldErrorsLayanan.form_pendataan_url && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.form_pendataan_url}</p>
                )}
              </div>
            </div>

            {/* DYNAMIC PERSYARATAN SECTION */}
            <div className="border-t border-gray-200 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Poin-Poin Persyaratan Dokumen <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tambahkan syarat-syarat yang wajib dibawa warga saat mengurus surat ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddPersyaratanRow}
                  className="inline-flex items-center gap-1 rounded-lg border border-teal-600 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 shadow-sm"
                >
                  + Tambah Poin Persyaratan
                </button>
              </div>

              {fieldErrorsLayanan.persyaratan && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {fieldErrorsLayanan.persyaratan}
                </div>
              )}

              <div className="space-y-3">
                {persyaratanRows.map((row, index) => (
                  <div
                    key={row.localId}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={row.isi_persyaratan}
                      onChange={(e) => handlePersyaratanChange(row.localId, e.target.value)}
                      placeholder={`Contoh: Fotokopi KTP / KK (Poin ${index + 1})`}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />

                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleMovePersyaratan(row.localId, "up")}
                        disabled={index === 0}
                        title="Naikkan Urutan"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 text-xs"
                      >
                        ▲
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMovePersyaratan(row.localId, "down")}
                        disabled={index === persyaratanRows.length - 1}
                        title="Turunkan Urutan"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 text-xs"
                      >
                        ▼
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemovePersyaratanRow(row.localId)}
                        disabled={persyaratanRows.length <= 1}
                        title="Hapus Poin"
                        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 text-xs font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS LAYANAN FORM */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t pt-4">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetLayananForm}
                  disabled={submittingLayanan}
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Batalkan Edit
                </button>
              )}

              <button
                type="submit"
                disabled={submittingLayanan}
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
              >
                {submittingLayanan ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : editingId !== null ? (
                  <span>Simpan Perubahan</span>
                ) : (
                  <span>Simpan sebagai Draft</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION C: RIWAYAT DAFTAR LAYANAN SURAT */}
        <div className="space-y-6">
          <div className="border-b border-gray-300 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bagian 3: Riwayat & Daftar Layanan Surat</h2>
              <p className="text-xs text-gray-500">
                Kelola publikasi, pengubahan, dan penghapusan jenis layanan surat administrasi nagari.
              </p>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Total: {layananList.length} Jenis Surat
            </div>
          </div>

          {loadingLayanan ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-600">Memuat daftar layanan surat...</p>
            </div>
          ) : layananList.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-600">Belum ada layanan surat yang terdaftar.</p>
              <p className="mt-1 text-xs text-gray-400">Gunakan form di atas untuk membuat jenis layanan surat baru.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {layananList.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm transition-all ${
                    item.is_active ? "border-emerald-300 bg-emerald-50/10" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                          #{item.urutan}
                        </span>

                        <h3 className="text-lg font-bold text-gray-900">{item.nama_layanan}</h3>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.is_active ? "Aktif (Publik)" : "Draft"}
                        </span>
                      </div>

                      {item.deskripsi && (
                        <p className="text-sm text-gray-600 line-clamp-2">{item.deskripsi}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <div>
                          <span className="font-semibold text-gray-700">Estimasi:</span> {item.estimasi_pembuatan}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Persyaratan:</span> {item.persyaratan.length} poin
                        </div>
                        {item.form_pendataan_url && (
                          <div>
                            <a
                              href={item.form_pendataan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:underline font-medium"
                            >
                              Form Pendataan ↗
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Display List of Requirements preview */}
                      {item.persyaratan.length > 0 && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                          <p className="text-xs font-bold text-gray-700 mb-1.5">Poin Persyaratan:</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                            {item.persyaratan.map((p) => (
                              <li key={p.id}>{p.isi_persyaratan}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Action buttons per row */}
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      {item.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingStatusId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 shadow-sm"
                        >
                          {togglingStatusId === item.id ? "Memproses..." : "Nonaktifkan"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingStatusId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                        >
                          {togglingStatusId === item.id ? "Memproses..." : "Aktifkan"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        disabled={submittingLayanan}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLayanan(item)}
                        disabled={deletingLayananId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 shadow-sm"
                      >
                        {deletingLayananId === item.id ? "Hapus..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
