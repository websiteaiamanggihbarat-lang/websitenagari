import { connection } from "next/server"
import { createClient } from "@supabase/supabase-js"

type KelompokUsiaPenduduk = {
  id?: string
  nama_kelompok: string
  rentang_usia: string | null
  jumlah: number
  urutan: number
}

type InformasiPenduduk = {
  id: string
  tanggal_data: string
  sumber_data: string
  jumlah_penduduk: number
  jumlah_laki_laki: number
  jumlah_perempuan: number
  jumlah_kk: number
  keterangan: string | null
  kelompok_usia: KelompokUsiaPenduduk[]
}

const DATA_PENDUDUK_CADANGAN: InformasiPenduduk = {
  id: "data-cadangan-2023",
  tanggal_data: "2023-12-31",
  sumber_data: "Data Profil Nagari Tahun 2023",
  jumlah_penduduk: 3199,
  jumlah_laki_laki: 1592,
  jumlah_perempuan: 1613,
  jumlah_kk: 969,
  keterangan: null,
  kelompok_usia: [
    {
      nama_kelompok: "0–6 Tahun",
      rentang_usia: "0–6 tahun",
      jumlah: 319,
      urutan: 1,
    },
    {
      nama_kelompok: "7–18 Tahun",
      rentang_usia: "7–18 tahun",
      jumlah: 729,
      urutan: 2,
    },
    {
      nama_kelompok: "19–34 Tahun",
      rentang_usia: "19–34 tahun",
      jumlah: 481,
      urutan: 3,
    },
    {
      nama_kelompok: "35–54 Tahun",
      rentang_usia: "35–54 tahun",
      jumlah: 917,
      urutan: 4,
    },
    {
      nama_kelompok: "55–69 Tahun",
      rentang_usia: "55–69 tahun",
      jumlah: 303,
      urutan: 5,
    },
    {
      nama_kelompok: "Dari 70 Tahun",
      rentang_usia: "70 tahun ke atas",
      jumlah: 250,
      urutan: 6,
    },
  ],
}

function formatAngka(nilai: number | null | undefined) {
  return Number(nilai || 0).toLocaleString("id-ID")
}

function formatTanggal(nilai: string | null | undefined) {
  if (!nilai) {
    return "-"
  }

  return new Date(`${nilai}T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  )
}

async function ambilInformasiPendudukAktif(): Promise<InformasiPenduduk> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Environment Supabase belum tersedia. Beranda menggunakan data cadangan."
    )

    return DATA_PENDUDUK_CADANGAN
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
     * Mengambil satu data yang:
     * 1. Sudah dipublikasikan.
     * 2. Ditandai aktif untuk Beranda.
     * 3. Paling baru berdasarkan tanggal_data.
     */
    const {
      data: informasi,
      error: informasiError,
    } = await supabase
      .from("informasi_penduduk")
      .select(`
        id,
        tanggal_data,
        sumber_data,
        jumlah_penduduk,
        jumlah_laki_laki,
        jumlah_perempuan,
        jumlah_kk,
        keterangan
      `)
      .eq(
        "status_publikasi",
        "dipublikasikan"
      )
      .eq("is_active", true)
      .order("tanggal_data", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (informasiError) {
      console.error(
        "Gagal mengambil informasi penduduk aktif:",
        informasiError.message
      )

      return DATA_PENDUDUK_CADANGAN
    }

    if (!informasi) {
      console.warn(
        "Belum ada informasi penduduk yang dipublikasikan dan aktif."
      )

      return DATA_PENDUDUK_CADANGAN
    }

    /*
     * Mengambil kelompok usia yang terhubung
     * dengan data utama tersebut.
     */
    const {
      data: kelompokUsia,
      error: kelompokError,
    } = await supabase
      .from("kelompok_usia_penduduk")
      .select(`
        id,
        nama_kelompok,
        rentang_usia,
        jumlah,
        urutan
      `)
      .eq(
        "informasi_penduduk_id",
        informasi.id
      )
      .order("urutan", {
        ascending: true,
      })

    if (kelompokError) {
      console.error(
        "Gagal mengambil kelompok usia:",
        kelompokError.message
      )
    }

    return {
      id: informasi.id,
      tanggal_data: informasi.tanggal_data,
      sumber_data: informasi.sumber_data,
      jumlah_penduduk:
        informasi.jumlah_penduduk,
      jumlah_laki_laki:
        informasi.jumlah_laki_laki,
      jumlah_perempuan:
        informasi.jumlah_perempuan,
      jumlah_kk: informasi.jumlah_kk,
      keterangan: informasi.keterangan,
      kelompok_usia: kelompokUsia || [],
    }
  } catch (error) {
    console.error(
      "Kesalahan saat membaca informasi penduduk:",
      error
    )

    return DATA_PENDUDUK_CADANGAN
  }
}

export default async function InformasiPendudukDinamis() {
  /*
   * Memastikan komponen dirender ketika ada request,
   * bukan hanya menggunakan hasil saat build.
   */
  await connection()

  const informasiPenduduk =
    await ambilInformasiPendudukAktif()

console.log("DATA INFORMASI PENDUDUK BERANDA:", {
  id: informasiPenduduk.id,
  tanggal_data: informasiPenduduk.tanggal_data,
  sumber_data: informasiPenduduk.sumber_data,
  jumlah_penduduk: informasiPenduduk.jumlah_penduduk,
})

  const kelompokUsia = [
    ...(informasiPenduduk.kelompok_usia ||
      []),
  ].sort(
    (kelompokA, kelompokB) =>
      kelompokA.urutan -
      kelompokB.urutan
  )

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 hover:border-[#c0ae86] hover:shadow-xl hover:shadow-[rgba(182,165,135,0.5)] transition-all duration-300 scroll-slide-left">
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
          Informasi Penduduk
        </h3>
      </div>

      <div className="text-gray-700 leading-relaxed space-y-4">
        {/* Ringkasan data */}
        <p>
          Berdasarkan data tanggal{" "}
          <span className="font-semibold">
            {formatTanggal(
              informasiPenduduk.tanggal_data
            )}
          </span>
          , jumlah penduduk Nagari Aia
          Manggih Barat sebanyak{" "}
          <span className="font-semibold">
            {formatAngka(
              informasiPenduduk.jumlah_penduduk
            )}{" "}
            jiwa
          </span>
          .
        </p>

        <ul className="space-y-2">
          <li>
            <span className="font-semibold">
              Jumlah KK
            </span>
            :{" "}
            {formatAngka(
              informasiPenduduk.jumlah_kk
            )}{" "}
            KK
          </li>

          <li>
            <span className="font-semibold">
              Laki-laki
            </span>
            :{" "}
            {formatAngka(
              informasiPenduduk.jumlah_laki_laki
            )}{" "}
            jiwa
          </li>

          <li>
            <span className="font-semibold">
              Perempuan
            </span>
            :{" "}
            {formatAngka(
              informasiPenduduk.jumlah_perempuan
            )}{" "}
            jiwa
          </li>

          <li>
            <span className="font-semibold">
              Sumber data
            </span>
            : {informasiPenduduk.sumber_data}
          </li>
        </ul>

        {/* Keterangan dari admin */}
        {informasiPenduduk.keterangan && (
          <div className="rounded-lg border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">
              Keterangan
            </p>

            <p className="whitespace-pre-line">
              {informasiPenduduk.keterangan}
            </p>
          </div>
        )}

        {/* Tabel kelompok usia */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="font-semibold mb-3">
            Jumlah penduduk berdasarkan kelompok
            usia pada tanggal{" "}
            {formatTanggal(
              informasiPenduduk.tanggal_data
            )}
            :
          </p>

          <div className="overflow-x-auto scroll-slide-right">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0e8db] border-b border-gray-300">
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    No.
                  </th>

                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    Kelompok Usia
                  </th>

                  <th className="px-3 py-2 text-left font-semibold text-gray-900">
                    Rentang Usia
                  </th>

                  <th className="px-3 py-2 text-center font-semibold text-gray-900">
                    Jumlah
                  </th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                {kelompokUsia.length > 0 ? (
                  kelompokUsia.map(
                    (kelompok, index) => (
                      <tr
                        key={
                          kelompok.id ||
                          `${kelompok.nama_kelompok}-${index}`
                        }
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <td className="px-3 py-2">
                          {index + 1}.
                        </td>

                        <td className="px-3 py-2 font-medium">
                          {
                            kelompok.nama_kelompok
                          }
                        </td>

                        <td className="px-3 py-2">
                          {kelompok.rentang_usia ||
                            "-"}
                        </td>

                        <td className="px-3 py-2 text-center font-semibold">
                          {formatAngka(
                            kelompok.jumlah
                          )}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-5 text-center text-gray-500"
                    >
                      Rincian kelompok usia belum
                      tersedia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}