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

export type CleanupHeroTertunda = {
  id: string
  heroId: string
  namaInternal: string
  bucket: string
  storagePath: string
  pesan: string
}

export type HasilHapusFile = {
  berhasil: boolean
  sudahTidakAda: boolean
  pesan: string | null
}

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
 * Validasi struktur storage path internal hero beranda
 */
function isStoragePathValidForHero(heroId: string, path: string): boolean {
  if (
    !path ||
    !path.trim() ||
    path.startsWith("/") ||
    path.includes("../") ||
    path.includes("..\\") ||
    path.includes("\\")
  ) {
    return false
  }
  const parts = path.split("/")
  if (parts.length < 4) return false
  if (parts[0] !== "hero-beranda") return false
  if (parts[1] !== heroId) return false
  if (parts[2] !== "gambar") return false
  const filename = parts.slice(3).join("/")
  if (!filename || !filename.trim() || filename.includes("/")) return false
  return true
}

/**
 * Helper internal untuk membersihkan file baru di Storage jika insert/update DB gagal (Rollback)
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

/**
 * Helper internal idempotent untuk memeriksa keberadaan satu file lalu menghapusnya secara aman
 */
async function hapusFileJikaAda(
  heroId: string,
  storagePath: string
): Promise<HasilHapusFile> {
  if (!isStoragePathValidForHero(heroId, storagePath)) {
    return { berhasil: false, sudahTidakAda: false, pesan: "Format storage path tidak valid." }
  }

  const parts = storagePath.split("/")
  const folderPath = parts.slice(0, 3).join("/")
  const filename = parts.slice(3).join("/")

  try {
    const { data: listData, error: listError } = await supabase.storage
      .from(BUCKET_GAMBAR_HERO_BERANDA)
      .list(folderPath, { limit: 1000 })

    if (listError) {
      return { berhasil: false, sudahTidakAda: false, pesan: listError.message }
    }

    const fileFound = listData?.some((item) => item.name === filename)

    if (!fileFound) {
      return { berhasil: true, sudahTidakAda: true, pesan: null }
    }

    const { error: removeError } = await supabase.storage
      .from(BUCKET_GAMBAR_HERO_BERANDA)
      .remove([storagePath])

    if (removeError) {
      return { berhasil: false, sudahTidakAda: false, pesan: removeError.message }
    }

    return { berhasil: true, sudahTidakAda: false, pesan: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { berhasil: false, sudahTidakAda: false, pesan: msg }
  }
}

/**
 * Helper internal untuk membersihkan seluruh isi folder satu record hero secara aman
 */
async function bersihkanFolderHero(heroId: string): Promise<{ berhasil: boolean; pesan: string | null }> {
  if (!heroId || !heroId.trim()) {
    return { berhasil: false, pesan: "Hero ID tidak valid." }
  }

  const folderPath = `hero-beranda/${heroId}/gambar`

  try {
    const { data: listData, error: listError } = await supabase.storage
      .from(BUCKET_GAMBAR_HERO_BERANDA)
      .list(folderPath, { limit: 1000 })

    if (listError) {
      return { berhasil: false, pesan: listError.message }
    }

    if (!listData || listData.length === 0) {
      return { berhasil: true, pesan: null }
    }

    const fullPaths = listData
      .filter((item) => item.name && !item.name.includes("/"))
      .map((item) => `${folderPath}/${item.name}`)

    if (fullPaths.length === 0) {
      return { berhasil: true, pesan: null }
    }

    const { error: removeError } = await supabase.storage
      .from(BUCKET_GAMBAR_HERO_BERANDA)
      .remove(fullPaths)

    if (removeError) {
      return { berhasil: false, pesan: removeError.message }
    }

    // Verifikasi ulang list folder
    const { data: verifyList, error: verifyError } = await supabase.storage
      .from(BUCKET_GAMBAR_HERO_BERANDA)
      .list(folderPath, { limit: 1000 })

    if (verifyError) {
      return { berhasil: false, pesan: verifyError.message }
    }

    if (verifyList && verifyList.length > 0) {
      return { berhasil: false, pesan: "Beberapa file pada folder hero belum berhasil dibersihkan." }
    }

    return { berhasil: true, pesan: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { berhasil: false, pesan: msg }
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
  const [posisiGambar, setPosisiGambar] = useState<PosisiGambarHero>("center")

  // State File & Preview Lokal
  const [fileGambar, setFileGambar] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dimensiGambar, setDimensiGambar] = useState<{ width: number; height: number } | null>(null)
  const [warningGambar, setWarningGambar] = useState<string[]>([])

  // State Proses per Record (Tahap 05B)
  const [processingToggleId, setProcessingToggleId] = useState<string | null>(null)
  const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(null)
  const [processingCleanupId, setProcessingCleanupId] = useState<string | null>(null)
  const [retryDeleteIds, setRetryDeleteIds] = useState<string[]>([])
  const [cleanupTertunda, setCleanupTertunda] = useState<CleanupHeroTertunda[]>([])
  const [previewGambarErrorIds, setPreviewGambarErrorIds] = useState<string[]>([])

  // Ref Race Condition Guard & Custom File Input Ref
  const activeObjectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // State Feedback Form
  const [loadingForm, setLoadingForm] = useState<boolean>(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [pesanSuksesForm, setPesanSuksesForm] = useState<string | null>(null)

  // Helper Terpusat Tambah/Update Cleanup Item (Deduplikasi)
  const tambahCleanupTertunda = useCallback((newItem: CleanupHeroTertunda) => {
    setCleanupTertunda((prev) => {
      const index = prev.findIndex(
        (c) => c.bucket === newItem.bucket && c.storagePath === newItem.storagePath
      )
      if (index !== -1) {
        const copy = [...prev]
        copy[index] = { ...copy[index], pesan: newItem.pesan }
        return copy
      }
      return [...prev, newItem]
    })
  }, [])

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
      setPreviewGambarErrorIds([])
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

  // Auto dismiss success toast message after 4000ms
  useEffect(() => {
    if (!pesanSuksesForm) return
    const timerId = window.setTimeout(() => {
      setPesanSuksesForm(null)
    }, 4000)
    return () => window.clearTimeout(timerId)
  }, [pesanSuksesForm])

  // Reset & Buka Form Tambah
  const bukaFormTambah = () => {
    bersihkanPreviewLokal()
    setModeForm("tambah")
    setHeroSedangDiedit(null)
    setNamaInternal("")
    setPosisiGambar("center")
    setFileGambar(null)
    setDimensiGambar(null)
    setWarningGambar([])
    setErrorForm(null)
    setPesanSuksesForm(null)
    setFormTerbuka(true)
  }

  // Buka Form Edit Metadata & Gambar
  const bukaFormEdit = (item: HeroBeranda) => {
    bersihkanPreviewLokal()
    setModeForm("edit")
    setHeroSedangDiedit(item)
    setNamaInternal(item.nama_internal)
    setPosisiGambar(item.posisi_gambar)
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

  // Handler Pilih File Gambar (Mode Tambah & Mode Edit Replace)
  const handlePilihFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorForm(null)
    setWarningGambar([])

    // Validasi Tipe MIME
    if (!file.type || !MIME_GAMBAR_HERO.includes(file.type as typeof MIME_GAMBAR_HERO[number])) {
      setErrorForm("Format file tidak didukung. Harap pilih gambar berformat JPEG, PNG, atau WebP.")
      bersihkanPreviewLokal()
      setFileGambar(null)
      setDimensiGambar(null)
      e.target.value = ""
      return
    }

    // Validasi Ukuran Maksimal (10 MB)
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

    bersihkanPreviewLokal()

    const newUrl = URL.createObjectURL(file)
    activeObjectUrlRef.current = newUrl
    setPreviewUrl(newUrl)
    setFileGambar(file)

    const img = new Image()
    img.onload = () => {
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

  // Batalkan File Pengganti pada Mode Edit
  const handleBatalkanFilePengganti = () => {
    bersihkanPreviewLokal()
    setFileGambar(null)
    setDimensiGambar(null)
    setWarningGambar([])
  }

  // Submit Handler: Safe Create, Safe Edit Metadata, & Safe Replace Gambar
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadingForm) return

    setErrorForm(null)
    setPesanSuksesForm(null)

    // Validasi Metadata Runtime
    const namaTrim = namaInternal.trim()
    const altTrim = namaTrim

    if (!namaTrim) {
      setErrorForm("Nama internal wajib diisi.")
      return
    }
    if (!isPosisiGambarHero(posisiGambar)) {
      setErrorForm("Nilai posisi fokus gambar tidak valid.")
      return
    }

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
          let infoRollback = ""
          if (rollbackRes.berhasil) {
            infoRollback = " File yang sempat diunggah telah dibersihkan."
          } else {
            infoRollback = ` File yang sempat diunggah belum berhasil dibersihkan (${storagePath}).`
            tambahCleanupTertunda({
              id: crypto.randomUUID(),
              heroId: heroId,
              namaInternal: namaTrim,
              bucket: BUCKET_GAMBAR_HERO_BERANDA,
              storagePath: storagePath,
              pesan: rollbackRes.error ?? "Rollback file baru gagal.",
            })
          }

          setErrorForm(`Public URL gambar yang dihasilkan tidak valid.${infoRollback}`)
          setLoadingForm(false)
          return
        }

        // 3. Insert Record Database (is_active default true)
        const { error: dbError } = await supabase.from("hero_beranda").insert({
          id: heroId,
          nama_internal: namaTrim,
          gambar_url: publicUrl,
          gambar_storage_path: storagePath,
          teks_alt: altTrim,
          posisi_gambar: posisiGambar,
          is_active: true,
          urutan: 0,
        })

        // 4. Rollback jika DB Insert Gagal
        if (dbError) {
          const rollbackRes = await hapusFileBaruSetelahGagal(storagePath)
          let infoRollback = ""
          if (rollbackRes.berhasil) {
            infoRollback = " File yang sempat diunggah telah dibersihkan."
          } else {
            infoRollback = ` File yang sempat diunggah belum berhasil dibersihkan (Storage Path: ${storagePath}).`
            tambahCleanupTertunda({
              id: crypto.randomUUID(),
              heroId: heroId,
              namaInternal: namaTrim,
              bucket: BUCKET_GAMBAR_HERO_BERANDA,
              storagePath: storagePath,
              pesan: rollbackRes.error ?? "Rollback file baru setelah DB insert gagal.",
            })
          }

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

    // MODE EDIT (Metadata Only atau Safe Replace Gambar)
    else if (modeForm === "edit") {
      if (!heroSedangDiedit) {
        setErrorForm("Data hero yang akan diedit tidak ditemukan.")
        return
      }

      setLoadingForm(true)

      // KASUS A: Safe Edit Metadata Saja (fileGambar === null)
      if (!fileGambar) {
        try {
          const { error: updateError } = await supabase
            .from("hero_beranda")
            .update({
              nama_internal: namaTrim,
              teks_alt: altTrim,
              posisi_gambar: posisiGambar,
            })
            .eq("id", heroSedangDiedit.id)

          if (updateError) {
            setErrorForm(`Metadata hero gagal diperbarui: ${updateError.message}`)
            setLoadingForm(false)
            return
          }

          setPesanSuksesForm("Data hero berhasil diperbarui.")
          setFormTerbuka(false)
          await muatDaftarHero()
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          setErrorForm(`Terjadi kesalahan tidak terduga saat memperbarui metadata: ${msg}`)
        } finally {
          setLoadingForm(false)
        }
      }

      // KASUS B: Safe Replace Gambar (fileGambar !== null)
      else {
        const heroId = heroSedangDiedit.id
        const gambarStoragePathLama = heroSedangDiedit.gambar_storage_path

        const randomSuffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8)
        const timestamp = Date.now()
        const namaAman = buatNamaFileAman(fileGambar)
        const storagePathBaru = `hero-beranda/${heroId}/gambar/${timestamp}-${randomSuffix}-${namaAman}`

        try {
          // 1. Upload Gambar Baru ke Storage (upsert: false)
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_GAMBAR_HERO_BERANDA)
            .upload(storagePathBaru, fileGambar, {
              contentType: fileGambar.type,
              upsert: false,
            })

          if (uploadError) {
            setErrorForm(`Gambar baru gagal diunggah: ${uploadError.message}. Gambar lama tidak diubah.`)
            setLoadingForm(false)
            return
          }

          // 2. Ambil Public URL Gambar Baru & Validasi HTTPS
          const {
            data: { publicUrl: publicUrlBaru },
          } = supabase.storage.from(BUCKET_GAMBAR_HERO_BERANDA).getPublicUrl(storagePathBaru)

          let isHttpsUrl = false
          try {
            const parsedUrl = new URL(publicUrlBaru)
            isHttpsUrl = parsedUrl.protocol === "https:"
          } catch {
            isHttpsUrl = false
          }

          if (!publicUrlBaru || !isHttpsUrl) {
            const rollbackRes = await hapusFileBaruSetelahGagal(storagePathBaru)
            let infoRollback = ""
            if (rollbackRes.berhasil) {
              infoRollback = " File pengganti yang sempat diunggah telah dibersihkan."
            } else {
              infoRollback = ` File pengganti yang sempat diunggah belum berhasil dibersihkan (${storagePathBaru}).`
              tambahCleanupTertunda({
                id: crypto.randomUUID(),
                heroId: heroId,
                namaInternal: namaTrim,
                bucket: BUCKET_GAMBAR_HERO_BERANDA,
                storagePath: storagePathBaru,
                pesan: rollbackRes.error ?? "Rollback file baru setelah URL invalid gagal.",
              })
            }

            setErrorForm(`Public URL gambar baru yang dihasilkan tidak valid.${infoRollback}`)
            setLoadingForm(false)
            return
          }

          // 3. Update Database ke Gambar Baru & Metadata
          const { error: updateDbError } = await supabase
            .from("hero_beranda")
            .update({
              nama_internal: namaTrim,
              teks_alt: altTrim,
              posisi_gambar: posisiGambar,
              gambar_url: publicUrlBaru,
              gambar_storage_path: storagePathBaru,
            })
            .eq("id", heroId)
            .eq("id", heroId)

          // 4. Rollback Gambar Baru jika DB Update Gagal
          if (updateDbError) {
            const rollbackRes = await hapusFileBaruSetelahGagal(storagePathBaru)
            let infoRollback = ""
            if (rollbackRes.berhasil) {
              infoRollback = " File pengganti telah dibersihkan."
            } else {
              infoRollback = ` File pengganti belum berhasil dibersihkan (${storagePathBaru}).`
              tambahCleanupTertunda({
                id: crypto.randomUUID(),
                heroId: heroId,
                namaInternal: namaTrim,
                bucket: BUCKET_GAMBAR_HERO_BERANDA,
                storagePath: storagePathBaru,
                pesan: rollbackRes.error ?? "Rollback file baru setelah DB update gagal.",
              })
            }

            setErrorForm(`Gagal memperbarui database dengan gambar baru: ${updateDbError.message}.${infoRollback}`)
            setLoadingForm(false)
            return
          }

          // 5. DB Update Sukses! Sekarang coba hapus gambar lama
          const hasilHapusLama = await hapusFileJikaAda(heroId, gambarStoragePathLama)

          if (hasilHapusLama.berhasil) {
            setPesanSuksesForm("Gambar dan metadata hero berhasil diperbarui.")
          } else {
            tambahCleanupTertunda({
              id: crypto.randomUUID(),
              heroId: heroId,
              namaInternal: namaTrim,
              bucket: BUCKET_GAMBAR_HERO_BERANDA,
              storagePath: gambarStoragePathLama,
              pesan: hasilHapusLama.pesan ?? "Gambar lama belum berhasil dibersihkan dari Storage.",
            })
            setPesanSuksesForm(
              "Gambar baru dan metadata berhasil diperbarui. Namun file gambar lama belum berhasil dibersihkan dari Storage."
            )
          }

          bersihkanPreviewLokal()
          setFormTerbuka(false)
          await muatDaftarHero()
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          setErrorForm(`Terjadi kesalahan tidak terduga saat mengganti gambar: ${msg}`)
        } finally {
          setLoadingForm(false)
        }
      }
    }
  }

  // Quick Toggle Status Aktif / Nonaktif (Tahap 05B)
  const handleQuickToggle = async (item: HeroBeranda) => {
    if (processingToggleId || processingDeleteId || loadingForm) return

    setProcessingToggleId(item.id)
    setErrorData(null)
    setPesanSuksesForm(null)

    const statusBaru = !item.is_active

    try {
      const { error: updateError } = await supabase
        .from("hero_beranda")
        .update({ is_active: statusBaru })
        .eq("id", item.id)

      if (updateError) {
        setErrorData(`Gagal memperbarui status publikasi: ${updateError.message}`)
        return
      }

      setPesanSuksesForm(
        `Status gambar '${item.nama_internal}' berhasil diubah menjadi ${statusBaru ? "Aktif" : "Nonaktif"}.`
      )
      await muatDaftarHero()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorData(`Terjadi kesalahan saat mengubah status publikasi: ${msg}`)
    } finally {
      setProcessingToggleId(null)
    }
  }

  // Safe Delete Flow (Tahap 05B)
  const handleSafeDelete = async (item: HeroBeranda) => {
    if (processingDeleteId || processingToggleId || loadingForm) return

    const isRetry = retryDeleteIds.includes(item.id)
    const confirmMessage = isRetry
      ? `Coba lagi menghapus gambar hero '${item.nama_internal}'? File Storage dan record database akan dibersihkan ulang.`
      : `Hapus gambar hero '${item.nama_internal}'? Gambar akan dinonaktifkan terlebih dahulu, kemudian file Storage dan record database akan dihapus.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setProcessingDeleteId(item.id)
    setErrorData(null)
    setPesanSuksesForm(null)

    const heroId = item.id

    try {
      // 1. Set is_active = false terlebih dahulu di DB
      const { error: deactivateError } = await supabase
        .from("hero_beranda")
        .update({ is_active: false })
        .eq("id", heroId)

      if (deactivateError) {
        setErrorData(`Gagal menonaktifkan gambar sebelum penghapusan: ${deactivateError.message}`)
        return
      }

      // 2. Bersihkan seluruh file di folder hero-beranda/{heroId}/gambar
      const hasilFolder = await bersihkanFolderHero(heroId)

      if (!hasilFolder.berhasil) {
        if (!retryDeleteIds.includes(heroId)) {
          setRetryDeleteIds((prev) => [...prev, heroId])
        }
        setErrorData(
          `Gambar telah dinonaktifkan, tetapi file Storage belum berhasil dibersihkan (${hasilFolder.pesan ?? "Error Storage"}). Gunakan tombol Retry Hapus.`
        )
        await muatDaftarHero()
        return
      }

      // 3. Storage sudah bersih! Hapus record dari database
      const { error: dbDeleteError } = await supabase
        .from("hero_beranda")
        .delete()
        .eq("id", heroId)

      if (dbDeleteError) {
        if (!retryDeleteIds.includes(heroId)) {
          setRetryDeleteIds((prev) => [...prev, heroId])
        }
        setErrorData(
          `File Storage sudah dibersihkan, tetapi record database belum berhasil dihapus (${dbDeleteError.message}). Gunakan tombol Retry Hapus.`
        )
        await muatDaftarHero()
        return
      }

      // Sukses Safe Delete Penuh
      setRetryDeleteIds((prev) => prev.filter((id) => id !== heroId))
      setPesanSuksesForm(`Gambar hero '${item.nama_internal}' berhasil dihapus secara permanen.`)
      await muatDaftarHero()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorData(`Terjadi kesalahan saat menghapus gambar hero: ${msg}`)
    } finally {
      setProcessingDeleteId(null)
    }
  }

  // Retry Cleanup Item Tertunda dari Safe Replace
  const handleRetryCleanupItem = async (item: CleanupHeroTertunda) => {
    if (processingCleanupId) return

    setProcessingCleanupId(item.id)
    setErrorData(null)

    try {
      const hasil = await hapusFileJikaAda(item.heroId, item.storagePath)

      if (hasil.berhasil) {
        setCleanupTertunda((prev) => prev.filter((c) => c.id !== item.id))
        setPesanSuksesForm(`File Storage tertunda (${item.storagePath}) berhasil dibersihkan.`)
      } else {
        setCleanupTertunda((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, pesan: hasil.pesan ?? "Pembersihan ulang gagal." } : c))
        )
        setErrorData(`Pembersihan file tertunda gagal: ${hasil.pesan}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorData(`Terjadi kesalahan saat mencoba membersihkan file tertunda: ${msg}`)
    } finally {
      setProcessingCleanupId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] pb-16">
      {/* Top Header Navigation (Cokelat Gelap khas Admin) */}
      <div className="bg-[#2c1b01] text-white shadow-md mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
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
                Kelola Hero Beranda
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/80">
                Tambah dan atur gambar utama yang tampil bergantian pada beranda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!formTerbuka && (
              <button
                type="button"
                onClick={bukaFormTambah}
                disabled={loadingForm}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
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
                Tambah Gambar
              </button>
            )}

            <Link
              href="/auth/signout"
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
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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

        {/* Section UI Pembersihan File Storage Tertunda (Tahap 05B) */}
        {cleanupTertunda.length > 0 && (
          <div className="mb-8 bg-amber-50/90 border border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h2 className="text-base font-bold text-amber-900">Pembersihan File Storage Tertunda ({cleanupTertunda.length})</h2>
                <p className="text-xs text-amber-800">
                  Beberapa file gambar lama belum berhasil dibersihkan dari Storage setelah penggantian gambar.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {cleanupTertunda.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-gray-700"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900">{item.namaInternal}</p>
                    <p className="font-mono text-gray-500 break-all">Path: {item.storagePath}</p>
                    <p className="text-amber-700">{item.pesan}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRetryCleanupItem(item)}
                    disabled={processingCleanupId === item.id}
                    aria-label={`Coba bersihkan file ${item.namaInternal}`}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-sm transition-colors shrink-0 disabled:opacity-50"
                  >
                    {processingCleanupId === item.id ? "Membersihkan..." : "Coba Bersihkan Lagi"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Modal / Collapsible */}
        {formTerbuka && (
          <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            {/* Header Krem Section */}
            <div className="bg-[#f7f2e8] p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2c1b01]">
                {modeForm === "tambah" ? "Tambah Gambar Hero Beranda Baru" : "Edit Gambar Hero Beranda"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {modeForm === "tambah"
                  ? "Lengkapi nama internal, posisi fokus, dan foto gambar hero."
                  : "Ubah nama internal, posisi fokus, atau foto gambar hero."}
              </p>
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
                {/* Kolom Kiri: Input Fields */}
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white"
                    />
                  </div>

                  {/* Posisi Fokus Gambar */}
                  <div>
                    <label htmlFor="posisi_gambar" className="block text-sm font-semibold text-gray-700 mb-1">
                      Posisi Fokus Gambar
                    </label>
                    <select
                      id="posisi_gambar"
                      value={posisiGambar}
                      onChange={(e) => setPosisiGambar(e.target.value as PosisiGambarHero)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#6b4b1d] focus:outline-none focus:ring-1 focus:ring-[#6b4b1d] bg-white cursor-pointer"
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
                </div>

                {/* Kolom Kanan: Custom File Input & Preview */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {modeForm === "tambah" ? (
                        <>File Gambar Hero <span className="text-red-500">*</span></>
                      ) : (
                        <>Ganti Gambar Hero <span className="text-xs font-normal text-gray-500">(Opsional)</span></>
                      )}
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePilihFile}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Tambahkan Foto</span>
                      </button>

                      {fileGambar && (
                        <span className="text-xs font-semibold text-green-700 truncate max-w-xs">
                          {fileGambar.name}
                        </span>
                      )}

                      {modeForm === "edit" && fileGambar && (
                        <button
                          type="button"
                          onClick={handleBatalkanFilePengganti}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>

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
                    <div className="flex items-center justify-between mb-1">
                      <span className="block text-xs font-semibold text-gray-600">
                        Preview Tampilan Hero (Simulasi Slider)
                      </span>
                      {modeForm === "edit" && fileGambar && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          Preview Gambar Baru
                        </span>
                      )}
                    </div>
                    <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-inner border border-gray-200 group">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={namaInternal || "Preview Gambar Hero"}
                          style={{
                            objectPosition: getObjectPositionHero(posisiGambar),
                          }}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : modeForm === "edit" && heroSedangDiedit ? (
                        <img
                          src={heroSedangDiedit.gambar_url}
                          alt={heroSedangDiedit.nama_internal}
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
                      {dimensiGambar && (
                        <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">
                          Dimensi: {dimensiGambar.width} &times; {dimensiGambar.height} px
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Batal & Simpan Perubahan Cokelat Tua) */}
              <div className="pt-4 border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={tutupForm}
                  disabled={loadingForm}
                  className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#2c1b01] hover:bg-[#6b4b1d] px-5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  {loadingForm ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel / Lista Record Admin */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-[#2c1b01]">
              Daftar Gambar Hero Beranda
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Menampilkan seluruh gambar hero beranda Nagari.
            </p>
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
              <p className="text-sm font-semibold text-gray-700">Belum ada gambar hero beranda yang ditambahkan.</p>
            </div>
          ) : (
            /* Table Data */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[35%]" />
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead className="bg-[#f7f2e8] text-xs uppercase tracking-wider text-[#2c1b01] border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold text-left">
                      PREVIEW GAMBAR
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-left">
                      NAMA INTERNAL
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-left">
                      POSISI FOKUS
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-right">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {daftarHero.map((item) => {
                    const isPreviewError = previewGambarErrorIds.includes(item.id)
                    const isToggleLoading = processingToggleId === item.id
                    const isDeleteLoading = processingDeleteId === item.id
                    const isRetry = retryDeleteIds.includes(item.id)

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Preview Gambar */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-32 aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-200 shadow-xs relative">
                            {isPreviewError ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 text-[10px] p-2 text-center">
                                Preview gagal dimuat
                              </div>
                            ) : (
                              <img
                                src={item.gambar_url}
                                alt={item.teks_alt || item.nama_internal}
                                loading="lazy"
                                decoding="async"
                                onError={() => setPreviewGambarErrorIds((prev) => [...prev, item.id])}
                                style={{
                                  objectPosition: getObjectPositionHero(item.posisi_gambar),
                                }}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </td>

                        {/* Nama Internal */}
                        <td className="px-6 py-4 text-gray-900 align-middle">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {item.nama_internal}
                          </p>
                        </td>

                        {/* Posisi Fokus */}
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {getLabelPosisiGambarHero(item.posisi_gambar)}
                          </span>
                        </td>

                        {/* Tombol Aksi (Sejajar Horizontal) */}
                        <td className="px-6 py-4 whitespace-nowrap text-right align-middle">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => bukaFormEdit(item)}
                              disabled={loadingForm || isToggleLoading || isDeleteLoading}
                              aria-label={`Edit metadata ${item.nama_internal}`}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              Edit
                            </button>

                            {/* Tombol Quick Toggle Status (Aktifkan / Nonaktifkan) */}
                            <button
                              type="button"
                              onClick={() => handleQuickToggle(item)}
                              disabled={loadingForm || isToggleLoading || isDeleteLoading}
                              aria-label={`${item.is_active ? "Nonaktifkan" : "Aktifkan"} ${item.nama_internal}`}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap ${
                                item.is_active
                                  ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {isToggleLoading ? (
                                item.is_active ? "Menonaktifkan..." : "Mengaktifkan..."
                              ) : item.is_active ? (
                                "Nonaktifkan"
                              ) : (
                                "Aktifkan"
                              )}
                            </button>

                            {/* Tombol Hapus / Retry Hapus */}
                            <button
                              type="button"
                              onClick={() => handleSafeDelete(item)}
                              disabled={loadingForm || isToggleLoading || isDeleteLoading}
                              aria-label={`${isRetry ? "Retry hapus" : "Hapus"} ${item.nama_internal}`}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap ${
                                isRetry
                                  ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              {isDeleteLoading ? "Menghapus..." : isRetry ? "Retry Hapus" : "Hapus"}
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
      </main>
    </div>
  )
}
