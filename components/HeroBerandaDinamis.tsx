import { connection } from "next/server"
import { fetchHeroBerandaAktif, getObjectPositionHero } from "@/lib/heroBeranda"
import HeroStatis from "@/components/HeroStatis"
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel"

export default async function HeroBerandaDinamis() {
  await connection()

  try {
    const listHeroAktif = await fetchHeroBerandaAktif()

    if (!listHeroAktif || listHeroAktif.length === 0) {
      // Fallback ke komponen hero statis jika belum ada gambar aktif
      return <HeroStatis />
    }

    // Map data DB ke props serializable HeroSlide untuk HeroCarousel
    const slides: HeroSlide[] = listHeroAktif.map((item) => ({
      id: item.id,
      gambarUrl: item.gambar_url,
      teksAlt: item.teks_alt,
      objectPosition: getObjectPositionHero(item.posisi_gambar),
    }))

    return <HeroCarousel slides={slides} />
  } catch (error: unknown) {
    const pesan = error instanceof Error ? error.message : "Kesalahan tidak diketahui."
    console.error("Gagal memuat hero beranda dinamis:", pesan)

    // Fallback seamless ke HeroStatis jika query server mengalami error
    return <HeroStatis />
  }
}
