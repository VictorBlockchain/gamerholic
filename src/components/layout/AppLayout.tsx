'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav'
import Footer from '@/components/navigation/Footer'

// Avoid SSR for Header to prevent build-time hook errors when Dynamic provider
// is intentionally not mounted during prerender (e.g., /_not-found route).
const Header = dynamic(() => import('@/components/navigation/Header').then((m) => m.Header), {
  ssr: false,
})

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState('challenges')
  const pathname = usePathname()

  // Auto-detect active tab based on pathname
  React.useEffect(() => {
    if (pathname === '/') {
      setActiveTab('challenges')
    } else if (pathname.includes('/challenges')) {
      setActiveTab('challenges')
    } else if (pathname.includes('/tournaments')) {
      setActiveTab('tournaments')
    } else if (pathname.includes('/leaderboard')) {
      setActiveTab('leaderboard')
    } else if (pathname.includes('/profile')) {
      setActiveTab('profile')
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area */}
      <main className="pb-24">
        {children}
      </main>

      {/* Shared Footer (desktop and larger) */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}