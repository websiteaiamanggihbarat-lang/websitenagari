"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration?: number) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)

      // Auto dismiss default durations
      const defaultDurations: Record<ToastType, number> = {
        success: 3500,
        info: 4000,
        warning: 4500,
        error: 5500,
      }

      const finalDuration = duration ?? defaultDurations[type]

      const newItem: ToastItem = { id, type, title, message, duration: finalDuration }

      setToasts((prev) => [...prev, newItem])

      if (finalDuration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, finalDuration)
      }
    },
    [removeToast]
  )

  const showSuccess = useCallback((message: string, title?: string) => showToast(message, "success", title), [showToast])
  const showError = useCallback((message: string, title?: string) => showToast(message, "error", title), [showToast])
  const showWarning = useCallback((message: string, title?: string) => showToast(message, "warning", title), [showToast])
  const showInfo = useCallback((message: string, title?: string) => showToast(message, "info", title), [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastSingleItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastSingleItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const isError = toast.type === "error"
  const isWarning = toast.type === "warning"
  const isSuccess = toast.type === "success"

  const borderClass = isSuccess
    ? "border-emerald-200 bg-white text-emerald-950 shadow-emerald-900/10"
    : isError
      ? "border-red-200 bg-white text-red-950 shadow-red-900/10"
      : isWarning
        ? "border-amber-200 bg-white text-amber-950 shadow-amber-900/10"
        : "border-[#d1c2a0] bg-white text-gray-900 shadow-[#2c1b01]/10"

  const iconBg = isSuccess
    ? "bg-emerald-100 text-emerald-600"
    : isError
      ? "bg-red-100 text-red-600"
      : isWarning
        ? "bg-amber-100 text-amber-600"
        : "bg-amber-100/80 text-[#2c1b01]"

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${borderClass}`}
    >
      {/* Icon */}
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {isSuccess && (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isError && (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {isWarning && (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        {!isSuccess && !isError && !isWarning && (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && <h5 className="text-sm font-bold leading-tight mb-0.5">{toast.title}</h5>}
        <p className="text-xs sm:text-sm font-medium leading-relaxed break-words">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Tutup notifikasi"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
