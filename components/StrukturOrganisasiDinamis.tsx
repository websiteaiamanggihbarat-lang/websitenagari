"use client"

import { useState } from "react"
import {
  STRUKTUR_ORGANISASI_SLOT_KEYS,
  type StrukturOrganisasiPublik,
  type StrukturOrganisasiSlotKey,
} from "@/lib/strukturOrganisasi"

type StrukturOrganisasiDinamisProps = {
  data: StrukturOrganisasiPublik[]
}

type PosisiDesktop = {
  cx: number
  cy: number
  width: number
  height: number
}

const VIEWBOX_W = 1200
const VIEWBOX_H = 760
const CONNECTOR_CLEARANCE = 10

// Geometri Node Desktop (cx Sekretaris diset ke midpoint Kaur Umum 725 & Kaur Keuangan 1005 = 865)
const POSISI_DESKTOP: Record<StrukturOrganisasiSlotKey, PosisiDesktop> = {
  wali_nagari: { cx: 585, cy: 56, width: 230, height: 54 },
  sekretaris_nagari: { cx: 865, cy: 155, width: 230, height: 54 },
  kasi_pemerintahan: { cx: 175, cy: 260, width: 215, height: 54 },
  kasi_kesra_pelayanan: { cx: 450, cy: 260, width: 225, height: 54 },
  staf_pemerintahan: { cx: 175, cy: 360, width: 215, height: 54 },
  staf_kesra_pelayanan: { cx: 450, cy: 360, width: 225, height: 54 },
  petugas_data: { cx: 175, cy: 460, width: 215, height: 54 },
  petugas_keagamaan: { cx: 450, cy: 460, width: 225, height: 54 },
  kaur_umum: { cx: 725, cy: 260, width: 200, height: 54 },
  kaur_keuangan: { cx: 1005, cy: 260, width: 210, height: 54 },
  staf_kaur_umum: { cx: 725, cy: 360, width: 200, height: 54 },
  staf_kaur_keuangan: { cx: 1005, cy: 360, width: 210, height: 54 },
  staf_kebersihan: { cx: 715, cy: 475, width: 200, height: 54 },
  staf_keamanan: { cx: 980, cy: 475, width: 200, height: 54 },
  ka_jorong_padang_sarai: { cx: 390, cy: 665, width: 275, height: 54 },
  ka_jorong_kp_padang_paraman_dareh: { cx: 780, cy: 665, width: 310, height: 54 },
} as const satisfies Record<StrukturOrganisasiSlotKey, PosisiDesktop>

export default function StrukturOrganisasiDinamis({
  data,
}: StrukturOrganisasiDinamisProps) {
  // Map failed URL per slot_key -> tahan terhadap perubahan foto_url baru
  const [failedUrlBySlot, setFailedUrlBySlot] = useState<
    Map<StrukturOrganisasiSlotKey, string>
  >(() => new Map())

  const handleImageError = (
    slotKey: StrukturOrganisasiSlotKey,
    fotoUrl: string
  ) => {
    setFailedUrlBySlot((prev) => {
      const next = new Map(prev)
      next.set(slotKey, fotoUrl)
      return next
    })
  }

  // Validasi Defensif Data Props
  const isDataValid =
    Array.isArray(data) &&
    data.length === 16 &&
    new Set(data.map((d) => d.slot_key)).size === 16 &&
    data.every(
      (d) =>
        (STRUKTUR_ORGANISASI_SLOT_KEYS as readonly string[]).includes(d.slot_key)
    )

  if (!isDataValid) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-sm">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-3 text-base font-semibold text-red-900">
          Struktur organisasi belum dapat ditampilkan.
        </p>
      </div>
    )
  }

  // Buat map berdasarkan slot_key
  const itemBySlot = new Map<
    StrukturOrganisasiSlotKey,
    StrukturOrganisasiPublik
  >()
  data.forEach((item) => {
    itemBySlot.set(item.slot_key, item)
  })

  if (itemBySlot.size !== 16) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-red-900">
          Struktur organisasi belum dapat ditampilkan.
        </p>
      </div>
    )
  }

  // Render Kartu Pejabat Pill Horizontal Mengikuti Tema Admin Existing
  const renderKartu = (
    slotKey: StrukturOrganisasiSlotKey,
    isDesktop = false
  ) => {
    const item = itemBySlot.get(slotKey)
    if (!item) return null

    const failedUrl = failedUrlBySlot.get(slotKey)
    const isFotoFailed = item.foto_url !== null && failedUrl === item.foto_url
    const hasFoto = Boolean(item.foto_url && !isFotoFailed)
    const namaPejabat = item.nama_pejabat ?? "Belum ditetapkan"
    const isPimpinan = item.slot_key === "wali_nagari"

    return (
      <article
        key={slotKey}
        className={`relative z-20 flex items-center rounded-full border shadow-sm transition-all duration-200 ${
          isPimpinan
            ? "bg-amber-50/90 border-amber-600/50 ring-2 ring-amber-500/20 shadow-md"
            : "bg-white border-gray-200 hover:border-amber-700/30 hover:shadow-md"
        } ${isDesktop ? "h-[54px]" : "h-[58px] w-full"}`}
      >
        {/* Foto Pejabat Lingkaran di Sisi Kiri Pill (z-30) */}
        <div
          className={`absolute left-[-8px] top-1/2 -translate-y-1/2 rounded-full border-2 border-amber-800/20 bg-amber-50 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 z-30 ${
            isPimpinan
              ? "w-[56px] h-[56px] border-amber-600/60 ring-2 ring-amber-600/30"
              : "w-[50px] h-[50px]"
          }`}
        >
          {hasFoto ? (
            <img
              src={item.foto_url!}
              alt={
                item.nama_pejabat
                  ? `Foto ${item.nama_pejabat}, ${item.nama_jabatan}`
                  : `Foto pejabat ${item.nama_jabatan}`
              }
              onError={() => handleImageError(slotKey, item.foto_url!)}
              loading={slotKey === "wali_nagari" ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-7 h-7 text-amber-800/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>

        {/* Teks Nama Pejabat & Jabatan di Dalam Pill */}
        <div className="w-full pl-[48px] pr-3 flex flex-col justify-center text-center overflow-hidden">
          {/* Baris 1: Nama Pejabat */}
          <span
            className={`font-bold leading-tight truncate block ${
              item.nama_pejabat ? "text-gray-900 font-bold" : "text-gray-400 italic font-semibold"
            } ${isPimpinan ? "text-xs sm:text-sm text-amber-950" : "text-[11px] sm:text-xs"}`}
          >
            {namaPejabat}
          </span>

          {/* Baris 2: Nama Jabatan */}
          <span
            className={`font-bold leading-tight uppercase tracking-tight truncate block text-amber-900 ${
              isPimpinan ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[10px]"
            }`}
          >
            {item.nama_jabatan}
          </span>
        </div>
      </article>
    )
  }

  // Hitung Anchor Point Konektor dari Metadata Geometri
  const pWali = POSISI_DESKTOP.wali_nagari
  const pSekretaris = POSISI_DESKTOP.sekretaris_nagari
  const pKasiPem = POSISI_DESKTOP.kasi_pemerintahan
  const pKasiKesra = POSISI_DESKTOP.kasi_kesra_pelayanan
  const pStafPem = POSISI_DESKTOP.staf_pemerintahan
  const pStafKesra = POSISI_DESKTOP.staf_kesra_pelayanan
  const pPetugasData = POSISI_DESKTOP.petugas_data
  const pPetugasAgama = POSISI_DESKTOP.petugas_keagamaan
  const pKaurUmum = POSISI_DESKTOP.kaur_umum
  const pKaurKeuangan = POSISI_DESKTOP.kaur_keuangan
  const pStafKaurUmum = POSISI_DESKTOP.staf_kaur_umum
  const pStafKaurKeuangan = POSISI_DESKTOP.staf_kaur_keuangan
  const pStafKebersihan = POSISI_DESKTOP.staf_kebersihan
  const pStafKeamanan = POSISI_DESKTOP.staf_keamanan
  const pJorong1 = POSISI_DESKTOP.ka_jorong_padang_sarai
  const pJorong2 = POSISI_DESKTOP.ka_jorong_kp_padang_paraman_dareh

  // Landings & Clearance Anchors (Titik masuk berhenti CONNECTOR_CLEARANCE px sebelum border)
  const waliBottom = pWali.cy + pWali.height / 2 + CONNECTOR_CLEARANCE
  const sekretarisTop = pSekretaris.cy - pSekretaris.height / 2 - CONNECTOR_CLEARANCE
  const sekretarisBottom = pSekretaris.cy + pSekretaris.height / 2 + CONNECTOR_CLEARANCE

  const kasiPemTop = pKasiPem.cy - pKasiPem.height / 2 - CONNECTOR_CLEARANCE
  const kasiPemBottom = pKasiPem.cy + pKasiPem.height / 2 + CONNECTOR_CLEARANCE
  const stafPemTop = pStafPem.cy - pStafPem.height / 2 - CONNECTOR_CLEARANCE
  const stafPemBottom = pStafPem.cy + pStafPem.height / 2 + CONNECTOR_CLEARANCE
  const petugasDataTop = pPetugasData.cy - pPetugasData.height / 2 - CONNECTOR_CLEARANCE

  const kasiKesraTop = pKasiKesra.cy - pKasiKesra.height / 2 - CONNECTOR_CLEARANCE
  const kasiKesraBottom = pKasiKesra.cy + pKasiKesra.height / 2 + CONNECTOR_CLEARANCE
  const stafKesraTop = pStafKesra.cy - pStafKesra.height / 2 - CONNECTOR_CLEARANCE
  const stafKesraBottom = pStafKesra.cy + pStafKesra.height / 2 + CONNECTOR_CLEARANCE
  const petugasAgamaTop = pPetugasAgama.cy - pPetugasAgama.height / 2 - CONNECTOR_CLEARANCE

  const kaurUmumTop = pKaurUmum.cy - pKaurUmum.height / 2 - CONNECTOR_CLEARANCE
  const kaurUmumBottom = pKaurUmum.cy + pKaurUmum.height / 2 + CONNECTOR_CLEARANCE
  const stafKaurUmumTop = pStafKaurUmum.cy - pStafKaurUmum.height / 2 - CONNECTOR_CLEARANCE
  const stafKaurUmumBottom = pStafKaurUmum.cy + pStafKaurUmum.height / 2 + CONNECTOR_CLEARANCE

  const kaurKeuanganTop = pKaurKeuangan.cy - pKaurKeuangan.height / 2 - CONNECTOR_CLEARANCE
  const kaurKeuanganBottom = pKaurKeuangan.cy + pKaurKeuangan.height / 2 + CONNECTOR_CLEARANCE
  const stafKaurKeuanganTop = pStafKaurKeuangan.cy - pStafKaurKeuangan.height / 2 - CONNECTOR_CLEARANCE

  const stafKebersihanTop = pStafKebersihan.cy - pStafKebersihan.height / 2 - CONNECTOR_CLEARANCE
  const stafKeamananTop = pStafKeamanan.cy - pStafKeamanan.height / 2 - CONNECTOR_CLEARANCE

  const jorong1Top = pJorong1.cy - pJorong1.height / 2 - CONNECTOR_CLEARANCE
  const jorong2Top = pJorong2.cy - pJorong2.height / 2 - CONNECTOR_CLEARANCE

  // Connector Horizontal Lanes (Jalur khusus antarkartu)
  const LANE_TOP_BRANCH = 110
  const LANE_SEKRETARIS_KAUR = 195
  const LANE_STAF_ENTRY = 410
  const LANE_STAF_UMUM = 425
  const LANE_JORONG = 575

  // Titik tengah simetris cabang Staf Kebersihan (715) & Staf Keamanan (980)
  const childrenStafMidpointX = (pStafKebersihan.cx + pStafKeamanan.cx) / 2 // 847.5

  return (
    <div className="w-full">
      {/* ============================================================ */}
      {/* PANEL DESKTOP (xl:block) Mengikuti Tema Admin & Nagari       */}
      {/* ============================================================ */}
      <div className="hidden xl:block">
        <div className="relative mx-auto aspect-[1200/760] w-full max-w-[1360px] overflow-hidden rounded-3xl border border-[#dcc9a6] bg-gradient-to-br from-[#fffdf9] via-white to-[#fcfaf6] p-8 shadow-xl shadow-amber-950/5">
          {/* SVG Overlay 90-Degree Orthogonal Line Connectors Dark Amber (z-10) */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            viewBox="0 0 1200 760"
            preserveAspectRatio="none"
          >
            <g
              stroke="#78350f"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
              fill="none"
            >
              {/* 1. Wali Nagari (585) ke Kasi Pemerintahan (175), Kasi Kesra (450), Sekretaris (865) */}
              <path d={`M ${pWali.cx} ${waliBottom} L ${pWali.cx} ${LANE_TOP_BRANCH}`} />
              <path d={`M ${pKasiPem.cx} ${LANE_TOP_BRANCH} L ${pSekretaris.cx} ${LANE_TOP_BRANCH}`} />
              <path d={`M ${pKasiPem.cx} ${LANE_TOP_BRANCH} L ${pKasiPem.cx} ${kasiPemTop}`} />
              <path d={`M ${pKasiKesra.cx} ${LANE_TOP_BRANCH} L ${pKasiKesra.cx} ${kasiKesraTop}`} />
              <path d={`M ${pSekretaris.cx} ${LANE_TOP_BRANCH} L ${pSekretaris.cx} ${sekretarisTop}`} />

              {/* 2. Kasi Pemerintahan (175) -> Staf Pemerintahan -> Petugas Data */}
              <path d={`M ${pKasiPem.cx} ${kasiPemBottom} L ${pKasiPem.cx} ${stafPemTop}`} />
              <path d={`M ${pStafPem.cx} ${stafPemBottom} L ${pStafPem.cx} ${petugasDataTop}`} />

              {/* 3. Kasi Kesra (450) -> Staf Kesra -> Petugas Keagamaan */}
              <path d={`M ${pKasiKesra.cx} ${kasiKesraBottom} L ${pKasiKesra.cx} ${stafKesraTop}`} />
              <path d={`M ${pStafKesra.cx} ${stafKesraBottom} L ${pStafKesra.cx} ${petugasAgamaTop}`} />

              {/* 4. Sekretaris Nagari (865) -> Simetris ke Kaur Umum (725) & Kaur Keuangan (1005) */}
              <path d={`M ${pSekretaris.cx} ${sekretarisBottom} L ${pSekretaris.cx} ${LANE_SEKRETARIS_KAUR}`} />
              <path d={`M ${pKaurUmum.cx} ${LANE_SEKRETARIS_KAUR} L ${pKaurKeuangan.cx} ${LANE_SEKRETARIS_KAUR}`} />
              <path d={`M ${pKaurUmum.cx} ${LANE_SEKRETARIS_KAUR} L ${pKaurUmum.cx} ${kaurUmumTop}`} />
              <path d={`M ${pKaurKeuangan.cx} ${LANE_SEKRETARIS_KAUR} L ${pKaurKeuangan.cx} ${kaurKeuanganTop}`} />

              {/* 5. Kaur Umum (725) -> Staf Kaur Umum (725) */}
              <path d={`M ${pKaurUmum.cx} ${kaurUmumBottom} L ${pKaurUmum.cx} ${stafKaurUmumTop}`} />

              {/* 5b. Staf Kaur Umum / Dian (725) -> Entry Horizontal ke Titik Tengah (847.5) -> Cabang Simetris Herlina (715) & Mery (980) */}
              <path d={`M ${pStafKaurUmum.cx} ${stafKaurUmumBottom} L ${pStafKaurUmum.cx} ${LANE_STAF_ENTRY}`} />
              <path d={`M ${pStafKaurUmum.cx} ${LANE_STAF_ENTRY} L ${childrenStafMidpointX} ${LANE_STAF_ENTRY}`} />
              <path d={`M ${childrenStafMidpointX} ${LANE_STAF_ENTRY} L ${childrenStafMidpointX} ${LANE_STAF_UMUM}`} />
              <path d={`M ${pStafKebersihan.cx} ${LANE_STAF_UMUM} L ${pStafKeamanan.cx} ${LANE_STAF_UMUM}`} />
              <path d={`M ${pStafKebersihan.cx} ${LANE_STAF_UMUM} L ${pStafKebersihan.cx} ${stafKebersihanTop}`} />
              <path d={`M ${pStafKeamanan.cx} ${LANE_STAF_UMUM} L ${pStafKeamanan.cx} ${stafKeamananTop}`} />

              {/* 6. Kaur Keuangan (1005) -> Staf Kaur Keuangan */}
              <path d={`M ${pKaurKeuangan.cx} ${kaurKeuanganBottom} L ${pKaurKeuangan.cx} ${stafKaurKeuanganTop}`} />

              {/* 7. Wali Nagari (585) -> Jalur Utama Tengah Turun ke Wilayah Jorong (390 & 780) */}
              <path d={`M ${pWali.cx} ${LANE_TOP_BRANCH} L ${pWali.cx} ${LANE_JORONG}`} />
              <path d={`M ${pJorong1.cx} ${LANE_JORONG} L ${pJorong2.cx} ${LANE_JORONG}`} />
              <path d={`M ${pJorong1.cx} ${LANE_JORONG} L ${pJorong1.cx} ${jorong1Top}`} />
              <path d={`M ${pJorong2.cx} ${LANE_JORONG} L ${pJorong2.cx} ${jorong2Top}`} />
            </g>
          </svg>

          {/* 16 Slot Kartu Pill Desktop (z-20) Konversi Geometri Synchronized */}
          {STRUKTUR_ORGANISASI_SLOT_KEYS.map((slotKey) => {
            const pos = POSISI_DESKTOP[slotKey]
            const leftPercent = `${(pos.cx / VIEWBOX_W) * 100}%`
            const topPercent = `${(pos.cy / VIEWBOX_H) * 100}%`
            const widthPercent = `${(pos.width / VIEWBOX_W) * 100}%`

            return (
              <div
                key={slotKey}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: leftPercent,
                  top: topPercent,
                  width: widthPercent,
                }}
              >
                {renderKartu(slotKey, true)}
              </div>
            )
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE & TABLET HIERARKI (xl:hidden)                        */}
      {/* ============================================================ */}
      <div className="xl:hidden space-y-8 w-full max-w-2xl mx-auto">
        {/* 1. Pimpinan */}
        <section className="bg-gradient-to-br from-amber-500/10 via-[#fffdf9] to-amber-900/5 p-6 rounded-2xl border border-[#dcc9a6] shadow-md">
          <h2 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-4 text-center">
            Pimpinan Nagari
          </h2>
          {renderKartu("wali_nagari")}
        </section>

        {/* 2. Sekretariat */}
        <section className="bg-[#fcfaf6] p-6 rounded-2xl border border-[#dcc9a6] shadow-md space-y-6">
          <h2 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2">
            Sekretariat Nagari
          </h2>
          {renderKartu("sekretaris_nagari")}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-amber-800/20">
            {/* Kaur Umum Branch */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Urusan Umum
              </span>
              {renderKartu("kaur_umum")}
              <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                {renderKartu("staf_kaur_umum")}
                {renderKartu("staf_kebersihan")}
                {renderKartu("staf_keamanan")}
              </div>
            </div>

            {/* Kaur Keuangan Branch */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Urusan Keuangan
              </span>
              {renderKartu("kaur_keuangan")}
              <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                {renderKartu("staf_kaur_keuangan")}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Pemerintahan */}
        <section className="bg-[#fcfaf6] p-6 rounded-2xl border border-[#dcc9a6] shadow-md space-y-4">
          <h2 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2">
            Seksi Pemerintahan
          </h2>
          {renderKartu("kasi_pemerintahan")}
          <div className="pl-4 border-l-2 border-amber-800/20 space-y-3">
            {renderKartu("staf_pemerintahan")}
            {renderKartu("petugas_data")}
          </div>
        </section>

        {/* 4. Kesra dan Pelayanan */}
        <section className="bg-[#fcfaf6] p-6 rounded-2xl border border-[#dcc9a6] shadow-md space-y-4">
          <h2 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2">
            Seksi Kesejahteraan & Pelayanan
          </h2>
          {renderKartu("kasi_kesra_pelayanan")}
          <div className="pl-4 border-l-2 border-amber-800/20 space-y-3">
            {renderKartu("staf_kesra_pelayanan")}
            {renderKartu("petugas_keagamaan")}
          </div>
        </section>

        {/* 5. Wilayah Jorong */}
        <section className="bg-[#fcfaf6] p-6 rounded-2xl border border-[#dcc9a6] shadow-md space-y-4">
          <h2 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2">
            Wilayah Jorong
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderKartu("ka_jorong_padang_sarai")}
            {renderKartu("ka_jorong_kp_padang_paraman_dareh")}
          </div>
        </section>
      </div>
    </div>
  )
}
