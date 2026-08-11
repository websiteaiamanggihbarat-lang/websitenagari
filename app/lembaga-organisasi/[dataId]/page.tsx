import { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { fetchDetailLembagaOrganisasiPublik } from "@/lib/lembagaOrganisasi"
import DetailLembagaOrganisasiDinamis from "@/components/DetailLembagaOrganisasiDinamis"

type PageProps = {
  params: Promise<{
    dataId: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const dataId = resolvedParams?.dataId || ""

  if (!dataId) {
    return {
      title: "Lembaga/Organisasi Tidak Ditemukan — Nagari Aia Manggih Barat",
    }
  }

  const detail = await fetchDetailLembagaOrganisasiPublik(dataId)
  if (!detail) {
    return {
      title: "Lembaga/Organisasi Tidak Ditemukan — Nagari Aia Manggih Barat",
    }
  }

  return {
    title: `${detail.nama} — Lembaga dan Organisasi Nagari`,
    description:
      detail.deskripsi.slice(0, 160) ||
      `Profil dan rincian ${detail.nama} di Nagari Aia Manggih Barat.`,
  }
}

export default async function DetailLembagaOrganisasiPage({ params }: PageProps) {
  await connection()

  const resolvedParams = await params
  const dataId = resolvedParams?.dataId || ""

  if (!dataId) {
    notFound()
  }

  const detail = await fetchDetailLembagaOrganisasiPublik(dataId)

  if (!detail) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937]">
      <div className="pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <DetailLembagaOrganisasiDinamis detail={detail} />
        </div>
      </div>
    </div>
  )
}
