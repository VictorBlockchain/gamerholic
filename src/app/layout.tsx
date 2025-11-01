import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import AppLayout from '@/components/layout/AppLayout'
import Web3Providers from '@/providers/Web3Providers'
import { inter, exo2, sora, electrolize } from '@/lib/fonts'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gamerholic - I Win For A Living',
  description: 'Head Up Battles & Tournaments - Compete, Win SEI, Become Champion',
  keywords: ['Gamerholic', 'Gaming', 'Tournaments', 'SEI', 'Crypto Gaming', 'Competitive Gaming'],
  authors: [{ name: 'Gamerholic Team' }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Gamerholic - I Win For A Living',
    description: 'Head Up Battles & Tournaments - Compete, Win SEI, Become Champion',
    url: 'https://gamerholic.com',
    siteName: 'Gamerholic',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gamerholic - I Win For A Living',
    description: 'Head Up Battles & Tournaments - Compete, Win SEI, Become Champion',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${exo2.variable} ${sora.variable} ${electrolize.variable} bg-background text-foreground antialiased`}
      >
        <Web3Providers>
          <AppLayout>{children}</AppLayout>
        </Web3Providers>
        <Toaster />
      </body>
    </html>
  )
}
