import { connection } from "next/server"
import { fetchPetaNagariAktif, getLabelJenisPeta } from "@/lib/petaNagari"
import PetaNagariStatis from "@/components/PetaNagari"
import PetaCarousel, { PetaSlide } from "@/components/PetaCarousel"

export const dynamic = "force-dynamic"

export default async function PetaNagariDinamis() {
  await connection()

  try {
    const listPetaAktif = await fetchPetaNagariAktif()

    if (!listPetaAktif || listPetaAktif.length === 0) {
      // Fallback ke komponen statis sementara jika belum ada data aktif di DB
      return <PetaNagariStatis />
    }

    // Petakan data DB ke props serializable untuk PetaCarousel
    const slides: PetaSlide[] = listPetaAktif.map((item) => ({
      id: item.id,
      judul: item.judul_peta,
      jenis: item.jenis_peta,
      labelJenis: getLabelJenisPeta(item.jenis_peta),
      deskripsi: item.deskripsi,
      tahun: item.tahun_peta,
      sumber: item.sumber_peta,
      gambarUrl: item.gambar_url,
      teksAlt: item.teks_alt,
      fileUrl: item.file_url,
    }))

    return <PetaCarousel slides={slides} />
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Gagal memuat peta nagari dinamis di server:", msg)

    return (
      <div className="space-y-3">
        <PetaNagariStatis />
        <p className="text-center text-xs text-amber-800 font-medium">
          Peta dinamis sementara belum dapat dimuat.
        </p>
      </div>
    )
  }
}
