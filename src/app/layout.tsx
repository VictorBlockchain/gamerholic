import type { Metadata, Viewport } from 'next'
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
  metadataBase: new URL('https://gamerholic.fun'),
  title: 'Gamerholic',
  description: 'I Win For A Living - blockchain esports',
  keywords: [
    'gamerholic',
    'esports',
    'gaming',
    'tournaments',
    'SEI',
    'crypto gaming',
    'competitive gaming',
    'blockchain esports',
  ],
  authors: [{ name: '9bapa' }],
  alternates: {
    canonical: 'https://gamerholic.fun',
  },
  manifest: '/manifest.json',
  icons: {
    icon: ['/icons/icon-32x32.ico', '/icons/icon-16x16.ico'],
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Gamerholic',
    description: 'I Win For A Living - blockchain esports',
    url: 'https://gamerholic.fun',
    siteName: 'Gamerholic',
    type: 'website',
    images: [
      {
        url: '/home.png',
        width: 1200,
        height: 630,
        alt: 'Gamerholic',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gamerholic',
    description: 'I Win For A Living - blockchain esports',
    images: ['/home.png'],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0f0f14',
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
