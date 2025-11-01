'use client'

import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="hidden md:block mt-8">
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-yellow-500/30 via-amber-400/30 to-orange-500/30" />
        <div className="flex items-center justify-center gap-4 py-4">
          <Link
            href="/privacy"
            className="text-xs text-white/60 hover:text-amber-300 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-white/20">•</span>
          <Link
            href="/user-agreement"
            className="text-xs text-white/60 hover:text-amber-300 transition-colors"
          >
            User Agreement
          </Link>
        </div>
        <p className="py-6 text-center text-xs text-white/50">
          © 2025 Gamerholic — I Win For A Living
        </p>
      </div>
    </footer>
  )
}