"use client"

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LupaPasswordForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [pesanSukses, setPesanSukses] = useState<string | null>(null)

  const handleKirimRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setPesanError(null)
    setPesanSukses(null)

    const emailClean = email.trim()
    if (!emailClean) {
      setPesanError("Email wajib diisi.")
      return
    }

    setLoading(true)

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
      const redirectTo = `${origin}/update-password`

      const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
        redirectTo,
      })

      if (error) {
        setPesanError(`Gagal mengirim email pemulihan: ${error.message}`)
      } else {
        setPesanSukses(`Tautan pemulihan password telah dikirim ke ${emailClean}. Silakan periksa kotak masuk/spam Email Anda.`)
        setEmail("")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPesanError(`Terjadi kesalahan: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-xs text-[#2c1b01] font-semibold hover:underline cursor-pointer"
        >
          Lupa password / Atur password baru?
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Kirim Tautan Pemulihan Password</h3>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setPesanError(null)
            setPesanSukses(null)
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Tutup
        </button>
      </div>

      {pesanError && (
        <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{pesanError}</span>
        </div>
      )}

      {pesanSukses && (
        <div className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{pesanSukses}</span>
        </div>
      )}

      <form onSubmit={handleKirimRecovery} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email Terdaftar
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@email.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2c1b01]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2c1b01] hover:bg-[#3a2604] text-white font-semibold py-2 rounded-lg text-xs transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Mengirim..." : "Kirim Email Pemulihan"}
        </button>
      </form>
    </div>
  )
}
