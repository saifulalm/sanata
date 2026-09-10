"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClientHome() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/client/dashboard")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 animate-pulse">
          <svg viewBox="0 0 48 48" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
            </defs>
            <path d="M12 10 L28 10 L28 28 L40 28 L40 40 L12 40 Z" fill="url(#logoGrad)" opacity="0.3" />
            <path d="M10 10 L26 10 L26 26 L38 26 L38 40 L10 40 Z" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-slate-500">Memuat...</p>
      </div>
    </div>
  )
}
