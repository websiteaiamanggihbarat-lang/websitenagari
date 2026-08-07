"use client"

import { useEffect, useState, FormEvent } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  fetchPengaturanLayananInformasi,
  getSafeHttpsUrl,
  PENGATURAN_LAYANAN_INFORMASI_TABLE,
  PengaturanLayananInformasi,
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

const REGEX_PHONE_CHAR = /^[0-9\+\-\s\(\)\.]*$/
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

interface SupabaseErrorLike {
  code?: string
  message?: string
}

function parseErrorMessage(err: SupabaseErrorLike | null | undefined, defaultMsg: string): string {
  if (!err) return defaultMsg
  const code = err.code || ""
  if (code === "23514") {
    return "Data tidak memenuhi aturan validasi database."
  }
  if (code === "42501") {
    return "Anda tidak memiliki izin untuk memperbarui pengaturan."
  }
  if (code === "PGRST116") {
    return "Data pengaturan utama tidak ditemukan."
  }
  return defaultMsg
}

export default function AdminLayananInformasiPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [pengaturan, setPengaturan] = useState<PengaturanLayananInformasi | null>(null)
  const [snapshot, setSnapshot] = useState<PengaturanLayananInformasi | null>(null)

  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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

  const loadPengaturan = async () => {
    setLoadingData(true)
    setPesanError(null)
    try {
      const data = await fetchPengaturanLayananInformasi()
      if (!data) {
        setPesanError("Data pengaturan layanan informasi belum tersedia di database.")
        setPengaturan(null)
        setSnapshot(null)
        return
      }

      setPengaturan(data)
      setSnapshot(data)
      setFormState({
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
      setPesanError(parseErrorMessage(e, "Gagal memuat pengaturan layanan informasi."))
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const authed = await periksaAuth()
      if (authed) {
        await loadPengaturan()
      }
    }
    init()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
    if (pesanSukses) setPesanSukses(null)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Jadwal
    const jadwalTrim = formState.jadwal_pelayanan.trim()
    if (!jadwalTrim) {
      errors.jadwal_pelayanan = "Jadwal pelayanan wajib diisi."
    } else if (formState.jadwal_pelayanan.length > 5000) {
      errors.jadwal_pelayanan = "Jadwal pelayanan maksimal 5000 karakter."
    }

    // WhatsApp Pelayanan
    const waPelayananTrim = formState.whatsapp_pelayanan.trim()
    if (waPelayananTrim) {
      if (waPelayananTrim.length > 50) {
        errors.whatsapp_pelayanan = "WhatsApp pelayanan maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(waPelayananTrim)) {
        errors.whatsapp_pelayanan = "Format WhatsApp hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    // Email Pelayanan
    const emailTrim = formState.email_pelayanan.trim()
    if (emailTrim) {
      if (emailTrim.length > 320) {
        errors.email_pelayanan = "Email pelayanan maksimal 320 karakter."
      } else if (!REGEX_EMAIL.test(emailTrim)) {
        errors.email_pelayanan = "Format email tidak valid (contoh: nama@domain.com)."
      }
    }

    // Telepon Pelayanan Utama
    const telUtamaTrim = formState.telepon_pelayanan.trim()
    if (telUtamaTrim) {
      if (telUtamaTrim.length > 50) {
        errors.telepon_pelayanan = "Telepon utama maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(telUtamaTrim)) {
        errors.telepon_pelayanan = "Format telepon hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    // Telepon Pelayanan Alternatif
    const telAltTrim = formState.telepon_pelayanan_alternatif.trim()
    if (telAltTrim) {
      if (telAltTrim.length > 50) {
        errors.telepon_pelayanan_alternatif = "Telepon alternatif maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(telAltTrim)) {
        errors.telepon_pelayanan_alternatif = "Format telepon hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    // Alamat Pelayanan
    if (formState.alamat_pelayanan.length > 1000) {
      errors.alamat_pelayanan = "Alamat pelayanan maksimal 1000 karakter."
    }

    // Google Maps URL
    const mapsTrim = formState.google_maps_url.trim()
    if (mapsTrim) {
      if (mapsTrim.length > 2048) {
        errors.google_maps_url = "Link Google Maps maksimal 2048 karakter."
      } else if (/\s/.test(mapsTrim)) {
        errors.google_maps_url = "Link Google Maps tidak boleh memuat spasi."
      } else if (!getSafeHttpsUrl(mapsTrim)) {
        errors.google_maps_url = "Link Google Maps harus berupa URL HTTPS yang valid."
      }
    }

    // WhatsApp Pengaduan
    const waPengaduanTrim = formState.whatsapp_pengaduan.trim()
    if (waPengaduanTrim) {
      if (waPengaduanTrim.length > 50) {
        errors.whatsapp_pengaduan = "WhatsApp pengaduan maksimal 50 karakter."
      } else if (!REGEX_PHONE_CHAR.test(waPengaduanTrim)) {
        errors.whatsapp_pengaduan = "Format WhatsApp hanya boleh memuat angka, +, -, spasi, titik, dan kurung."
      }
    }

    // Form Pengaduan URL
    const formPengaduanTrim = formState.form_pengaduan_url.trim()
    if (formPengaduanTrim) {
      if (formPengaduanTrim.length > 2048) {
        errors.form_pengaduan_url = "Link Form Pengaduan maksimal 2048 karakter."
      } else if (/\s/.test(formPengaduanTrim)) {
        errors.form_pengaduan_url = "Link Form Pengaduan tidak boleh memuat spasi."
      } else if (!getSafeHttpsUrl(formPengaduanTrim)) {
        errors.form_pengaduan_url = "Link Form Pengaduan harus berupa URL HTTPS yang valid."
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSimpan = async (e: FormEvent) => {
    e.preventDefault()
    setPesanSukses(null)
    setPesanError(null)

    if (submitting) return
    if (!pengaturan) {
      setPesanError("Data pengaturan tidak tersedia untuk diperbarui.")
      return
    }

    if (!validateForm()) {
      setPesanError("Silakan periksa kembali isian form di bawah.")
      return
    }

    setSubmitting(true)

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
        jadwal_pelayanan: formState.jadwal_pelayanan.trim(),
        whatsapp_pelayanan: formState.whatsapp_pelayanan.trim() || null,
        email_pelayanan: formState.email_pelayanan.trim() || null,
        telepon_pelayanan: formState.telepon_pelayanan.trim() || null,
        telepon_pelayanan_alternatif: formState.telepon_pelayanan_alternatif.trim() || null,
        alamat_pelayanan: formState.alamat_pelayanan.trim() || null,
        google_maps_url: formState.google_maps_url.trim()
          ? getSafeHttpsUrl(formState.google_maps_url.trim())
          : null,
        whatsapp_pengaduan: formState.whatsapp_pengaduan.trim() || null,
        form_pengaduan_url: formState.form_pengaduan_url.trim()
          ? getSafeHttpsUrl(formState.form_pengaduan_url.trim())
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

      if (updateError) {
        throw updateError
      }

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
      setSnapshot(updatedParsed)
      setPesanSukses("Pengaturan layanan informasi berhasil diperbarui.")
    } catch (err: unknown) {
      const e = err as SupabaseErrorLike
      setPesanError(parseErrorMessage(e, "Gagal menyimpan perubahan pengaturan."))
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatalkan = () => {
    if (!snapshot) return
    setFormState({
      jadwal_pelayanan: snapshot.jadwal_pelayanan || "",
      whatsapp_pelayanan: snapshot.whatsapp_pelayanan || "",
      email_pelayanan: snapshot.email_pelayanan || "",
      telepon_pelayanan: snapshot.telepon_pelayanan || "",
      telepon_pelayanan_alternatif: snapshot.telepon_pelayanan_alternatif || "",
      alamat_pelayanan: snapshot.alamat_pelayanan || "",
      google_maps_url: snapshot.google_maps_url || "",
      whatsapp_pengaduan: snapshot.whatsapp_pengaduan || "",
      form_pengaduan_url: snapshot.form_pengaduan_url || "",
    })
    setFieldErrors({})
    setPesanSukses(null)
    setPesanError(null)
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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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
              Atur jadwal pelayanan, kontak pelayanan, alamat, serta saluran pengaduan publik.
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

        {/* Loading Data */}
        {loadingData ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-600">Memuat pengaturan layanan informasi...</p>
          </div>
        ) : !pengaturan ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Data Pengaturan Tidak Tersedia</h2>
            <p className="mt-1 text-sm text-gray-600">
              Data singleton pengaturan belum ditemukan di Supabase Development.
            </p>
            <button
              onClick={loadPengaturan}
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSimpan} className="space-y-8" noValidate>
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

            {/* Section 1: Jadwal Pelayanan */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">1. Jadwal Pelayanan</h2>
              <p className="text-xs text-gray-500 mb-4">
                Tentukan jam operasional kantor pelayanan yang ditampilkan pada halaman publik.
              </p>

              <div>
                <label htmlFor="jadwal_pelayanan" className="block text-sm font-semibold text-gray-700 mb-1">
                  Jadwal Pelayanan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="jadwal_pelayanan"
                  name="jadwal_pelayanan"
                  rows={4}
                  value={formState.jadwal_pelayanan}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.jadwal_pelayanan)}
                  aria-describedby={fieldErrors.jadwal_pelayanan ? "err-jadwal" : undefined}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.jadwal_pelayanan
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                  }`}
                  placeholder={"Senin - Kamis: 08.00 - 16.00\nJum'at: 08.00 - 16.30\nSabtu - Minggu: Tutup"}
                />
                <div className="mt-1 flex items-center justify-between">
                  {fieldErrors.jadwal_pelayanan ? (
                    <p id="err-jadwal" className="text-xs text-red-600">
                      {fieldErrors.jadwal_pelayanan}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400">Dukungan teks multiline</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formState.jadwal_pelayanan.length}/5000
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Kontak Pelayanan */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">2. Kontak Pelayanan</h2>
              <p className="text-xs text-gray-500 mb-4">
                Atur nomor WhatsApp, email, dan dua nomor telepon kantor pelayanan.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* WhatsApp Pelayanan */}
                <div>
                  <label htmlFor="whatsapp_pelayanan" className="block text-sm font-semibold text-gray-700 mb-1">
                    WhatsApp Pelayanan (Opsional)
                  </label>
                  <input
                    type="text"
                    id="whatsapp_pelayanan"
                    name="whatsapp_pelayanan"
                    value={formState.whatsapp_pelayanan}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.whatsapp_pelayanan)}
                    aria-describedby={fieldErrors.whatsapp_pelayanan ? "err-wa" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.whatsapp_pelayanan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="+62 823-1586-3113"
                  />
                  {fieldErrors.whatsapp_pelayanan && (
                    <p id="err-wa" className="mt-1 text-xs text-red-600">
                      {fieldErrors.whatsapp_pelayanan}
                    </p>
                  )}
                </div>

                {/* Email Pelayanan */}
                <div>
                  <label htmlFor="email_pelayanan" className="block text-sm font-semibold text-gray-700 mb-1">
                    Email Pelayanan (Opsional)
                  </label>
                  <input
                    type="email"
                    id="email_pelayanan"
                    name="email_pelayanan"
                    value={formState.email_pelayanan}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.email_pelayanan)}
                    aria-describedby={fieldErrors.email_pelayanan ? "err-email" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.email_pelayanan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="aiamanggihbarat02@gmail.com"
                  />
                  {fieldErrors.email_pelayanan && (
                    <p id="err-email" className="mt-1 text-xs text-red-600">
                      {fieldErrors.email_pelayanan}
                    </p>
                  )}
                </div>

                {/* Telepon Utama */}
                <div>
                  <label htmlFor="telepon_pelayanan" className="block text-sm font-semibold text-gray-700 mb-1">
                    Telepon Pelayanan Utama (Opsional)
                  </label>
                  <input
                    type="text"
                    id="telepon_pelayanan"
                    name="telepon_pelayanan"
                    value={formState.telepon_pelayanan}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.telepon_pelayanan)}
                    aria-describedby={fieldErrors.telepon_pelayanan ? "err-tel" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.telepon_pelayanan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="082268789740"
                  />
                  {fieldErrors.telepon_pelayanan && (
                    <p id="err-tel" className="mt-1 text-xs text-red-600">
                      {fieldErrors.telepon_pelayanan}
                    </p>
                  )}
                </div>

                {/* Telepon Alternatif */}
                <div>
                  <label htmlFor="telepon_pelayanan_alternatif" className="block text-sm font-semibold text-gray-700 mb-1">
                    Telepon Pelayanan Alternatif (Opsional)
                  </label>
                  <input
                    type="text"
                    id="telepon_pelayanan_alternatif"
                    name="telepon_pelayanan_alternatif"
                    value={formState.telepon_pelayanan_alternatif}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.telepon_pelayanan_alternatif)}
                    aria-describedby={fieldErrors.telepon_pelayanan_alternatif ? "err-tel-alt" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.telepon_pelayanan_alternatif
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="082172235321"
                  />
                  {fieldErrors.telepon_pelayanan_alternatif && (
                    <p id="err-tel-alt" className="mt-1 text-xs text-red-600">
                      {fieldErrors.telepon_pelayanan_alternatif}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Lokasi & Alamat */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">3. Lokasi & Alamat Pelayanan</h2>
              <p className="text-xs text-gray-500 mb-4">
                Atur alamat fisik kantor wali nagari dan pautan Google Maps.
              </p>

              <div className="space-y-4">
                {/* Alamat */}
                <div>
                  <label htmlFor="alamat_pelayanan" className="block text-sm font-semibold text-gray-700 mb-1">
                    Alamat Pelayanan (Opsional)
                  </label>
                  <textarea
                    id="alamat_pelayanan"
                    name="alamat_pelayanan"
                    rows={2}
                    value={formState.alamat_pelayanan}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.alamat_pelayanan)}
                    aria-describedby={fieldErrors.alamat_pelayanan ? "err-alamat" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.alamat_pelayanan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="Kantor Wali Nagari Aia Manggih Barat"
                  />
                  {fieldErrors.alamat_pelayanan && (
                    <p id="err-alamat" className="mt-1 text-xs text-red-600">
                      {fieldErrors.alamat_pelayanan}
                    </p>
                  )}
                </div>

                {/* Google Maps URL */}
                <div>
                  <label htmlFor="google_maps_url" className="block text-sm font-semibold text-gray-700 mb-1">
                    Link Google Maps (Opsional, HTTPS)
                  </label>
                  <input
                    type="url"
                    id="google_maps_url"
                    name="google_maps_url"
                    value={formState.google_maps_url}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.google_maps_url)}
                    aria-describedby={fieldErrors.google_maps_url ? "err-maps" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.google_maps_url
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="https://maps.google.com/?q=..."
                  />
                  {fieldErrors.google_maps_url && (
                    <p id="err-maps" className="mt-1 text-xs text-red-600">
                      {fieldErrors.google_maps_url}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Saluran Pengaduan */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">4. Saluran Pengaduan Masyarakat</h2>
              <p className="text-xs text-gray-500 mb-4">
                Atur kontak WhatsApp pengaduan dan link formulir pengaduan publik.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* WhatsApp Pengaduan */}
                <div>
                  <label htmlFor="whatsapp_pengaduan" className="block text-sm font-semibold text-gray-700 mb-1">
                    WhatsApp Pengaduan (Opsional)
                  </label>
                  <input
                    type="text"
                    id="whatsapp_pengaduan"
                    name="whatsapp_pengaduan"
                    value={formState.whatsapp_pengaduan}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.whatsapp_pengaduan)}
                    aria-describedby={fieldErrors.whatsapp_pengaduan ? "err-wa-pengaduan" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.whatsapp_pengaduan
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="+62 823-1586-3113"
                  />
                  {fieldErrors.whatsapp_pengaduan && (
                    <p id="err-wa-pengaduan" className="mt-1 text-xs text-red-600">
                      {fieldErrors.whatsapp_pengaduan}
                    </p>
                  )}
                </div>

                {/* Form Pengaduan URL */}
                <div>
                  <label htmlFor="form_pengaduan_url" className="block text-sm font-semibold text-gray-700 mb-1">
                    Link Form Pengaduan (Opsional, HTTPS)
                  </label>
                  <input
                    type="url"
                    id="form_pengaduan_url"
                    name="form_pengaduan_url"
                    value={formState.form_pengaduan_url}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.form_pengaduan_url)}
                    aria-describedby={fieldErrors.form_pengaduan_url ? "err-form-pengaduan" : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.form_pengaduan_url
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:border-teal-600 focus:ring-teal-500"
                    }`}
                    placeholder="https://docs.google.com/forms/d/e/..."
                  />
                  {fieldErrors.form_pengaduan_url && (
                    <p id="err-form-pengaduan" className="mt-1 text-xs text-red-600">
                      {fieldErrors.form_pengaduan_url}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleBatalkan}
                disabled={submitting}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Batalkan Perubahan
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>

            {/* Informasi Tahap Berikutnya */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 text-sm text-gray-600 shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-0.5">Pengelolaan Jenis Surat & Persyaratan</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Pengelolaan daftar jenis layanan surat administrasi nagari beserta poin-poin persyaratannya akan berada pada bagian ini pada tahap pengembangan berikutnya.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
