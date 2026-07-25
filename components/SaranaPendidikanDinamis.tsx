import { connection } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { getSlugByTingkat } from "@/lib/saranaPendidikan"

type PendataanSaranaPendidikan = {
  id: string
  tahun_pendataan: number
  sumber_data: string
  keterangan: string | null
  updated_at: string | null
}

type SaranaPendidikan = {
  id: string
  pendataan_id: string
  nama_sarana: string
  tingkat_pendidikan: string
  jenis_pengelolaan: string | null
  alamat: string
  jumlah_siswa: number
  jumlah_guru: number
  status_operasional: string
  nomor_kontak: string | null
  lokasi_peta: string | null
  foto_url: string | null
  keterangan: string | null
  urutan: number
  is_active: boolean
}

type HasilDataSarana = {
  pendataan: PendataanSaranaPendidikan | null
  sarana: SaranaPendidikan[]
  error: string | null
}

const URUTAN_TINGKAT = [
  "PAUD",
  "TK",
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "SLB",
  "Lainnya",
]

function formatAngka(
  nilai: number | null | undefined
) {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function formatTanggalWaktu(
  nilai: string | null | undefined
) {
  if (!nilai) {
    return "-"
  }

  return new Date(nilai).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

async function ambilDataSaranaPendidikan(): Promise<HasilDataSarana> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      pendataan: null,
      sarana: [],
      error:
        "Konfigurasi Supabase untuk Beranda belum tersedia.",
    }
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },

      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
          }),
      },
    }
  )

  try {
    /*
     * Policy publik hanya mengizinkan data yang:
     * status_publikasi = dipublikasikan
     * is_active = true
     */
    const {
      data: dataPendataan,
      error: pendataanError,
    } = await supabase
      .from("pendataan_sarana_pendidikan")
      .select(`
        id,
        tahun_pendataan,
        sumber_data,
        keterangan,
        updated_at
      `)
      .eq("status_publikasi", "dipublikasikan")
      .eq("is_active", true)
      .order("tahun_pendataan", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (pendataanError) {
      console.error(
        "Gagal mengambil pendataan sarana pendidikan:",
        pendataanError
      )

      return {
        pendataan: null,
        sarana: [],
        error:
          pendataanError.message ||
          "Gagal mengambil pendataan sarana pendidikan.",
      }
    }

    if (!dataPendataan) {
      return {
        pendataan: null,
        sarana: [],
        error: null,
      }
    }

    const pendataan =
      dataPendataan as PendataanSaranaPendidikan

    const {
      data: dataSarana,
      error: saranaError,
    } = await supabase
      .from("sarana_pendidikan")
      .select(`
        id,
        pendataan_id,
        nama_sarana,
        tingkat_pendidikan,
        jenis_pengelolaan,
        alamat,
        jumlah_siswa,
        jumlah_guru,
        status_operasional,
        nomor_kontak,
        lokasi_peta,
        foto_url,
        keterangan,
        urutan,
        is_active
      `)
      .eq("pendataan_id", pendataan.id)
      .eq("is_active", true)
      .order("urutan", {
        ascending: true,
      })
      .order("nama_sarana", {
        ascending: true,
      })

    if (saranaError) {
      console.error(
        "Gagal mengambil daftar sarana pendidikan:",
        saranaError
      )

      return {
        pendataan,
        sarana: [],
        error:
          saranaError.message ||
          "Gagal mengambil daftar sarana pendidikan.",
      }
    }

    return {
      pendataan,
      sarana:
        (dataSarana as SaranaPendidikan[]) || [],
      error: null,
    }
  } catch (error) {
    console.error(
      "Kesalahan membaca sarana pendidikan:",
      error
    )

    return {
      pendataan: null,
      sarana: [],
      error:
        "Terjadi kesalahan saat membaca sarana pendidikan.",
    }
  }
}

export default async function SaranaPendidikanDinamis() {
  /*
   * Memastikan data dibaca ketika halaman diminta,
   * bukan hanya pada saat proses build.
   */
  await connection()

  const {
    pendataan,
    sarana,
    error,
  } = await ambilDataSaranaPendidikan()

  /*
   * Rekap hanya menghitung sarana yang
   * status operasionalnya aktif.
   */
  const saranaOperasional = sarana.filter(
    (item) =>
      item.status_operasional === "aktif"
  )

  const ringkasanTingkat = URUTAN_TINGKAT.map(
    (tingkat) => ({
      tingkat,

      jumlah: saranaOperasional.filter(
        (item) =>
          item.tingkat_pendidikan === tingkat
      ).length,
    })
  ).filter((item) => item.jumlah > 0)

  const totalSiswa = saranaOperasional.reduce(
    (total, item) =>
      total + Number(item.jumlah_siswa || 0),
    0
  )

  const totalGuru = saranaOperasional.reduce(
    (total, item) =>
      total + Number(item.jumlah_guru || 0),
    0
  )

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-right">
      {/* Judul kartu */}
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#4a3210] to-[#2c1b01] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 group-hover:scale-110 transition-transform">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
          Sarana Pendidikan
        </h3>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">
            Data sarana pendidikan belum dapat dimuat.
          </p>

          <p className="mt-1">
            {error}
          </p>
        </div>
      )}

      {/* Belum ada pendataan aktif */}
      {!error && !pendataan && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-5 text-center">
          <p className="text-sm font-semibold text-gray-700">
            Belum ada data sarana pendidikan aktif.
          </p>

          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Admin perlu memublikasikan dan mengaktifkan
            salah satu tahun pendataan.
          </p>
        </div>
      )}

      {/* Pendataan tersedia */}
      {!error && pendataan && (
        <div className="text-gray-700 leading-relaxed space-y-5">
          <div>
            <p>
              Berdasarkan pendataan tahun{" "}
              <span className="font-semibold">
                {pendataan.tahun_pendataan}
              </span>
              , Nagari Aia Manggih Barat memiliki{" "}
              <span className="font-semibold">
                {formatAngka(
                  saranaOperasional.length
                )}{" "}
                sarana pendidikan operasional
              </span>
              .
            </p>

            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="font-semibold">
                  Sumber data
                </span>
                : {pendataan.sumber_data}
              </p>

              <p className="text-xs text-gray-500">
                Terakhir diperbarui:{" "}
                {formatTanggalWaktu(
                  pendataan.updated_at
                )}
              </p>
            </div>

            {pendataan.keterangan && (
              <p className="mt-3 rounded-lg border border-gray-200 bg-white/70 p-3 text-sm whitespace-pre-line">
                {pendataan.keterangan}
              </p>
            )}
          </div>

          {/* Ringkasan utama */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#f0e8db] p-3 text-center">
              <p className="text-[11px] text-gray-500">
                Sarana
              </p>

              <p className="mt-1 text-lg font-bold text-[#2c1b01]">
                {formatAngka(
                  saranaOperasional.length
                )}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-[11px] text-gray-500">
                Siswa
              </p>

              <p className="mt-1 text-lg font-bold text-blue-700">
                {formatAngka(totalSiswa)}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-[11px] text-gray-500">
                Guru
              </p>

              <p className="mt-1 text-lg font-bold text-green-700">
                {formatAngka(totalGuru)}
              </p>
            </div>
          </div>

          {/* Rekap tingkat pendidikan */}
          <div className="border-t border-gray-200 pt-4">
            <p className="mb-3 font-semibold">
              Rekap sarana pendidikan berdasarkan tingkat:
            </p>

            {ringkasanTingkat.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                Belum ada sarana berstatus operasional aktif.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#f0e8db] border-b border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-900">
                        No.
                      </th>

                      <th className="px-3 py-2 text-left font-semibold text-gray-900">
                        Tingkat Pendidikan
                      </th>

                      <th className="px-3 py-2 text-center font-semibold text-gray-900">
                        Jumlah
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ringkasanTingkat.map((item, index) => {
                      const slug = getSlugByTingkat(item.tingkat)
                      return (
                        <tr
                          key={item.tingkat}
                          className="border-b border-gray-200 hover:bg-[#f7f2e8]/60 transition-colors group/row"
                        >
                          <td className="px-3 py-2.5">
                            {index + 1}.
                          </td>

                          <td className="px-3 py-2.5">
                            <Link
                              href={`/sarana-pendidikan/${slug}`}
                              className="font-semibold text-gray-900 group-hover/row:text-[#2c1b01] flex items-center justify-between hover:underline"
                            >
                              <span>{item.tingkat}</span>
                              <span className="text-xs text-[#5a3b0d] font-normal group-hover/row:translate-x-0.5 transition-transform">
                                Lihat daftar &rarr;
                              </span>
                            </Link>
                          </td>

                          <td className="px-3 py-2.5 text-center font-semibold">
                            <Link
                              href={`/sarana-pendidikan/${slug}`}
                              className="inline-block px-2.5 py-0.5 rounded-md bg-white border border-gray-200 text-[#2c1b01] hover:bg-[#f0e8db] hover:border-[#b6a587] transition-all"
                            >
                              {formatAngka(item.jumlah)}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tombol Utama Buka Katalog Sarana Pendidikan */}
          <div className="pt-2">
            <Link
              href="/sarana-pendidikan"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#5a3b0d] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-[#1a1200] hover:to-[#2c1b01] hover:shadow-lg"
            >
              <span>Lihat Semua Tingkat Sarana Pendidikan</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}