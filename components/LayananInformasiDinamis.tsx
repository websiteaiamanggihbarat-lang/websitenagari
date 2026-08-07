"use client"

import { useEffect, useState } from "react"
import {
  fetchDataLayananInformasiPublik,
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
      // Open first accordion item by default if available
      if (res.layanan.length > 0) {
        setOpenIds(new Set([res.layanan[0].id]))
      }
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
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#6b4b1d] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const pengaturan = data?.pengaturan
  const layananList = data?.layanan || []

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
            {/* Kartu Kontak Pelayanan */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200/50 shadow-lg">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                  <svg className="w-6 h-6 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Kontak Pelayanan</h3>
              </div>

              <div className="space-y-6">
                {/* Telepon Utama */}
                {pengaturan.telepon_pelayanan && (
                  <div className="flex items-start group/item">
                    <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <svg className="w-5 h-5 text-[#2c1b01]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Telepon Pelayanan Utama</p>
                      {telUtamaUrl ? (
                        <a href={telUtamaUrl} className="text-[#6b4b1d] hover:underline font-semibold text-base">
                          {pengaturan.telepon_pelayanan}
                        </a>
                      ) : (
                        <p className="text-gray-600">{pengaturan.telepon_pelayanan}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Telepon Alternatif */}
                {pengaturan.telepon_pelayanan_alternatif && (
                  <div className="flex items-start group/item">
                    <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <svg className="w-5 h-5 text-[#2c1b01]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Telepon Pelayanan Alternatif</p>
                      {telAltUrl ? (
                        <a href={telAltUrl} className="text-[#6b4b1d] hover:underline font-semibold text-base">
                          {pengaturan.telepon_pelayanan_alternatif}
                        </a>
                      ) : (
                        <p className="text-gray-600">{pengaturan.telepon_pelayanan_alternatif}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* WhatsApp Pelayanan */}
                {pengaturan.whatsapp_pelayanan && (
                  <div className="flex items-start group/item">
                    <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <svg className="w-5 h-5 text-[#2c1b01]" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">WhatsApp Pelayanan</p>
                      {waPelayananUrl ? (
                        <a
                          href={waPelayananUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:underline font-semibold text-base"
                        >
                          {pengaturan.whatsapp_pelayanan} ↗
                        </a>
                      ) : (
                        <p className="text-gray-600">{pengaturan.whatsapp_pelayanan}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Email Pelayanan */}
                {pengaturan.email_pelayanan && (
                  <div className="flex items-start group/item">
                    <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <svg className="w-5 h-5 text-[#2c1b01]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Email Pelayanan</p>
                      {emailPelayananUrl ? (
                        <a
                          href={emailPelayananUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:underline font-semibold text-base break-all"
                        >
                          {pengaturan.email_pelayanan} ↗
                        </a>
                      ) : (
                        <p className="text-gray-600 break-all">{pengaturan.email_pelayanan}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Alamat Pelayanan & Google Maps */}
                {pengaturan.alamat_pelayanan && (
                  <div className="flex items-start group/item">
                    <div className="w-10 h-10 bg-[#e6ddcf] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:bg-[#d1c2a0] transition-colors">
                      <svg className="w-5 h-5 text-[#2c1b01]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Alamat Kantor</p>
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6b4b1d] hover:underline font-semibold text-base"
                        >
                          {pengaturan.alamat_pelayanan} (Buka Google Maps ↗)
                        </a>
                      ) : (
                        <p className="text-gray-600">{pengaturan.alamat_pelayanan}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kartu Waktu Pelayanan */}
            <div className="bg-gradient-to-br from-[#f0e8db] to-white rounded-2xl p-8 border border-[#d1c2a0] shadow-lg">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-xl flex items-center justify-center shadow-lg shadow-[rgba(44,27,1,0.25)] mr-4">
                  <svg className="w-6 h-6 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Waktu Pelayanan</h3>
              </div>

              <div className="text-gray-700 leading-relaxed text-base whitespace-pre-line font-medium">
                {pengaturan.jadwal_pelayanan}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: DAFTAR LAYANAN SURAT AKTIF & PERSYARATAN */}
      <section id="persyaratan-dokumen">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          Layanan Surat & Persyaratan Dokumen
        </h2>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Berikut adalah daftar jenis permohonan surat administrasi yang dilayani di Nagari Aia Manggih Barat beserta poin-poin persyaratan dan estimasi pembuatannya. Klik jenis surat untuk melihat rincian persyaratan.
        </p>

        {layananList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-[#6b4b1d] mb-3">
              <svg className="h-7 w-7" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada layanan surat yang tersedia saat ini.</h3>
            <p className="mt-1 text-sm text-gray-500">
              Silakan periksa kembali di lain waktu atau hubungi kontak pelayanan nagari.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {layananList.map((item, index) => {
              const isOpen = openIds.has(item.id)
              const formUrl = getSafeHttpsUrl(item.form_pendataan_url)

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all overflow-hidden hover:border-[#b6a587]"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`panel-layanan-${item.id}`}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/80 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6b4b1d]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#e6ddcf] to-[#f0e8db] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#2c1b01] font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg md:text-xl">
                          {item.nama_layanan}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Estimasi: <span className="font-semibold text-gray-700">{item.estimasi_pembuatan}</span> • {item.persyaratan.length} Poin Persyaratan
                        </p>
                      </div>
                    </div>

                    <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-transform">
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div id={`panel-layanan-${item.id}`} className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
                      {item.deskripsi && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">{item.deskripsi}</p>
                      )}

                      <div className="mb-6">
                        <p className="font-bold text-gray-900 text-sm mb-3">Persyaratan Dokumen:</p>
                        {item.persyaratan.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">Persyaratan belum tersedia.</p>
                        ) : (
                          <ul className="space-y-2 text-sm text-gray-700">
                            {item.persyaratan.map((p) => (
                              <li key={p.id} className="flex items-start">
                                <span className="text-[#6b4b1d] font-bold mr-2.5">•</span>
                                <span>{p.isi_persyaratan}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">Waktu Penyelesaian:</span> {item.estimasi_pembuatan}
                        </div>

                        {formUrl ? (
                          <a
                            href={formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2c1b01] to-[#1a1200] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-[#3a2604] hover:to-[#100b00] transition-all"
                          >
                            <span>Isi Form Pendataan Online</span>
                            <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                            Form pendataan online belum tersedia.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
