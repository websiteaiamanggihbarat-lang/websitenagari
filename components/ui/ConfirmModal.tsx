"use client"

import React, { useEffect } from "react"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
  loadingText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Hapus",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
  loadingText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape" && !isLoading) {
        onCancel()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  const isDanger = variant === "danger"
  const isWarning = variant === "warning"

  const iconBg = isDanger
    ? "bg-red-100 text-red-600"
    : isWarning
      ? "bg-amber-100 text-amber-600"
      : "bg-amber-100 text-[#2c1b01]"

  const btnConfirmBg = isDanger
    ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
    : isWarning
      ? "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500"
      : "bg-gradient-to-r from-[#2c1b01] to-[#1a1200] hover:from-[#3a2604] hover:to-[#100b00] text-white focus:ring-[#6b4b1d]"

  const defaultLoadingText = loadingText || (isDanger ? "Menghapus..." : "Memproses...")

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#d1c2a0]/60 p-6 shadow-2xl space-y-5 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {isDanger || isWarning ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-lg font-bold text-gray-900 leading-snug">
              {title}
            </h3>
            <div className="mt-2 text-sm text-gray-600 font-medium leading-relaxed break-words">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${btnConfirmBg}`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{isLoading ? defaultLoadingText : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
