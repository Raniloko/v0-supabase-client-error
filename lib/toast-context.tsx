"use client"
import React, { createContext, useContext, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, CheckCircle, XCircle, Clock, Bell } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  timestamp: string
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message: string) => void
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} })

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" style={{ color: "#2a9d5c" }} />,
  error:   <XCircle className="w-5 h-5" style={{ color: "#cc2222" }} />,
  warning: <Bell className="w-5 h-5" style={{ color: "#d4892a" }} />,
  info:    <Clock className="w-5 h-5" style={{ color: "#c9a84c" }} />,
}

const borders: Record<ToastType, string> = {
  success: "#2a9d5c",
  error:   "#cc2222",
  warning: "#d4892a",
  info:    "#c9a84c",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).slice(2)
    const timestamp = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    setToasts((prev) => [...prev.slice(-2), { id, type, title, message, timestamp }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto w-80 rounded-xl overflow-hidden"
              style={{
                background: "rgba(17,17,17,0.95)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${borders[toast.type]}40`,
                borderLeft: `3px solid ${borders[toast.type]}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)`,
              }}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{icons[toast.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#f5f0e8", fontFamily: "DM Sans, sans-serif" }}>{toast.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9a9a9a", fontFamily: "DM Sans, sans-serif" }}>{toast.message}</p>
                    <p className="text-xs mt-1" style={{ color: "#6b6b6b" }}>{toast.timestamp}</p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-[#6b6b6b] hover:text-[#f5f0e8] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Progress bar */}
                <motion.div
                  className="mt-3 h-0.5 rounded-full"
                  style={{ background: borders[toast.type], originX: 0 }}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
