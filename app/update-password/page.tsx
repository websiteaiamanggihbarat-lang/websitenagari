"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function UpdatePasswordPage() {
  const [passwordBaru, setPasswordBaru] = useState("")
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [pesanSukses, setPesanSukses] = useState<string | null>(null)
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null)

  // Recovery email request state for fallback direct access
  const [emailRecovery, setEmailRecovery] = useState("")
  const [loadingRecovery, setLoadingRecovery] = useState(false)
  const [pesanErrorRecovery, setPesanErrorRecovery] = useState<string | null>(null)
  const [pesanSuksesRecovery, setPesanSuksesRecovery] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (isMounted) {
        setIsSessionValid(Boolean(session))
      }
    }

    checkCurrentSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (event === "PASSWORD_RECOVERY" || session) {
          setIsSessionValid(true)
        }
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPesanError(null)
    setPesanSukses(null)

    if (!passwordBaru) {
      setPesanError("Password baru wajib diisi.")
      return
    }

    if (passwordBaru.length < 6) {
      setPesanError("Password minimal 6 karakter.")
      return
    }

    if (passwordBaru !== konfirmasiPassword) {
      setPesanError("Konfirmasi password baru tidak cocok.")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordBaru,
      })

      if (error) {
        setPesanError(`Gagal memperbarui password: ${error.message}`)
        setLoading(false)
        return
      }

      setPesanSukses("Password berhasil diperbarui! Mengalihkan ke halaman login...")

      setTimeout(async () => {
        try {
          await supabase.auth.signOut()
          if (typeof window !== "undefined") {
            sessionStorage.clear()
            localStorage.clear()
          }
          await fetch("/auth/signout", { method: "POST" }).catch(() => {})
        } catch {
          /* ignore signout error */
        }
        window.location.href = "/login?logout=success&reset=success"
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan: ${msg}`)
      setLoading(false)
    }
  }

  const handleKirimRecoveryDirect = async (e: React.FormEvent) => {
    e.preventDefault()
    setPesanErrorRecovery(null)
    setPesanSuksesRecovery(null)

    const emailClean = emailRecovery.trim()
    if (!emailClean) {
      setPesanErrorRecovery("Email terdaftar wajib diisi.")
      return
    }

    setLoadingRecovery(true)

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
      const redirectTo = `${origin}/update-password`

      const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
        redirectTo,
      })

      if (error) {
        setPesanErrorRecovery(`Gagal mengirim email pemulihan: ${error.message}`)
      } else {
        setPesanSuksesRecovery(`Tautan pemulihan password telah dikirim ke ${emailClean}. Silakan periksa email Anda.`)
        setEmailRecovery("")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanErrorRecovery(`Terjadi kesalahan: ${msg}`)
    } finally {
      setLoadingRecovery(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f2e8] via-white to-[#f0e8db] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2c1b01] to-[#1a1200] rounded-2xl shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembaruan Password</h1>
          <p className="text-gray-600">Nagari Aia Manggih Barat</p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Notification Messages */}
          {pesanError && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{pesanError}</span>
            </div>
          )}

          {pesanSukses && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{pesanSukses}</span>
            </div>
          )}

          {isSessionValid === false ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
                <p className="font-semibold mb-1">Sesi Pembaruan Tidak Ditemukan</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Tautan pemulihan belum diakses atau telah kadaluarsa. Masukkan email terdaftar Anda di bawah ini untuk mengirim tautan baru.
                </p>
              </div>

              {pesanErrorRecovery && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs">
                  {pesanErrorRecovery}
                </div>
              )}

              {pesanSuksesRecovery && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">
                  {pesanSuksesRecovery}
                </div>
              )}

              <form onSubmit={handleKirimRecoveryDirect} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Terdaftar</label>
                  <input
                    type="email"
                    value={emailRecovery}
                    onChange={(e) => setEmailRecovery(e.target.value)}
                    required
                    placeholder="admin@email.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingRecovery}
                  className="w-full bg-[#2c1b01] hover:bg-[#3a2604] text-white font-semibold py-3 rounded-lg text-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loadingRecovery ? "Mengirim..." : "Kirim Tautan Pemulihan Password"}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-[#2c1b01] font-semibold hover:underline">
                  &larr; Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Password Baru</h2>
              <p className="text-xs text-gray-500 mb-6">
                Masukkan password baru untuk akun Admin Anda. Minimal 6 karakter.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password Baru</label>
                <input
                  type="password"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c1b01] focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#2c1b01] to-[#1a1200] text-white font-semibold py-3 rounded-lg hover:from-[#3a2604] hover:to-[#100b00] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>

              <div className="text-center pt-3">
                <Link href="/login" className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
                  Batal / Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 Pemerintah Nagari Aia Manggih Barat
        </p>
      </div>
    </div>
  )
}
