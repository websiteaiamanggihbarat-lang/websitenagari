"use client"

import { useEffect, useState, FormEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  fetchDataLayananInformasiAdmin,
  fetchJadwalPelayananInformasi,
  getSafeHttpsUrl,
  PENGATURAN_LAYANAN_INFORMASI_TABLE,
  LAYANAN_SURAT_TABLE,
  PERSYARATAN_LAYANAN_SURAT_TABLE,
  PengaturanLayananInformasi,
  LayananSuratDenganPersyaratan,
  JadwalPelayananInformasi,
  HariPelayananKey,
  HARI_PELAYANAN_LABEL,
} from "@/lib/layananInformasi"

interface FormState {
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
  whatsapp_pelayanan: "",
  email_pelayanan: "",
  telepon_pelayanan: "",
  telepon_pelayanan_alternatif: "",
  alamat_pelayanan: "",
  google_maps_url: "",
  whatsapp_pengaduan: "",
  form_pengaduan_url: "",
}

type JadwalPelayananFormRow = {
  hari_key: HariPelayananKey
  is_tutup: boolean
  jam_buka: string
  jam_tutup: string
}

function formatDbTimeToInputTime(val: string | null | undefined): string {
  if (typeof val !== "string") return ""
  const trimmed = val.trim()
  if (!trimmed) return ""
  const parts = trimmed.split(":")
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, "0")
    const mm = parts[1].padStart(2, "0")
    return `${hh}:${mm}`
  }
  return ""
}

interface PersyaratanFormRow {
  localId: string
  id: string | null
  isi_persyaratan: string
}

interface FormLayananState {
  nama_layanan: string
  estimasi_pembuatan: string
  biaya: string
  form_pendataan_url: string
}

const INITIAL_LAYANAN_FORM: FormLayananState = {
  nama_layanan: "",
  estimasi_pembuatan: "",
  biaya: "Gratis",
  form_pendataan_url: "",
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
    return err.message || "Data tidak memenuhi aturan validasi database."
  }
  if (code === "PGRST116") {
    return "Data tidak ditemukan."
  }
  return defaultMsg
}

function formatTanggalIndo(dateString: string | null | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return "-"
  }
}

export default function AdminLayananInformasiPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Pengaturan Singleton State
  const [loadingPengaturan, setLoadingPengaturan] = useState(true)
  const [submittingPengaturan, setSubmittingPengaturan] = useState(false)
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false)
  const [pengaturan, setPengaturan] = useState<PengaturanLayananInformasi | null>(null)
  const [snapshotPengaturan, setSnapshotPengaturan] = useState<PengaturanLayananInformasi | null>(null)
  const [formPengaturan, setFormPengaturan] = useState<FormState>(INITIAL_FORM_STATE)
  const [fieldErrorsPengaturan, setFieldErrorsPengaturan] = useState<Record<string, string>>({})

  // Jadwal Pelayanan State
  const [jadwalForm, setJadwalForm] = useState<JadwalPelayananFormRow[]>([])
  const [jadwalSnapshot, setJadwalSnapshot] = useState<JadwalPelayananFormRow[]>([])
  const [submittingJadwal, setSubmittingJadwal] = useState(false)
  const [jadwalError, setJadwalError] = useState<string | null>(null)
  const [jadwalSuccess, setJadwalSuccess] = useState<string | null>(null)
  const [fieldErrorsJadwal, setFieldErrorsJadwal] = useState<Record<string, string>>({})

  // Layanan Surat List State
  const [loadingLayanan, setLoadingLayanan] = useState(true)
  const [layananList, setLayananList] = useState<LayananSuratDenganPersyaratan[]>([])

  // Layanan Form State (Controlled by Header button)
  const [showLayananForm, setShowLayananForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formLayanan, setFormLayanan] = useState<FormLayananState>(INITIAL_LAYANAN_FORM)
  const [persyaratanRows, setPersyaratanRows] = useState<PersyaratanFormRow[]>([
    { localId: "init-1", id: null, isi_persyaratan: "" },
  ])
  const [fieldErrorsLayanan, setFieldErrorsLayanan] = useState<Record<string, string>>({})
  const [submittingLayanan, setSubmittingLayanan] = useState(false)
  const [deletingLayananId, setDeletingLayananId] = useState<string | null>(null)

  // Global Toast Messages
  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)

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

  const loadAllData = async () => {
    setPesanError(null)
    setLoadingPengaturan(true)
    setLoadingLayanan(true)
    setJadwalError(null)

    try {
      const dataAdmin = await fetchDataLayananInformasiAdmin()
      setLayananList(dataAdmin.layanan)

      if (dataAdmin.pengaturan) {
        setPengaturan(dataAdmin.pengaturan)
        setSnapshotPengaturan(dataAdmin.pengaturan)
        setFormPengaturan({
          whatsapp_pelayanan: dataAdmin.pengaturan.whatsapp_pelayanan || "",
          email_pelayanan: dataAdmin.pengaturan.email_pelayanan || "",
          telepon_pelayanan: dataAdmin.pengaturan.telepon_pelayanan || "",
          telepon_pelayanan_alternatif: dataAdmin.pengaturan.telepon_pelayanan_alternatif || "",
          alamat_pelayanan: dataAdmin.pengaturan.alamat_pelayanan || "",
          google_maps_url: dataAdmin.pengaturan.google_maps_url || "",
          whatsapp_pengaduan: dataAdmin.pengaturan.whatsapp_pengaduan || "",
          form_pengaduan_url: dataAdmin.pengaturan.form_pengaduan_url || "",
        })
      } else {
        setPengaturan(null)
        setSnapshotPengaturan(null)
      }

      if (dataAdmin.jadwal && dataAdmin.jadwal.length === 7) {
        const rows: JadwalPelayananFormRow[] = dataAdmin.jadwal.map((j) => ({
          hari_key: j.hari_key,
          is_tutup: j.is_tutup,
          jam_buka: formatDbTimeToInputTime(j.jam_buka),
          jam_tutup: formatDbTimeToInputTime(j.jam_tutup),
        }))
        setJadwalForm(rows)
        setJadwalSnapshot(rows)
      } else {
        setJadwalForm([])
        setJadwalSnapshot([])
        setJadwalError("Data jadwal pelayanan tidak lengkap. Silakan periksa konfigurasi database.")
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal memuat data layanan informasi admin."))
    } finally {
      setLoadingPengaturan(false)
      setLoadingLayanan(false)
    }
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

  // Auto dismiss success toast message after 4 seconds
  useEffect(() => {
    if (!pesanSukses) return

    const timerId = window.setTimeout(() => {
      setPesanSukses(null)
    }, 4000)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [pesanSukses])

  // ==========================================
  // HANDLERS FOR JADWAL PELAYANAN FORM
  // ==========================================

  const handleJadwalStatusToggle = (hariKey: HariPelayananKey, isTutup: boolean) => {
    setJadwalForm((prev) =>
      prev.map((row) => {
        if (row.hari_key === hariKey) {
          if (isTutup) {
            return { ...row, is_tutup: true, jam_buka: "", jam_tutup: "" }
          } else {
            return { ...row, is_tutup: false }
          }
        }
        return row
      })
    )
    setFieldErrorsJadwal((prev) => {
      const copy = { ...prev }
      delete copy[hariKey]
      delete copy[`${hariKey}_buka`]
      delete copy[`${hariKey}_tutup`]
      return copy
    })
    if (jadwalSuccess) setJadwalSuccess(null)
    if (jadwalError && !jadwalError.includes("tidak lengkap")) setJadwalError(null)
  }

  const handleJadwalTimeChange = (
    hariKey: HariPelayananKey,
    field: "jam_buka" | "jam_tutup",
    value: string
  ) => {
    setJadwalForm((prev) =>
      prev.map((row) => (row.hari_key === hariKey ? { ...row, [field]: value } : row))
    )
    setFieldErrorsJadwal((prev) => {
      const copy = { ...prev }
      delete copy[hariKey]
      delete copy[`${hariKey}_${field === "jam_buka" ? "buka" : "tutup"}`]
      return copy
    })
    if (jadwalSuccess) setJadwalSuccess(null)
    if (jadwalError && !jadwalError.includes("tidak lengkap")) setJadwalError(null)
  }

  const validateJadwalForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (jadwalForm.length !== 7) {
      setJadwalError("Data jadwal pelayanan tidak lengkap. Silakan periksa konfigurasi database.")
      return false
    }

    const validDays: HariPelayananKey[] = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"]
    const dayKeys = new Set(jadwalForm.map((r) => r.hari_key))
    if (dayKeys.size !== 7 || !validDays.every((d) => dayKeys.has(d))) {
      setJadwalError("Struktur hari pada jadwal pelayanan tidak valid.")
      return false
    }

    const REGEX_HHMM = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/

    for (const row of jadwalForm) {
      if (!row.is_tutup) {
        if (!row.jam_buka) {
          errors[`${row.hari_key}_buka`] = `Jam buka ${HARI_PELAYANAN_LABEL[row.hari_key]} wajib diisi.`
        } else if (!REGEX_HHMM.test(row.jam_buka)) {
          errors[`${row.hari_key}_buka`] = `Format jam buka ${HARI_PELAYANAN_LABEL[row.hari_key]} tidak valid.`
        }

        if (!row.jam_tutup) {
          errors[`${row.hari_key}_tutup`] = `Jam tutup ${HARI_PELAYANAN_LABEL[row.hari_key]} wajib diisi.`
        } else if (!REGEX_HHMM.test(row.jam_tutup)) {
          errors[`${row.hari_key}_tutup`] = `Format jam tutup ${HARI_PELAYANAN_LABEL[row.hari_key]} tidak valid.`
        }

        if (row.jam_buka && row.jam_tutup && REGEX_HHMM.test(row.jam_buka) && REGEX_HHMM.test(row.jam_tutup)) {
          if (row.jam_tutup <= row.jam_buka) {
            errors[row.hari_key] = `Jam tutup ${HARI_PELAYANAN_LABEL[row.hari_key]} harus setelah jam buka.`
          }
        }
      }
    }

    setFieldErrorsJadwal(errors)
    return Object.keys(errors).length === 0
  }

  const handleSimpanJadwal = async (e: FormEvent) => {
    e.preventDefault()
    setJadwalSuccess(null)
    setJadwalError(null)

    if (submittingJadwal) return

    if (!validateJadwalForm()) {
      setJadwalError("Silakan periksa kembali isian jam pelayanan.")
      return
    }

    setSubmittingJadwal(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setJadwalError("Sesi admin tidak tersedia. Silakan masuk kembali.")
        return
      }

      const payload = jadwalForm.map((row) => ({
        hari_key: row.hari_key,
        is_tutup: row.is_tutup,
        jam_buka: row.is_tutup ? null : row.jam_buka,
        jam_tutup: row.is_tutup ? null : row.jam_tutup,
      }))

      const { error: rpcError } = await supabase.rpc(
        "update_jadwal_pelayanan_informasi",
        { p_rows: payload }
      )

      if (rpcError) throw rpcError

      const updatedJadwal = await fetchJadwalPelayananInformasi()
      if (updatedJadwal && updatedJadwal.length === 7) {
        const rows: JadwalPelayananFormRow[] = updatedJadwal.map((j) => ({
          hari_key: j.hari_key,
          is_tutup: j.is_tutup,
          jam_buka: formatDbTimeToInputTime(j.jam_buka),
          jam_tutup: formatDbTimeToInputTime(j.jam_tutup),
        }))
        setJadwalForm(rows)
        setJadwalSnapshot(rows)
      }

      setPesanSukses("Jadwal pelayanan berhasil diperbarui.")
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setJadwalError(parseErrorMessage(e, "Gagal menyimpan jadwal pelayanan."))
    } finally {
      setSubmittingJadwal(false)
    }
  }

  const isJadwalDirty =
    jadwalForm.length === 7 &&
    jadwalSnapshot.length === 7 &&
    JSON.stringify(jadwalForm) !== JSON.stringify(jadwalSnapshot)

  // ==========================================
  // HANDLERS FOR PENGATURAN FORM (KONTAK)
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
      setPesanError("Silakan periksa kembali isian form kontak dan pengaduan.")
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

  // ==========================================
  // HANDLERS FOR LAYANAN FORM (ADD / EDIT)
  // ==========================================

  const handleOpenAddForm = () => {
    setEditingId(null)
    setFormLayanan(INITIAL_LAYANAN_FORM)
    setPersyaratanRows([
      { localId: crypto.randomUUID(), id: null, isi_persyaratan: "" },
    ])
    setFieldErrorsLayanan({})
    setPesanSukses(null)
    setPesanError(null)
    setShowLayananForm(true)

    setTimeout(() => {
      const formElement = document.getElementById("form-layanan-section")
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" })
      }
    }, 50)
  }

  const handleCancelLayananForm = () => {
    setShowLayananForm(false)
    setEditingId(null)
    setFormLayanan(INITIAL_LAYANAN_FORM)
    setPersyaratanRows([
      { localId: crypto.randomUUID(), id: null, isi_persyaratan: "" },
    ])
    setFieldErrorsLayanan({})
  }

  const handleLayananChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormLayanan((prev) => ({ ...prev, [name]: value }))

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
      },
    ])
  }

  const handleRemovePersyaratanRow = (localId: string) => {
    if (persyaratanRows.length <= 1) {
      alert("Layanan surat wajib memiliki minimal 1 persyaratan.")
      return
    }
    setPersyaratanRows((prev) => prev.filter((r) => r.localId !== localId))
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

  const handleStartEdit = (item: LayananSuratDenganPersyaratan) => {
    setEditingId(item.id)
    setFormLayanan({
      nama_layanan: item.nama_layanan,
      estimasi_pembuatan: item.estimasi_pembuatan,
      biaya: item.biaya || "Gratis",
      form_pendataan_url: item.form_pendataan_url,
    })

    const rows: PersyaratanFormRow[] =
      item.persyaratan.length > 0
        ? item.persyaratan.map((p) => ({
            localId: crypto.randomUUID(),
            id: p.id,
            isi_persyaratan: p.isi_persyaratan,
          }))
        : [{ localId: crypto.randomUUID(), id: null, isi_persyaratan: "" }]

    setPersyaratanRows(rows)
    setFieldErrorsLayanan({})
    setPesanSukses(null)
    setPesanError(null)
    setShowLayananForm(true)

    setTimeout(() => {
      const formElement = document.getElementById("form-layanan-section")
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" })
      }
    }, 50)
  }

  const validateLayananForm = (): boolean => {
    const errors: Record<string, string> = {}

    const namaTrim = formLayanan.nama_layanan.trim()
    if (!namaTrim) {
      errors.nama_layanan = "Nama layanan surat wajib diisi."
    } else if (namaTrim.length < 2 || namaTrim.length > 200) {
      errors.nama_layanan = "Nama layanan surat harus 2 sampai 200 karakter."
    }

    const estimasiTrim = formLayanan.estimasi_pembuatan.trim()
    if (!estimasiTrim) {
      errors.estimasi_pembuatan = "Estimasi pembuatan wajib diisi."
    } else if (estimasiTrim.length > 200) {
      errors.estimasi_pembuatan = "Estimasi pembuatan maksimal 200 karakter."
    }

    const biayaTrim = formLayanan.biaya.trim()
    if (!biayaTrim) {
      errors.biaya = "Informasi biaya layanan surat wajib diisi."
    } else if (biayaTrim.length > 100) {
      errors.biaya = "Informasi biaya layanan maksimal 100 karakter."
    }

    const urlTrim = formLayanan.form_pendataan_url.trim()
    if (!urlTrim) {
      errors.form_pendataan_url = "Link formulir pendataan online wajib diisi."
    } else if (urlTrim.length > 2048) {
      errors.form_pendataan_url = "Link formulir pendataan maksimal 2048 karakter."
    } else if (/\s/.test(urlTrim)) {
      errors.form_pendataan_url = "Link formulir pendataan tidak boleh memuat spasi."
    } else if (!getSafeHttpsUrl(urlTrim)) {
      errors.form_pendataan_url = "Link formulir pendataan harus berupa URL HTTPS yang valid."
    }

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
        errors.persyaratan = "Seluruh poin persyaratan wajib diisi."
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

      if (editingId === null) {
        const nextUrutan =
          layananList.length === 0
            ? 1
            : Math.max(...layananList.map((item) => item.urutan)) + 1

        const { data: newParent, error: parentInsertError } = await supabase
          .from(LAYANAN_SURAT_TABLE)
          .insert({
            nama_layanan: formLayanan.nama_layanan.trim(),
            estimasi_pembuatan: formLayanan.estimasi_pembuatan.trim(),
            biaya: formLayanan.biaya.trim(),
            form_pendataan_url: getSafeHttpsUrl(formLayanan.form_pendataan_url.trim())!,
            is_active: false,
            urutan: nextUrutan,
          })
          .select("id")
          .maybeSingle()

        if (parentInsertError) throw parentInsertError
        if (!newParent) throw new Error("Gagal membuat data utama layanan surat.")

        const childPayloads = persyaratanRows.map((r, idx) => ({
          layanan_surat_id: newParent.id,
          isi_persyaratan: r.isi_persyaratan.trim(),
          urutan: idx + 1,
        }))

        const { error: childInsertError } = await supabase
          .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
          .insert(childPayloads)

        if (childInsertError) {
          await supabase.from(LAYANAN_SURAT_TABLE).delete().eq("id", newParent.id)
          throw new Error(`Gagal menyimpan persyaratan. Data layanan dibatalkan: ${childInsertError.message}`)
        }

        const { error: activateError } = await supabase
          .from(LAYANAN_SURAT_TABLE)
          .update({ is_active: true })
          .eq("id", newParent.id)

        if (activateError) {
          await supabase.from(LAYANAN_SURAT_TABLE).delete().eq("id", newParent.id)
          throw new Error(`Gagal mempublikasikan layanan. Data layanan dibatalkan: ${activateError.message}`)
        }

        await loadAllData()
        handleCancelLayananForm()
        setPesanSukses("Layanan berhasil ditambahkan dan langsung dipublikasikan.")
      } else {
        const { error: parentUpdateError } = await supabase
          .from(LAYANAN_SURAT_TABLE)
          .update({
            nama_layanan: formLayanan.nama_layanan.trim(),
            estimasi_pembuatan: formLayanan.estimasi_pembuatan.trim(),
            biaya: formLayanan.biaya.trim(),
            form_pendataan_url: getSafeHttpsUrl(formLayanan.form_pendataan_url.trim())!,
            is_active: true,
          })
          .eq("id", editingId)

        if (parentUpdateError) throw parentUpdateError

        const existingRows = persyaratanRows.filter((r) => r.id !== null)
        for (let idx = 0; idx < existingRows.length; idx++) {
          const row = existingRows[idx]
          const posUrutan = persyaratanRows.findIndex((r) => r.localId === row.localId) + 1

          const { error: errUpdateChild } = await supabase
            .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
            .update({
              isi_persyaratan: row.isi_persyaratan.trim(),
              urutan: posUrutan,
            })
            .eq("id", row.id!)
            .eq("layanan_surat_id", editingId)

          if (errUpdateChild) throw errUpdateChild
        }

        const newRows = persyaratanRows.filter((r) => r.id === null)
        if (newRows.length > 0) {
          const newChildPayloads = newRows.map((r) => ({
            layanan_surat_id: editingId,
            isi_persyaratan: r.isi_persyaratan.trim(),
            urutan: persyaratanRows.findIndex((row) => row.localId === r.localId) + 1,
          }))

          const { error: errInsertNewChild } = await supabase
            .from(PERSYARATAN_LAYANAN_SURAT_TABLE)
            .insert(newChildPayloads)

          if (errInsertNewChild) throw errInsertNewChild
        }

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

        await loadAllData()
        handleCancelLayananForm()
        setPesanSukses("Perubahan layanan surat berhasil disimpan.")
      }
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal menyimpan data layanan surat."))
    } finally {
      setSubmittingLayanan(false)
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
        handleCancelLayananForm()
      }

      await loadAllData()
      setPesanSukses(`Layanan surat '${item.nama_layanan}' berhasil dihapus.`)
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation (Matching Kelola Kesenian Tradisional) */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-amber-200"
              title="Kembali ke Dashboard Admin"
              aria-label="Kembali ke Dashboard Admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Kelola Layanan Informasi
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Kelola layanan surat, persyaratan, jadwal pelayanan, kontak, dan saluran pengaduan nagari.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!showLayananForm && (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Layanan Surat Baru
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
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
      </div>

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

        {/* COLLAPSIBLE SECTION: PENGATURAN PELAYANAN & SALURAN PENGADUAN (KREM HEADER) */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsPengaturanOpen(!isPengaturanOpen)}
            aria-expanded={isPengaturanOpen}
            aria-controls="panel-pengaturan-pelayanan"
            aria-label={isPengaturanOpen ? "Tutup Pengaturan Pelayanan" : "Buka Pengaturan Pelayanan"}
            className="w-full flex items-center justify-between p-5 text-left bg-[#f7f2e8] hover:bg-[#ebdcc4] transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6b4b1d]"
          >
            <div>
              <h2 className="text-lg font-bold text-[#2c1b01]">
                Pengaturan Pelayanan & Saluran Pengaduan
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Atur jadwal operasional, kontak kantor, lokasi, serta saluran pengaduan masyarakat.
              </p>
            </div>

            <div className="flex items-center text-[#2c1b01]">
              <svg
                className={`h-5 w-5 transition-transform duration-200 ${isPengaturanOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPengaturanOpen && (
            <div id="panel-pengaturan-pelayanan" className="p-6 border-t border-gray-200 space-y-8">
              {loadingPengaturan ? (
                <div className="py-6 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#6b4b1d] border-r-transparent"></div>
                  <p className="mt-2 text-xs text-gray-600">Memuat pengaturan pelayanan...</p>
                </div>
              ) : (
                <>
                  {/* SUBSECTION 1: JADWAL PELAYANAN TERSTRUKTUR */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-3">
                      <h3 className="text-base font-bold text-[#2c1b01]">Jadwal Pelayanan</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Atur hari dan jam operasional pelayanan kantor nagari.
                      </p>
                    </div>

                    {jadwalError && (
                      <div className="rounded-lg border border-red-300 bg-red-50 p-3.5 text-xs font-medium text-red-800 shadow-sm flex items-center gap-2">
                        <svg className="h-4 w-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{jadwalError}</span>
                      </div>
                    )}

                    {jadwalForm.length !== 7 ? (
                      <div className="p-4 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                        Data jadwal pelayanan tidak lengkap. Silakan periksa konfigurasi database.
                      </div>
                    ) : (
                      <form onSubmit={handleSimpanJadwal} className="space-y-6" noValidate>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <table className="w-full text-left text-sm text-gray-700">
                            <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                              <tr>
                                <th scope="col" className="w-[20%] px-5 py-3 font-bold">HARI</th>
                                <th scope="col" className="w-[25%] px-5 py-3 font-bold">STATUS</th>
                                <th scope="col" className="w-[27.5%] px-5 py-3 font-bold">JAM BUKA</th>
                                <th scope="col" className="w-[27.5%] px-5 py-3 font-bold">JAM TUTUP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {jadwalForm.map((row) => {
                                const dayLabel = HARI_PELAYANAN_LABEL[row.hari_key]
                                const hasRowError = Boolean(fieldErrorsJadwal[row.hari_key])
                                const hasBukaError = Boolean(fieldErrorsJadwal[`${row.hari_key}_buka`])
                                const hasTutupError = Boolean(fieldErrorsJadwal[`${row.hari_key}_tutup`])

                                return (
                                  <tr key={row.hari_key} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-5 py-3.5 font-bold text-gray-900">
                                      {dayLabel}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                                        <button
                                          type="button"
                                          aria-pressed={!row.is_tutup}
                                          onClick={() => handleJadwalStatusToggle(row.hari_key, false)}
                                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                            !row.is_tutup
                                              ? "bg-[#2c1b01] text-white shadow-sm"
                                              : "text-gray-600 hover:text-gray-900"
                                          }`}
                                        >
                                          Buka
                                        </button>
                                        <button
                                          type="button"
                                          aria-pressed={row.is_tutup}
                                          onClick={() => handleJadwalStatusToggle(row.hari_key, true)}
                                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                            row.is_tutup
                                              ? "bg-[#2c1b01] text-white shadow-sm"
                                              : "text-gray-600 hover:text-gray-900"
                                          }`}
                                        >
                                          Tutup
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <input
                                        type="time"
                                        aria-label={`Jam Buka ${dayLabel}`}
                                        value={row.jam_buka}
                                        disabled={row.is_tutup}
                                        onChange={(e) => handleJadwalTimeChange(row.hari_key, "jam_buka", e.target.value)}
                                        className={`w-full max-w-[160px] rounded-lg border px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
                                          row.is_tutup
                                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                            : hasBukaError || hasRowError
                                            ? "border-red-500 focus:border-red-500 focus:ring-red-400"
                                            : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                                        }`}
                                      />
                                      {hasBukaError && (
                                        <p className="mt-1 text-[11px] text-red-600">{fieldErrorsJadwal[`${row.hari_key}_buka`]}</p>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <input
                                        type="time"
                                        aria-label={`Jam Tutup ${dayLabel}`}
                                        value={row.jam_tutup}
                                        disabled={row.is_tutup}
                                        onChange={(e) => handleJadwalTimeChange(row.hari_key, "jam_tutup", e.target.value)}
                                        className={`w-full max-w-[160px] rounded-lg border px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
                                          row.is_tutup
                                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                            : hasTutupError || hasRowError
                                            ? "border-red-500 focus:border-red-500 focus:ring-red-400"
                                            : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                                        }`}
                                      />
                                      {hasTutupError && (
                                        <p className="mt-1 text-[11px] text-red-600">{fieldErrorsJadwal[`${row.hari_key}_tutup`]}</p>
                                      )}
                                      {hasRowError && (
                                        <p className="mt-1 text-[11px] text-red-600">{fieldErrorsJadwal[row.hari_key]}</p>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Stacked Card View */}
                        <div className="space-y-3 md:hidden">
                          {jadwalForm.map((row) => {
                            const dayLabel = HARI_PELAYANAN_LABEL[row.hari_key]
                            const hasRowError = Boolean(fieldErrorsJadwal[row.hari_key])
                            const hasBukaError = Boolean(fieldErrorsJadwal[`${row.hari_key}_buka`])
                            const hasTutupError = Boolean(fieldErrorsJadwal[`${row.hari_key}_tutup`])

                            return (
                              <div key={row.hari_key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-900 text-sm">{dayLabel}</span>

                                  <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                                    <button
                                      type="button"
                                      aria-pressed={!row.is_tutup}
                                      onClick={() => handleJadwalStatusToggle(row.hari_key, false)}
                                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                        !row.is_tutup
                                          ? "bg-[#2c1b01] text-white shadow-sm"
                                          : "text-gray-600 hover:text-gray-900"
                                      }`}
                                    >
                                      Buka
                                    </button>
                                    <button
                                      type="button"
                                      aria-pressed={row.is_tutup}
                                      onClick={() => handleJadwalStatusToggle(row.hari_key, true)}
                                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                        row.is_tutup
                                          ? "bg-[#2c1b01] text-white shadow-sm"
                                          : "text-gray-600 hover:text-gray-900"
                                      }`}
                                    >
                                      Tutup
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <label htmlFor={`mobile_buka_${row.hari_key}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                                      Jam Buka
                                    </label>
                                    <input
                                      type="time"
                                      id={`mobile_buka_${row.hari_key}`}
                                      aria-label={`Jam Buka ${dayLabel}`}
                                      value={row.jam_buka}
                                      disabled={row.is_tutup}
                                      onChange={(e) => handleJadwalTimeChange(row.hari_key, "jam_buka", e.target.value)}
                                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none ${
                                        row.is_tutup
                                          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                          : hasBukaError || hasRowError
                                          ? "border-red-500 focus:ring-red-400"
                                          : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                                      }`}
                                    />
                                    {hasBukaError && (
                                      <p className="mt-1 text-[11px] text-red-600">{fieldErrorsJadwal[`${row.hari_key}_buka`]}</p>
                                    )}
                                  </div>

                                  <div>
                                    <label htmlFor={`mobile_tutup_${row.hari_key}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                                      Jam Tutup
                                    </label>
                                    <input
                                      type="time"
                                      id={`mobile_tutup_${row.hari_key}`}
                                      aria-label={`Jam Tutup ${dayLabel}`}
                                      value={row.jam_tutup}
                                      disabled={row.is_tutup}
                                      onChange={(e) => handleJadwalTimeChange(row.hari_key, "jam_tutup", e.target.value)}
                                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none ${
                                        row.is_tutup
                                          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                          : hasTutupError || hasRowError
                                          ? "border-red-500 focus:ring-red-400"
                                          : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                                      }`}
                                    />
                                    {hasTutupError && (
                                      <p className="mt-1 text-[11px] text-red-600">{fieldErrorsJadwal[`${row.hari_key}_tutup`]}</p>
                                    )}
                                  </div>
                                </div>

                                {hasRowError && (
                                  <p className="text-[11px] text-red-600 font-medium">{fieldErrorsJadwal[row.hari_key]}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Action Buttons for Jadwal */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 pt-4">
                          <button
                            type="submit"
                            disabled={submittingJadwal || !isJadwalDirty}
                            className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                          >
                            {submittingJadwal ? "Menyimpan..." : "Simpan Jadwal"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* SUBSECTION 2: KONTAK, LOKASI & SALURAN PENGADUAN */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-base font-bold text-[#2c1b01]">Kontak, Lokasi & Saluran Pengaduan</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Atur nomor telepon, email, alamat kantor, Google Maps, serta formulir pengaduan nagari.
                      </p>
                    </div>

                    {!pengaturan ? (
                      <div className="p-4 text-center text-sm text-red-600">
                        Data pengaturan pelayanan belum tersedia di database.
                      </div>
                    ) : (
                      <form onSubmit={handleSimpanPengaturan} className="space-y-6" noValidate>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          {/* Kontak Pelayanan */}
                          <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Kontak Pelayanan</h4>

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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                placeholder="+62 823-1586-3113"
                              />
                              {fieldErrorsPengaturan.whatsapp_pelayanan && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.whatsapp_pelayanan}</p>
                              )}
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                placeholder="aiamanggihbarat02@gmail.com"
                              />
                              {fieldErrorsPengaturan.email_pelayanan && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.email_pelayanan}</p>
                              )}
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
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  placeholder="082268789740"
                                />
                                {fieldErrorsPengaturan.telepon_pelayanan && (
                                  <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.telepon_pelayanan}</p>
                                )}
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
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  placeholder="082172235321"
                                />
                                {fieldErrorsPengaturan.telepon_pelayanan_alternatif && (
                                  <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.telepon_pelayanan_alternatif}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Lokasi & Pengaduan */}
                          <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Lokasi & Saluran Pengaduan</h4>

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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                placeholder="Kantor Wali Nagari Aia Manggih Barat"
                              />
                              {fieldErrorsPengaturan.alamat_pelayanan && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.alamat_pelayanan}</p>
                              )}
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                placeholder="https://maps.google.com/?q=..."
                              />
                              {fieldErrorsPengaturan.google_maps_url && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.google_maps_url}</p>
                              )}
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
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  placeholder="+62 823-1586-3113"
                                />
                                {fieldErrorsPengaturan.whatsapp_pengaduan && (
                                  <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.whatsapp_pengaduan}</p>
                                )}
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
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                                  placeholder="https://docs.google.com/forms/d/e/..."
                                />
                                {fieldErrorsPengaturan.form_pengaduan_url && (
                                  <p className="mt-1 text-xs text-red-600">{fieldErrorsPengaturan.form_pengaduan_url}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t pt-4">
                          <button
                            type="submit"
                            disabled={submittingPengaturan}
                            className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                          >
                            {submittingPengaturan ? "Menyimpan..." : "Simpan Pengaturan"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* SECTION: FORM TAMBAH / EDIT LAYANAN SURAT (KREM HEADER, WHITE BODY) */}
        {showLayananForm && (
          <div id="form-layanan-section" className="mb-8 scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2c1b01]">
                  {editingId !== null ? "Edit Layanan Surat" : "Tambah Layanan Surat Baru"}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {editingId !== null
                    ? "Ubah data layanan surat dan persyaratannya."
                    : "Tambahkan jenis layanan surat dan persyaratannya."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelLayananForm}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm cursor-pointer"
              >
                ✕ Batal
              </button>
            </div>

            {/* Body Form Putih */}
            <form onSubmit={handleSimpanLayanan} className="p-6 space-y-6" noValidate>
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
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrorsLayanan.nama_layanan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                    }`}
                    placeholder="e.g. Surat Keterangan Domisili"
                  />
                  {fieldErrorsLayanan.nama_layanan && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.nama_layanan}</p>
                  )}
                </div>

                {/* Estimasi Pembuatan */}
                <div className="sm:col-span-2">
                  <label htmlFor="estimasi_pembuatan" className="block text-sm font-semibold text-gray-700 mb-1">
                    Estimasi Pembuatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="estimasi_pembuatan"
                    name="estimasi_pembuatan"
                    value={formLayanan.estimasi_pembuatan}
                    onChange={handleLayananChange}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrorsLayanan.estimasi_pembuatan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                    }`}
                    placeholder="e.g. 1 hari kerja / Selesai hari yang sama"
                  />
                  {fieldErrorsLayanan.estimasi_pembuatan && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.estimasi_pembuatan}</p>
                  )}
                </div>

                {/* Biaya */}
                <div className="sm:col-span-2">
                  <label htmlFor="biaya" className="block text-sm font-semibold text-gray-700 mb-1">
                    Biaya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="biaya"
                    name="biaya"
                    value={formLayanan.biaya}
                    onChange={handleLayananChange}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrorsLayanan.biaya
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                    }`}
                    placeholder="Contoh: Gratis atau Rp10.000"
                  />
                  {fieldErrorsLayanan.biaya && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.biaya}</p>
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
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrorsLayanan.form_pendataan_url
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-[#6b4b1d] focus:ring-[#6b4b1d]"
                    }`}
                    placeholder="https://docs.google.com/forms/d/e/..."
                  />
                  {fieldErrorsLayanan.form_pendataan_url && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrorsLayanan.form_pendataan_url}</p>
                  )}
                </div>
              </div>

              {/* DYNAMIC PERSYARATAN SECTION (AUTOMATIC ORDERING) */}
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Poin-Poin Persyaratan Dokumen <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Urutan poin ditentukan otomatis berdasarkan urutan posisi input di bawah.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPersyaratanRow}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#6b4b1d] bg-[#f7f2e8] px-3 py-1.5 text-xs font-semibold text-[#6b4b1d] hover:bg-[#ebdcc4] shadow-sm transition-colors cursor-pointer"
                  >
                    + Tambah Persyaratan
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
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 p-2.5"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2c1b01] text-xs font-bold text-white">
                        {index + 1}
                      </span>

                      <input
                        type="text"
                        value={row.isi_persyaratan}
                        onChange={(e) => handlePersyaratanChange(row.localId, e.target.value)}
                        placeholder={`Poin Persyaratan #${index + 1}`}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d]"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemovePersyaratanRow(row.localId)}
                        disabled={persyaratanRows.length <= 1}
                        className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={handleCancelLayananForm}
                  disabled={submittingLayanan}
                  className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submittingLayanan}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  {submittingLayanan ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : editingId !== null ? (
                    <span>Simpan Perubahan</span>
                  ) : (
                    <span>Simpan Layanan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION: DAFTAR LAYANAN SURAT (TABLE FORMAT MATCHING LEMBAGA ORGANISASI) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daftar Layanan Surat</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelola layanan surat yang tersedia untuk masyarakat.
            </p>
          </div>

          {loadingLayanan ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6b4b1d] border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-600">Memuat daftar layanan surat...</p>
            </div>
          ) : layananList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm space-y-3">
              <p className="text-sm font-medium text-gray-600">Belum ada layanan surat.</p>
              {!showLayananForm && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6b4b1d] to-[#2c1b01] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambahkan Layanan Surat Baru</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01]">
                    <tr>
                      <th scope="col" className="w-[55%] px-6 py-4 font-bold">NAMA LAYANAN</th>
                      <th scope="col" className="w-[28%] px-6 py-4 font-bold">TERAKHIR DIPERBARUI</th>
                      <th scope="col" className="w-[17%] px-6 py-4 text-right font-bold">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {layananList.map((item) => {
                      const isDeleting = deletingLayananId === item.id

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900 break-words">
                            {item.nama_layanan}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            {formatTanggalIndo(item.updated_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                disabled={submittingLayanan || isDeleting}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLayanan(item)}
                                disabled={isDeleting}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-50 cursor-pointer"
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

              {/* Mobile List View */}
              <div className="space-y-3 md:hidden">
                {layananList.map((item) => {
                  const isDeleting = deletingLayananId === item.id

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2"
                    >
                      <div className="font-bold text-gray-900 text-sm break-words">
                        {item.nama_layanan}
                      </div>

                      <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-600">Terakhir diperbarui:</span>{" "}
                        {formatTanggalIndo(item.updated_at)}
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          disabled={submittingLayanan || isDeleting}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLayanan(item)}
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
    </div>
  )
}
