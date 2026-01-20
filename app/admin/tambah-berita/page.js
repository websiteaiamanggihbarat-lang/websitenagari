"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function TambahBerita() {
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [beritaList, setBeritaList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [existingFotoUrl, setExistingFotoUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  // Auto logout jika idle 5 menit
  useEffect(() => {
    let timeoutId

    const logout = async () => {
      try {
        await fetch('/auth/signout', { method: 'POST', credentials: 'include' })
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.replace('/login')
      } catch (err) {
        console.error('Auto logout error:', err)
        window.location.replace('/login')
      }
    }

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(logout, 5 * 60 * 1000)
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart']
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      )
    }
  }, [])

  const fetchBerita = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('berita')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('fetchBerita error:', error?.message, error)
      setError(error?.message || 'Gagal memuat data berita')
    } else {
      setBeritaList(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBerita()
  }, [])

  const simpanBerita = async (e) => {
    e.preventDefault()

    if (!judul.trim() || !konten.trim()) {
      alert('Judul dan isi berita tidak boleh kosong')
      return
    }

    setLoading(true)

    let fotoUrlToSave = existingFotoUrl

    if (fotoFile) {
      if (fotoFile.size > 2 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar, maksimal 2 MB')
        setLoading(false)
        return
      }

      const safeName = fotoFile.name.replace(/\s+/g, '-')
      const fileName = `${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase
        .storage
        .from('foto-berita')
        .upload(fileName, fotoFile)

      if (uploadError) {
        console.error('Upload foto error:', uploadError)
        alert('Gagal upload foto: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicData } = supabase
        .storage
        .from('foto-berita')
        .getPublicUrl(fileName)

      fotoUrlToSave = publicData?.publicUrl || ''
    }

    let result

    if (editingId) {
      result = await supabase
        .from('berita')
        .update({ 
          judul, 
          konten,
          foto_url: fotoUrlToSave || null,
        })
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('berita')
        .insert([{ 
          judul, 
          konten,
          foto_url: fotoUrlToSave || null,
        }])
    }

    const { error } = result

    if (error) {
      console.error('simpanBerita error:', error?.message, error)
      alert('Gagal simpan: ' + error.message)
    } else {
      alert(editingId ? 'Berita berhasil diperbarui!' : 'Berita berhasil dipublikasikan!')
      setJudul('')
      setKonten('')
      setEditingId(null)
      setFotoFile(null)
      setExistingFotoUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchBerita()
    }

    setLoading(false)
  }

  const handleEdit = (item) => {
    setJudul(item.judul)
    setKonten(item.konten)
    setEditingId(item.id)
    setExistingFotoUrl(item.foto_url || '')
    setFotoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancelEdit = () => {
    setJudul('')
    setKonten('')
    setEditingId(null)
    setFotoFile(null)
    setExistingFotoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id) => {
    const konfirmasi = confirm('Yakin ingin menghapus berita ini?')
    if (!konfirmasi) return

    const { error } = await supabase
      .from('berita')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      alert('Berita berhasil dihapus')
      setBeritaList((prev) => prev.filter((b) => b.id !== id))
      if (editingId === id) {
        handleCancelEdit()
      }
    }
  }

  // Filter berita berdasarkan search query
  const filteredBeritaList = beritaList.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.judul.toLowerCase().includes(query) ||
      item.konten.toLowerCase().includes(query)
    )
  })

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/auth/signout', { method: 'POST', credentials: 'include' })
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.replace('/login')
    } catch (err) {
      console.error('Logout error:', err)
      window.location.replace('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                title="Kembali ke Dashboard"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {editingId ? 'Edit Berita' : 'Tambah Berita Baru'}
                </h1>
                <p className="text-gray-600 text-sm mt-1">Kelola konten berita Nagari</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Sidebar Navigasi Berita - Muncul jika ada lebih dari 5 berita */}
          {beritaList.length > 5 && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Navigasi Berita</h3>
                <div className="space-y-2">
                  {filteredBeritaList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        document.getElementById(`berita-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        editingId === item.id
                          ? 'bg-[#2c1b01] text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="font-medium truncate">{item.judul}</p>
                      {item.created_at && (
                        <p className="text-xs opacity-75 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className={beritaList.length > 5 ? "lg:col-span-5" : "lg:col-span-6"} style={{ minHeight: 'fit-content' }}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-full flex flex-col min-h-[600px]">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Form Berita</h2>
              
              <form onSubmit={simpanBerita} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Berita
                  </label>
                  <input 
                    type="text" 
                    placeholder="Masukkan judul berita" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Isi Berita
                  </label>
                  <textarea 
                    placeholder="Tuliskan isi berita di sini..." 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                    value={konten}
                    onChange={(e) => setKonten(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Berita <span className="text-gray-400 font-normal">(opsional, maks. 2 MB)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2c1b01] file:text-white hover:file:bg-[#3a2604] transition-colors"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setFotoFile(file)
                    }}
                  />
                  {existingFotoUrl && !fotoFile && (
                    <p className="text-xs text-gray-500 mt-2">
                      Foto saat ini akan tetap digunakan jika tidak memilih foto baru.
                    </p>
                  )}
                  {fotoFile && (
                    <p className="text-xs text-green-600 mt-2">
                      Foto baru dipilih: {fotoFile.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white font-semibold py-3 rounded-lg hover:from-[#3a2604] hover:to-[#100b00] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Publikasikan Berita'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className={beritaList.length > 5 ? "lg:col-span-5" : "lg:col-span-6"} style={{ minHeight: 'fit-content' }}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-full flex flex-col min-h-[600px] max-h-[800px]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Berita</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchQuery ? (
                        <>
                          {filteredBeritaList.length} dari {beritaList.length} berita
                        </>
                      ) : (
                        <>
                          {beritaList.length} {beritaList.length === 1 ? 'berita' : 'berita'} tersedia
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBerita}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari berita berdasarkan judul atau isi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all text-sm"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {loading && beritaList.length === 0 && (
                <div className="text-center py-12 flex-1 flex items-center justify-center">
                  <div>
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c1b01]"></div>
                    <p className="text-gray-500 text-sm mt-4">Memuat data berita...</p>
                  </div>
                </div>
              )}

              {beritaList.length === 0 && !loading && (
                <div className="text-center py-12 flex-1 flex items-center justify-center">
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm mt-4">Belum ada berita.</p>
                  </div>
                </div>
              )}

              {filteredBeritaList.length === 0 && beritaList.length > 0 && !loading && (
                <div className="text-center py-12 flex-1 flex items-center justify-center">
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm mt-4">Tidak ada berita yang cocok dengan pencarian.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-2">
                {filteredBeritaList.map((item) => (
                  <div 
                    id={`berita-${item.id}`}
                    key={item.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#2c1b01] hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      {/* Foto kecil di kiri */}
                      {item.foto_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.foto_url}
                            alt={item.judul}
                            className="w-20 h-20 rounded-lg border border-gray-200 object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Konten di kanan */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 mb-1 truncate">{item.judul}</h3>
                            {item.created_at && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-line line-clamp-2">
                          {item.konten.length > 100
                            ? item.konten.slice(0, 100) + '…'
                            : item.konten}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
