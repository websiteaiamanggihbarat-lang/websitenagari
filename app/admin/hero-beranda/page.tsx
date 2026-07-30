"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  BUCKET_GAMBAR_HERO_BERANDA,
  HeroBeranda,
  MAKS_UKURAN_GAMBAR_HERO,
  MIME_GAMBAR_HERO,
  PILIHAN_POSISI_GAMBAR_HERO,
  PosisiGambarHero,
  fetchSemuaHeroBerandaAdmin,
  getLabelPosisiGambarHero,
  getObjectPositionHero,
  isPosisiGambarHero,
} from "@/lib/heroBeranda"

/**
 * Helper internal untuk menormalisasi nama file menjadi aman untuk Storage path
 */
function buatNamaFileAman(file: File): string {
  let ext = ""
  if (file.type === "image/jpeg") ext = ".jpg"
  else if (file.type === "image/png") ext = ".png"
  else if (file.type === "image/webp") ext = ".webp"
  else {
    const dotIndex = file.name.lastIndexOf(".")
    ext = dotIndex !== -1 ? file.name.slice(dotIndex).toLowerCase() : ".jpg"
  }

  const dotIndex = file.name.lastIndexOf(".")
  const baseName = dotIndex !== -1 ? file.name.slice(0, dotIndex) : file.name

  const baseSanitized = baseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const finalBase = baseSanitized || "gambar-hero"
  return `${finalBase}${ext}`
}

/**
 * Helper internal untuk membersihkan file baru di Storage jika insert DB gagal (Rollback)
 */
async function hapusFileBaruSetelahGagal(
  storagePath: string
): Promise<{ berhasil: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_GAMBAR_HERO_BERANDA)
      .remove([storagePath])

    if (!error) {
      return { berhasil: true, error: null }
    }
    return { berhasil: false, error: error.message }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { berhasil: false, error: msg }
  }
}

export default function AdminHeroBerandaPage() {
  // State Data Admin
  const [daftarHero, setDaftarHero] = useState<HeroBeranda[]>([])
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [errorData, setErrorData] = useState<string | null>(null)

  // State Form Admin
  const [formTerbuka, setFormTerbuka] = useState<boolean>(false)
  const [modeForm, setModeForm] = useState<"tambah" | "edit">("tambah")
  const [heroSedangDiedit, setHeroSedangDiedit] = useState<HeroBeranda | null>(null)

  // State Fields
  const [namaInternal, setNamaInternal] = useState<string>("")
  const [teksAlt, setTeksAlt] = useState<string>("")
  const [posisiGambar, setPosisiGambar] = useState<PosisiGambarHero>("center")
  const [urutan, setUrutan] = useState<string>("0")
  const [isActive, setIsActive] = useState<boolean>(false)

  // State File & Preview Lokal (Hanya Mode Tambah)
  const [fileGambar, setFileGambar] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dimensiGambar, setDimensiGambar] = useState<{ width: number; height: number } | null>(null)
  const [warningGambar, setWarningGambar] = useState<string[]>([])

  // Ref untuk Melindungi Race Condition Pembacaan Gambar Lokal
  const activeObjectUrlRef = useRef<string | null>(null)

  // State Feedback Form
  const [loadingForm, setLoadingForm] = useState<boolean>(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [pesanSuksesForm, setPesanSuksesForm] = useState<string | null>(null)

  // Helper Terpusat Cleanup Object URL Lokal
  const bersihkanPreviewLokal = useCallback(() => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current)
      activeObjectUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current)
        activeObjectUrlRef.current = null
      }
    }
  }, [])

  // Muat Data Admin Read-Only
  const muatDaftarHero = useCallback(async () => {
    setLoadingData(true)
    setErrorData(null)
    try {
      const data = await fetchSemuaHeroBerandaAdmin()
      setDaftarHero(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorData(msg || "Data hero beranda belum dapat dimuat.")
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    muatDaftarHero()
  }, [muatDaftarHero])

  // Reset & Buka Form Tambah
  const bukaFormTambah = () => {
    bersihkanPreviewLokal()
    setModeForm("tambah")
    setHeroSedangDiedit(null)
    setNamaInternal("")
    setTeksAlt("")
    setPosisiGambar("center")
    setUrutan("0")
    setIsActive(false)
    setFileGambar(null)
    setDimensiGambar(null)
    setWarningGambar([])
    setErrorForm(null)
    setPesanSuksesForm(null)
    setFormTerbuka(true)
  }

  // Buka Form Edit Metadata
  const bukaFormEdit = (item: HeroBeranda) => {
    bersihkanPreviewLokal()
    setModeForm("edit")
    setHeroSedangDiedit(item)
    setNamaInternal(item.nama_internal)
    setTeksAlt(item.teks_alt)
    setPosisiGambar(item.posisi_gambar)
    setUrutan(item.urutan.toString())
    setIsActive(item.is_active)
    setFileGambar(null)
    setDimensiGambar(null)
    setWarningGambar([])
    setErrorForm(null)
    setPesanSuksesForm(null)
    setFormTerbuka(true)
  }

  // Tutup Form
  const tutupForm = () => {
    if (loadingForm) return
    bersihkanPreviewLokal()
    setFormTerbuka(false)
    setHeroSedangDiedit(null)
    setFileGambar(null)
    setDimensiGambar(null)
    setWarningGambar([])
    setErrorForm(null)
    setPesanSuksesForm(null)
  }

  // Handler Pilih File Gambar (Mode Tambah)
  const handlePilihFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorForm(null)
    setWarningGambar([])

    // 1. Validasi Tipe MIME
    if (!file.type || !MIME_GAMBAR_HERO.includes(file.type as typeof MIME_GAMBAR_HERO[number])) {
      setErrorForm("Format file tidak didukung. Harap pilih gambar berformat JPEG, PNG, atau WebP.")
      bersihkanPreviewLokal()
      setFileGambar(null)
      setDimensiGambar(null)
      e.target.value = ""
      return
    }

    // 2. Validasi Ukuran Maksimal (10 MB)
    if (file.size > MAKS_UKURAN_GAMBAR_HERO) {
      setErrorForm("Ukuran file melebihi batas maksimal 10 MB. Harap pilih gambar yang lebih kecil.")
      bersihkanPreviewLokal()
      setFileGambar(null)
      setDimensiGambar(null)
      e.target.value = ""
      return
    }

    const warnings: string[] = []

    // Warning File > 2 MB
    if (file.size > 2 * 1024 * 1024) {
      warnings.push(
        "Ukuran gambar cukup besar (> 2 MB) dan dapat memperlambat tampilan hero. Disarankan menggunakan file teroptimasi maksimal sekitar 2 MB."
      )
    }

    // Bersihkan preview lama
    bersihkanPreviewLokal()

    // Buat Object URL baru & catat ke Ref
    const newUrl = URL.createObjectURL(file)
    activeObjectUrlRef.current = newUrl
    setPreviewUrl(newUrl)
    setFileGambar(file)

    // Deteksi Dimensi & Orientasi Gambar via Image decoding
    const img = new Image()
    img.onload = () => {
      // Mencegah Race Condition jika pengguna mengganti file dengan cepat
      if (activeObjectUrlRef.current !== newUrl) return

      const width = img.naturalWidth
      const height = img.naturalHeight
      setDimensiGambar({ width, height })

      if (width <= height) {
        warnings.push(
          "Gambar berorientasi portrait atau persegi dan dapat terpotong cukup besar pada hero. Gunakan gambar landscape jika tersedia."
        )
      }
      if (width < 1280 || height < 720) {
        warnings.push("Resolusi gambar relatif rendah (< 1280×720 px) dan dapat terlihat kurang tajam pada layar besar.")
      }

      setWarningGambar(warnings)
    }

    img.onerror = () => {
      if (activeObjectUrlRef.current !== newUrl) return

      setErrorForm("Gagal membaca file gambar. Harap pastikan file gambar valid dan tidak rusak.")
      bersihkanPreviewLokal()
      setFileGambar(null)
      setDimensiGambar(null)
      e.target.value = ""
    }

    img.src = newUrl
  }

  // Submit Handler: Safe Create & Safe Edit Metadata
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setErrorForm(null)
    setPesanSuksesForm(null)

    // 1. Validasi Metadata Runtime
    const namaTrim = namaInternal.trim()
    const altTrim = teksAlt.trim()
    const urutanParsed = parseInt(urutan, 10)

    if (!namaTrim) {
      setErrorForm("Nama internal wajib diisi.")
      return
    }
    if (!altTrim) {
      setErrorForm("Teks alternatif wajib diisi.")
      return
    }
    if (!isPosisiGambarHero(posisiGambar)) {
      setErrorForm("Nilai posisi fokus gambar tidak valid.")
      return
    }
    if (isNaN(urutanParsed) || !Number.isInteger(urutanParsed) || urutanParsed < 0) {
      setErrorForm("Urutan harus berupa angka bulat minimal 0.")
      return
    }

    const urutanFinal = urutanParsed

    // MODE TAMBAH (Safe Create)
    if (modeForm === "tambah") {
      if (!fileGambar) {
        setErrorForm("File gambar hero wajib dipilih.")
        return
      }

      setLoadingForm(true)
      const heroId = crypto.randomUUID()
      const randomSuffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8)
      const timestamp = Date.now()
      const namaAman = buatNamaFileAman(fileGambar)
      const storagePath = `hero-beranda/${heroId}/gambar/${timestamp}-${randomSuffix}-${namaAman}`

      try {
        // 1. Upload File Gambar ke Storage (upsert: false)
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_GAMBAR_HERO_BERANDA)
          .upload(storagePath, fileGambar, {
            contentType: fileGambar.type,
            upsert: false,
          })

        if (uploadError) {
          setErrorForm(`Gambar gagal diunggah: ${uploadError.message}. Data belum disimpan.`)
          setLoadingForm(false)
          return
        }

        // 2. Ambil Public URL & Validasi HTTPS
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_GAMBAR_HERO_BERANDA).getPublicUrl(storagePath)

        let isHttpsUrl = false
        try {
          const parsedUrl = new URL(publicUrl)
          isHttpsUrl = parsedUrl.protocol === "https:"
        } catch {
          isHttpsUrl = false
        }

        if (!publicUrl || !isHttpsUrl) {
          const rollbackRes = await hapusFileBaruSetelahGagal(storagePath)
          const infoRollback = rollbackRes.berhasil
            ? " File yang sempat diunggah telah dibersihkan."
            : ` File yang sempat diunggah belum berhasil dibersihkan (${storagePath}).`

          setErrorForm(`Public URL gambar yang dihasilkan tidak valid.${infoRollback}`)
          setLoadingForm(false)
          return
        }

        // 3. Insert Record Database (Tepat 8 Field)
        const { error: dbError } = await supabase.from("hero_beranda").insert({
          id: heroId,
          nama_internal: namaTrim,
          gambar_url: publicUrl,
          gambar_storage_path: storagePath,
          teks_alt: altTrim,
          posisi_gambar: posisiGambar,
          is_active: isActive,
          urutan: urutanFinal,
        })

        // 4. Rollback jika DB Insert Gagal
        if (dbError) {
          const rollbackRes = await hapusFileBaruSetelahGagal(storagePath)
          const infoRollback = rollbackRes.berhasil
            ? " File yang sempat diunggah telah dibersihkan."
            : ` File yang sempat diunggah belum berhasil dibersihkan (Storage Path: ${storagePath}).`

          if (dbError.code === "23505") {
            setErrorForm(
              `File atau data hero tersebut berbenturan dengan data yang sudah ada. Silakan pilih ulang file dan coba kembali.${infoRollback}`
            )
          } else {
            setErrorForm(`Gagal menyimpan data hero: ${dbError.message}.${infoRollback}`)
          }
          setLoadingForm(false)
          return
        }

        // Sukses Safe Create
        setPesanSuksesForm("Gambar hero berhasil ditambahkan.")
        bersihkanPreviewLokal()
        setFormTerbuka(false)
        await muatDaftarHero()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setErrorForm(`Terjadi kesalahan tidak terduga: ${msg}`)
      } finally {
        setLoadingForm(false)
      }
    }

    // MODE EDIT METADATA (Tanpa Mengganti Gambar & Tanpa Operasi Storage)
    else if (modeForm === "edit") {
      if (!heroSedangDiedit) {
        setErrorForm("Data hero yang akan diedit tidak ditemukan.")
        return
      }

      setLoadingForm(true)

      try {
        // Update Tepat 5 Field Metadata
        const { error: updateError } = await supabase
          .from("hero_beranda")
          .update({
            nama_internal: namaTrim,
            teks_alt: altTrim,
            posisi_gambar: posisiGambar,
            urutan: urutanFinal,
            is_active: isActive,
          })
          .eq("id", heroSedangDiedit.id)

        if (updateError) {
          setErrorForm(`Metadata hero gagal diperbarui: ${updateError.message}`)
          setLoadingForm(false)
          return
        }

        // Sukses Edit Metadata
        setPesanSuksesForm("Metadata hero berhasil diperbarui.")
        setFormTerbuka(false)
        await muatDaftarHero()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setErrorForm(`Terjadi kesalahan tidak terduga saat memperbarui metadata: ${msg}`)
      } finally {
        setLoadingForm(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Header Navigation (Cokelat Gelap khas Admin) */}
      <header className="bg-[#2c1b01] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <Link
                href="/admin"
                className="text-amber-200 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                &larr; Kembali ke Dashboard
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kelola Hero Beranda</h1>
            <p className="text-amber-200/80 text-sm mt-1">
              Tambah dan atur gambar utama yang tampil bergantian pada beranda.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={bukaFormTambah}
              disabled={loadingForm}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Tambah Gambar</span>
            </button>

            <Link
              href="/auth/signout"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        {/* Banner Pesan Sukses Form Global */}
        {pesanSuksesForm && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-800 animate-fade-in">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium">{pesanSuksesForm}</p>
            </div>
            <button
              type="button"
              onClick={() => setPesanSuksesForm(null)}
              className="text-emerald-600 hover:text-emerald-800 text-sm font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Form Modal / Collapsible */}
        {formTerbuka && (
          <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
            <div className="bg-[#2c1b01]/5 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {modeForm === "tambah" ? "Tambah Gambar Hero Beranda Baru" : "Edit Metadata Hero Beranda"}
              </h2>
              <button
                type="button"
                onClick={tutupForm}
                disabled={loadingForm}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none disabled:opacity-50"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
              {/* Alert Error Form */}
              {errorForm && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
                  <p className="font-semibold">Perhatian:</p>
                  <p>{errorForm}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Kolom Kiri: Metadata Input */}
                <div className="space-y-4">
                  {/* Nama Internal */}
                  <div>
                    <label htmlFor="nama_internal" className="block text-sm font-semibold text-gray-700 mb-1">
                      Nama Internal <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nama_internal"
                      type="text"
                      required
                      value={namaInternal}
                      onChange={(e) => setNamaInternal(e.target.value)}
                      placeholder="Contoh: Foto Bersama Perangkat Nagari 2026"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pengenal khusus untuk admin. Tidak ditampilkan pada tampilan publik beranda.
                    </p>
                  </div>

                  {/* Teks Alternatif */}
                  <div>
                    <label htmlFor="teks_alt" className="block text-sm font-semibold text-gray-700 mb-1">
                      Teks Alternatif (Alt Text) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="teks_alt"
                      required
                      rows={3}
                      value={teksAlt}
                      onChange={(e) => setTeksAlt(e.target.value)}
                      placeholder="Jelaskan isi gambar untuk pembaca layar (contoh: Foto bersama seluruh jajaran perangkat Nagari Aia Manggih Barat)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Wajib diisi untuk aksesibilitas pembaca layar (screen reader).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Posisi Fokus Gambar */}
                    <div>
                      <label htmlFor="posisi_gambar" className="block text-sm font-semibold text-gray-700 mb-1">
                        Posisi Fokus Gambar
                      </label>
                      <select
                        id="posisi_gambar"
                        value={posisiGambar}
                        onChange={(e) => setPosisiGambar(e.target.value as PosisiGambarHero)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm bg-white"
                      >
                        {PILIHAN_POSISI_GAMBAR_HERO.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Mengatur titik fokus penyesuaian <code className="text-xs bg-gray-100 px-1 rounded">object-position</code>.
                      </p>
                    </div>

                    {/* Urutan Tampil */}
                    <div>
                      <label htmlFor="urutan" className="block text-sm font-semibold text-gray-700 mb-1">
                        Urutan Tampil
                      </label>
                      <input
                        id="urutan"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={urutan}
                        onChange={(e) => setUrutan(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Urutan terkecil tampil lebih awal (default 0).</p>
                    </div>
                  </div>

                  {/* Status Aktif */}
                  <div className="pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Aktifkan untuk Tampilan Publik</span>
                        <p className="text-xs text-gray-500">
                          Beberapa gambar aktif dapat tampil bergantian sebagai slider di beranda.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Kolom Kanan: Input File (Mode Tambah) atau Informasi (Mode Edit) + Preview */}
                <div className="space-y-4">
                  {modeForm === "tambah" ? (
                    <div>
                      <label htmlFor="input_file_gambar" className="block text-sm font-semibold text-gray-700 mb-1">
                        File Gambar Hero <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="input_file_gambar"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePilihFile}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer border border-gray-300 rounded-xl p-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: JPEG, PNG, WebP. Maksimal 10 MB (disarankan lanskap 16:9, ~2 MB).
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                      <p className="font-semibold text-sm">Mode Edit Metadata</p>
                      <p>
                        Penggantian file gambar dapat dilakukan pada tahap pengelolaan file (Tahap 05B). Mode ini hanya
                        memperbarui data teks, urutan, posisi fokus, dan status aktif.
                      </p>
                    </div>
                  )}

                  {/* Warning Performa / Orientasi Gambar */}
                  {warningGambar.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                      <p className="text-xs font-bold text-amber-900">Peringatan Kualitas &amp; Performa Gambar:</p>
                      <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
                        {warningGambar.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Container Preview Gambar */}
                  <div>
                    <span className="block text-xs font-semibold text-gray-600 mb-1">
                      Preview Tampilan Hero (Simulasi Slider)
                    </span>
                    <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-inner border border-gray-200 group">
                      {modeForm === "tambah" && previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={teksAlt || "Preview Gambar Hero"}
                          style={{
                            objectPosition: getObjectPositionHero(posisiGambar),
                          }}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : modeForm === "edit" && heroSedangDiedit ? (
                        <img
                          src={heroSedangDiedit.gambar_url}
                          alt={teksAlt || heroSedangDiedit.teks_alt}
                          style={{
                            objectPosition: getObjectPositionHero(posisiGambar),
                          }}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs p-4 text-center">
                          <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>Pilih file gambar untuk melihat preview crop hero</span>
                        </div>
                      )}

                      {/* Info Overlay Dimensi */}
                      {dimensiGambar && modeForm === "tambah" && (
                        <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">
                          Dimensi: {dimensiGambar.width} &times; {dimensiGambar.height} px
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={tutupForm}
                  disabled={loadingForm}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loadingForm ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{modeForm === "tambah" ? "Simpan Gambar Hero" : "Perbarui Metadata"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel / Lista Record Admin */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Daftar Gambar Hero Beranda ({daftarHero.length})</h2>
            <button
              type="button"
              onClick={muatDaftarHero}
              disabled={loadingData}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading State */}
          {loadingData ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <svg className="animate-spin w-8 h-8 text-amber-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm">Memuat data hero beranda...</p>
            </div>
          ) : errorData ? (
            /* Error State */
            <div className="p-12 text-center space-y-3">
              <p className="text-sm font-semibold text-red-600">{errorData}</p>
              <button
                type="button"
                onClick={muatDaftarHero}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : daftarHero.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-3 text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Belum ada gambar hero beranda yang ditambahkan.</p>
              <button
                type="button"
                onClick={bukaFormTambah}
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors"
              >
                + Tambah Gambar Sekarang
              </button>
            </div>
          ) : (
            /* Table Data */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-semibold">
                      Preview Gambar
                    </th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">
                      Nama Internal &amp; Alt Text
                    </th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">
                      Posisi Fokus
                    </th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">
                      Urutan
                    </th>
                    <th scope="col" className="px-6 py-3.5 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5 font-semibold text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {daftarHero.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Preview Gambar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-32 aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
                          <img
                            src={item.gambar_url}
                            alt={item.teks_alt}
                            loading="lazy"
                            decoding="async"
                            style={{
                              objectPosition: getObjectPositionHero(item.posisi_gambar),
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Nama Internal & Alt Text */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs space-y-1">
                          <p className="font-bold text-gray-900 text-sm truncate">{item.nama_internal}</p>
                          <p className="text-xs text-gray-500 line-clamp-2" title={item.teks_alt}>
                            <span className="font-semibold text-gray-600">Alt:</span> {item.teks_alt}
                          </p>
                        </div>
                      </td>

                      {/* Posisi Fokus */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {getLabelPosisiGambarHero(item.posisi_gambar)}
                        </span>
                      </td>

                      {/* Urutan */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {item.urutan}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Tombol Aksi */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          type="button"
                          onClick={() => bukaFormEdit(item)}
                          disabled={loadingForm}
                          aria-label={`Edit metadata ${item.nama_internal}`}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors border border-amber-200 disabled:opacity-50"
                        >
                          Edit Metadata
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
