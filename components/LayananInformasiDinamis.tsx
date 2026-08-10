"use client"

import { useEffect, useState } from "react"
import {
  fetchDataLayananInformasiPublik,
  groupJadwalPelayanan,
  buildWhatsAppUrl,
  buildTelephoneUrl,
  buildGmailComposeUrl,
  getSafeHttpsUrl,
  DataLayananInformasiPublik,
} from "@/lib/layananInformasi"

export default function LayananInformasiDinamis() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<DataLayananInformasiPublik | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetchDataLayananInformasiPublik()
      setData(res)
      // DEFAULT COLLAPSED: openIds intentionally remains empty Set()
    } catch (err: unknown) {
      setLoadError("Informasi pelayanan belum dapat dimuat. Silakan coba kembali.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center" aria-live="polite" role="status">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#2c1b01] border-r-transparent"></div>
        <p className="mt-4 text-base font-semibold text-gray-700">Memuat informasi pelayanan...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
          <svg className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Gagal Memuat Informasi</h3>
        <p className="mt-1 text-sm text-gray-600">{loadError}</p>
        <button
          onClick={loadData}
          type="button"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#6b4b1d] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const pengaturan = data?.pengaturan
  const layananList = data?.layanan || []
  const jadwalList = data?.jadwal || []
  const jadwalGroups = groupJadwalPelayanan(jadwalList)

  // Link Formatted Utilities
  const waPelayananUrl = buildWhatsAppUrl(pengaturan?.whatsapp_pelayanan)
  const emailPelayananUrl = buildGmailComposeUrl(pengaturan?.email_pelayanan)
  const telUtamaUrl = buildTelephoneUrl(pengaturan?.telepon_pelayanan)
  const telAltUrl = buildTelephoneUrl(pengaturan?.telepon_pelayanan_alternatif)
  const mapsUrl = getSafeHttpsUrl(pengaturan?.google_maps_url)

  const waPengaduanUrl = buildWhatsAppUrl(pengaturan?.whatsapp_pengaduan)
  const formPengaduanUrl = getSafeHttpsUrl(pengaturan?.form_pengaduan_url)

  return (
    <div className="space-y-16">
      {/* SECTION 1: KONTAK PELAYANAN & WAKTU PELAYANAN */}
      <section id="kontak-pelayanan">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 tracking-tight">
          Kontak Pelayanan & Waktu Pelayanan
        </h2>

        {!pengaturan ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center text-sm text-amber-800">
            Informasi kontak pelayanan belum tersedia di pengaturan database.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Kartu Kontak Pelayanan (Visual sepasang dengan Waktu Pelayanan) */}
            <div className="bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-8 border border-[#d1c2a0] shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Kontak Pelayanan</h3>
                    <p className="text-xs text-gray-600 mt-0.5">Informasi kontak dan alamat kantor nagari</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Telepon Pelayanan (Format: 082268789740 | 082172235322) */}
                  {(pengaturan.telepon_pelayanan || pengaturan.telepon_pelayanan_alternatif) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white/80 gap-2 shadow-xs">
                      <span className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#2c1b01] flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Telepon Pelayanan</span>
                      </span>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-sm sm:text-base text-[#6b4b1d]">
                        {pengaturan.telepon_pelayanan && (
                          telUtamaUrl ? (
                            <a href={telUtamaUrl} className="hover:underline">
                              {pengaturan.telepon_pelayanan}
                            </a>
                          ) : (
                            <span className="text-gray-700">{pengaturan.telepon_pelayanan}</span>
                          )
                        )}

                        {pengaturan.telepon_pelayanan && pengaturan.telepon_pelayanan_alternatif && (
                          <span className="text-gray-400 font-normal px-1" aria-hidden="true">|</span>
                        )}

                        {pengaturan.telepon_pelayanan_alternatif && (
                          telAltUrl ? (
                            <a href={telAltUrl} className="hover:underline">
                              {pengaturan.telepon_pelayanan_alternatif}
                            </a>
                          ) : (
                            <span className="text-gray-700">{pengaturan.telepon_pelayanan_alternatif}</span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Pelayanan */}
                  {pengaturan.whatsapp_pelayanan && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white/80 gap-2 shadow-xs">
                      <span className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        <span>WhatsApp Pelayanan</span>
                      </span>
                      {waPelayananUrl ? (
                        <a
                          href={waPelayananUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm sm:text-base text-green-700 hover:underline"
                        >
                          {pengaturan.whatsapp_pelayanan} ↗
                        </a>
                      ) : (
                        <span className="font-bold text-sm sm:text-base text-gray-700">{pengaturan.whatsapp_pelayanan}</span>
                      )}
                    </div>
                  )}

                  {/* Email Pelayanan */}
                  {pengaturan.email_pelayanan && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white/80 gap-2 shadow-xs">
                      <span className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#2c1b01] flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email Pelayanan</span>
                      </span>
                      {emailPelayananUrl ? (
                        <a
                          href={emailPelayananUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm sm:text-base text-teal-700 hover:underline break-all"
                        >
                          {pengaturan.email_pelayanan} ↗
                        </a>
                      ) : (
                        <span className="font-bold text-sm sm:text-base text-gray-700 break-all">{pengaturan.email_pelayanan}</span>
                      )}
                    </div>
                  )}

                  {/* Alamat Pelayanan & Google Maps */}
                  {pengaturan.alamat_pelayanan && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white/80 gap-2 shadow-xs">
                      <span className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#2c1b01] flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Alamat Kantor</span>
                      </span>
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm sm:text-base text-[#6b4b1d] hover:underline"
                        >
                          {pengaturan.alamat_pelayanan} (Maps ↗)
                        </a>
                      ) : (
                        <span className="font-bold text-sm sm:text-base text-gray-700">{pengaturan.alamat_pelayanan}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kartu Waktu Pelayanan (Structure Jadwal Terstruktur) */}
            <div className="bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-8 border border-[#d1c2a0] shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Waktu Pelayanan</h3>
                    <p className="text-xs text-gray-600 mt-0.5">Jadwal operasional kantor wali nagari</p>
                  </div>
                </div>

                {jadwalGroups.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/60 border border-[#d1c2a0]/40 text-center text-sm font-medium text-gray-600 italic">
                    Jadwal pelayanan belum tersedia.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jadwalGroups.map((group, idx) => (
                      <div
                        key={`${group.hari_mulai}-${group.hari_selesai}-${idx}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#d1c2a0]/60 bg-white/80 gap-2 shadow-xs"
                      >
                        <span className="font-bold text-gray-900 text-base sm:text-lg">
                          {group.label_hari}
                        </span>
                        <span
                          className={`font-bold text-sm sm:text-base ${
                            group.is_tutup ? "text-red-700" : "text-[#2c1b01]"
                          }`}
                        >
                          {group.label_waktu}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: DAFTAR LAYANAN SURAT AKTIF & PERSYARATAN (TABLE ACCORDION REDESIGN) */}
      <section id="persyaratan-dokumen">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          Layanan Surat & Persyaratan Dokumen
        </h2>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Berikut adalah daftar jenis permohonan surat administrasi yang dilayani di Nagari Aia Manggih Barat beserta poin-poin persyaratan dan estimasi pembuatannya. Klik jenis surat untuk melihat rincian persyaratan.
        </p>

        {layananList.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-300 bg-white text-center text-sm font-medium text-gray-600 shadow-sm">
            Belum ada layanan surat yang tersedia.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#d1c2a0] bg-white shadow-lg">
            {/* Table Header Krem */}
            <div className="flex items-center justify-between bg-[#f7f2e8] px-6 py-4 border-b border-[#d1c2a0] text-[#2c1b01] font-bold text-sm md:text-base uppercase tracking-wider">
              <div>NAMA LAYANAN</div>
              <div>AKSI</div>
            </div>

            {/* Table Body Rows */}
            <div className="divide-y divide-gray-200">
              {layananList.map((item) => {
                const isOpen = openIds.has(item.id)
                const formUrl = getSafeHttpsUrl(item.form_pendataan_url)

                return (
                  <div key={item.id} className="transition-colors">
                    {/* Main Table Row Header - Clickable Accordion Bar */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`panel-layanan-${item.id}`}
                      className="w-full flex items-center justify-between px-6 py-4 gap-4 text-left font-bold text-gray-900 text-base md:text-lg hover:bg-[#fcfaf7] transition-colors focus:outline-none cursor-pointer group"
                    >
                      <span className="flex-1 group-hover:text-[#6b4b1d] transition-colors">{item.nama_layanan}</span>

                      <span
                        aria-label={isOpen ? `Tutup detail ${item.nama_layanan}` : `Buka detail ${item.nama_layanan}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0e8db] text-[#2c1b01] font-bold group-hover:bg-[#ebdcc4] transition-all flex-shrink-0"
                      >
                        <svg
                          className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    {/* Expanded Detail Panel Row */}
                    {isOpen && (
                      <div
                        id={`panel-layanan-${item.id}`}
                        className="px-6 pb-6 pt-4 border-t border-[#d1c2a0]/40 bg-gradient-to-br from-white to-[#f7f2e8]/40 text-left"
                      >
                        {/* Horizontal Grid on Desktop / Tablet (Persyaratan, Estimasi, Biaya, Form Button) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-6 md:gap-x-8 lg:gap-x-10 items-start pt-1">
                          {/* Column 1: Persyaratan Dokumen (col-span-5) */}
                          <div className="md:col-span-5">
                            <h4 className="font-bold text-gray-900 text-base mb-3">Persyaratan Dokumen</h4>
                            {item.persyaratan.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">Persyaratan belum tersedia.</p>
                            ) : (
                              <ol className="space-y-2 text-sm text-gray-700 font-medium">
                                {item.persyaratan.map((p, pIdx) => (
                                  <li key={p.id} className="flex items-start gap-2.5">
                                    <span className="font-bold text-[#6b4b1d]">{pIdx + 1}.</span>
                                    <span>{p.isi_persyaratan}</span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>

                          {/* Column 2: Estimasi Pelayanan (col-span-3) */}
                          <div className="md:col-span-3">
                            <h4 className="font-bold text-gray-900 text-base mb-3">Estimasi Pelayanan</h4>
                            <p className="text-sm text-gray-700 font-semibold">{item.estimasi_pembuatan}</p>
                          </div>

                          {/* Column 3: Biaya (col-span-2) */}
                          <div className="md:col-span-2">
                            <h4 className="font-bold text-gray-900 text-base mb-3">Biaya</h4>
                            <p className="text-sm text-gray-700 font-semibold">{item.biaya}</p>
                          </div>

                          {/* Column 4: Form Pendataan (col-span-2, No "Aksi" Label, Single-line whitespace-nowrap) */}
                          <div className="md:col-span-2 md:flex md:justify-end md:items-start pt-1">
                            {formUrl ? (
                              <a
                                href={formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#1a1200] px-4.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-[#3a2604] hover:to-[#100b00] hover:shadow transition-all w-full sm:w-auto"
                              >
                                <span>Isi Form Pendataan</span>
                                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002 2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-xs font-medium text-gray-400 italic">Form belum tersedia</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: INFORMASI PENGADUAN MASYARAKAT */}
      <section id="pengaduan">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          Informasi Saluran Pengaduan
        </h2>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Masyarakat Nagari Aia Manggih Barat dapat menyampaikan pengaduan atau aspirasi pelayanan publik melalui saluran berikut:
        </p>

        {!waPengaduanUrl && !formPengaduanUrl ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Saluran pengaduan belum tersedia di sistem.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* WhatsApp Pengaduan */}
            {waPengaduanUrl && (
              <div className="bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl p-8 border border-emerald-200/80 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 mr-4">
                    <svg className="w-7 h-7 text-white" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">WhatsApp Pengaduan</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Sampaikan laporan atau keluhan pelayanan secara langsung melalui nomor WhatsApp resmi pengaduan.
                </p>
                <a
                  href={waPengaduanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all text-sm font-semibold shadow-md"
                >
                  <span>Hubungi WhatsApp Pengaduan</span>
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            )}

            {/* Form Pengaduan URL */}
            {formPengaduanUrl && (
              <div className="bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-8 border border-[#d1c2a0] shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                    <svg className="w-7 h-7 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Formulir Pengaduan Online</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Isi formulir pengaduan masyarakat secara daring melalui tautan Google Form resmi nagari.
                </p>
                <a
                  href={formPengaduanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white rounded-full hover:from-[#3a2604] hover:to-[#100b00] transition-all text-sm font-semibold shadow-md"
                >
                  <span>Isi Form Pengaduan Online</span>
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
