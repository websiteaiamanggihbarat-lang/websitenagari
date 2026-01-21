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
  const [hasBackfilledDate, setHasBackfilledDate] = useState(false)
  const fileInputRef = useRef(null)

  // Auto logout jika idle 5 menit
  useEffect(() => {
    let timeoutId

    const logout = async () => {
      try {
        // Sign out dari Supabase client juga
        await supabase.auth.signOut()
        
        // Clear storage dulu
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Panggil endpoint signout yang akan redirect
        const response = await fetch('/auth/signout', { 
          method: 'POST', 
          credentials: 'include',
          redirect: 'follow'
        })
        
        // Jika response redirect, ikuti redirect tersebut
        if (response.redirected) {
          window.location.href = response.url
        } else {
          // Fallback: redirect manual dengan query parameter logout
          window.location.href = `/login?logout=success&t=${Date.now()}`
        }
      } catch (err) {
        console.error('Auto logout error:', err)
        // Tetap redirect meskipun ada error
        window.location.href = `/login?logout=success&t=${Date.now()}`
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
      // Jika ada berita lama tanpa tanggal, isi dengan timestamp sekarang sekali saja
      const missingDate = (data || []).some((item) => !item.created_at)
      if (missingDate && !hasBackfilledDate) {
        const nowIso = new Date().toISOString()
        await supabase
          .from('berita')
          .update({ created_at: nowIso })
          .is('created_at', null)
        setHasBackfilledDate(true)
        // Refetch untuk memastikan data terbarui
        return fetchBerita()
      }
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
          created_at: new Date().toISOString(), // pastikan ada timestamp saat berita baru ditambahkan
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
      // Sign out dari Supabase client juga
      await supabase.auth.signOut()
      
      // Clear storage dulu
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Panggil endpoint signout yang akan redirect
      const response = await fetch('/auth/signout', { 
        method: 'POST', 
        credentials: 'include',
        redirect: 'follow'
      })
      
      // Jika response redirect, ikuti redirect tersebut
      if (response.redirected) {
        window.location.href = response.url
      } else {
        // Fallback: redirect manual dengan query parameter logout
        window.location.href = `/login?logout=success&t=${Date.now()}`
      }
    } catch (err) {
      console.error('Logout error:', err)
      // Tetap redirect meskipun ada error
      window.location.href = `/login?logout=success&t=${Date.now()}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-white/50 rounded-lg transition-colors touch-manipulation"
                title="Kembali ke Dashboard"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  {editingId ? 'Edit Berita' : 'Tambah Berita Baru'}
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">Kelola konten berita Nagari</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 sm:py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
              disabled={loading}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
          <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-[#2c1b01] to-[#b6a587] rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 items-stretch">
          {/* Sidebar Navigasi Berita - Muncul jika ada lebih dari 5 berita */}
          {beritaList.length > 5 && (
            <div className="lg:col-span-2 hidden lg:block">
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
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 h-full flex flex-col min-h-[350px] sm:min-h-[500px] md:min-h-[600px]">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-6">Form Berita</h2>
              
              <form onSubmit={simpanBerita} className="space-y-4 sm:space-y-5 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Berita
                  </label>
                  <input 
                    type="text" 
                    placeholder="Masukkan judul berita" 
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    required
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Isi Berita
                  </label>
                  <textarea 
                    placeholder="Tuliskan isi berita di sini..." 
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 h-32 sm:h-40 md:h-48 resize-none focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all text-base flex-1 min-h-[120px]"
                    value={konten}
                    onChange={(e) => setKonten(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Berita <span className="text-gray-400 font-normal text-xs">(opsional, maks. 2 MB)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-2 sm:file:py-2.5 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#2c1b01] file:text-white hover:file:bg-[#3a2604] transition-colors file:cursor-pointer cursor-pointer touch-manipulation"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setFotoFile(file)
                    }}
                  />
                  {existingFotoUrl && !fotoFile && (
                    <p className="text-xs text-gray-500 mt-2 break-words">
                      Foto saat ini akan tetap digunakan jika tidak memilih foto baru.
                    </p>
                  )}
                  {fotoFile && (
                    <p className="text-xs text-green-600 mt-2 break-words">
                      Foto baru dipilih: {fotoFile.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white font-semibold py-3 sm:py-2.5 rounded-lg hover:from-[#3a2604] hover:to-[#100b00] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] touch-manipulation"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Publikasikan Berita'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 sm:px-6 py-3 sm:py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
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
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 h-full flex flex-col min-h-[350px] sm:min-h-[500px] md:min-h-[600px] max-h-[500px] sm:max-h-[600px] md:max-h-[800px]">
              <div className="mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-0 mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Daftar Berita</h2>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 break-words">
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
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 w-full sm:w-auto min-h-[44px] touch-manipulation"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari berita..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 pl-9 sm:pl-10 focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all text-base sm:text-sm min-h-[44px]"
                  />
                  <svg
                    className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none"
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
                      className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                      aria-label="Hapus pencarian"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm break-words flex-shrink-0">
                  {error}
                </div>
              )}

              {loading && beritaList.length === 0 && (
                <div className="text-center py-8 sm:py-12 flex-1 flex items-center justify-center">
                  <div>
                    <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-[#2c1b01]"></div>
                    <p className="text-gray-500 text-xs sm:text-sm mt-4">Memuat data berita...</p>
                  </div>
                </div>
              )}

              {beritaList.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12 flex-1 flex items-center justify-center">
                  <div>
                    <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-xs sm:text-sm mt-4">Belum ada berita.</p>
                  </div>
                </div>
              )}

              {filteredBeritaList.length === 0 && beritaList.length > 0 && !loading && (
                <div className="text-center py-8 sm:py-12 flex-1 flex items-center justify-center">
                  <div>
                    <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 text-xs sm:text-sm mt-4 px-4">Tidak ada berita yang cocok dengan pencarian.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 -mr-1 sm:-mr-2">
                {filteredBeritaList.map((item) => (
                  <div 
                    id={`berita-${item.id}`}
                    key={item.id} 
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-[#2c1b01] hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-3">
                      {/* Foto kecil di kiri */}
                      {item.foto_url && (
                        <div className="flex-shrink-0 w-full sm:w-20 md:w-24">
                          <img
                            src={item.foto_url}
                            alt={item.judul}
                            className="w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 rounded-lg border border-gray-200 object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Konten di kanan */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 break-words">{item.judul}</h3>
                            {item.created_at && (
                              <p className="text-xs text-gray-500 flex items-start gap-1 flex-wrap">
                                <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="break-words">
                                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="flex-1 sm:flex-none px-3 sm:px-3 md:px-4 py-2.5 sm:py-1.5 rounded-lg bg-yellow-500 text-white text-xs sm:text-sm font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 touch-manipulation"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="flex-1 sm:flex-none px-3 sm:px-3 md:px-4 py-2.5 sm:py-1.5 rounded-lg bg-red-600 text-white text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 touch-manipulation"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-line line-clamp-2 sm:line-clamp-3 break-words">
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
