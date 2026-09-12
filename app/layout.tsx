import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/context/SessionContext'
import { AudioProvider } from '@/context/AudioContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Our Little Place',
  description: 'Ruang kenangan bersama orang-orang tersayang.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Our Little Place',
  },
  openGraph: {
    title: 'Our Little Place',
    description: 'Ruang kenangan bersama orang-orang tersayang.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f766e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-dvh bg-[var(--canvas)] text-[var(--text-primary)]`}>
        <SessionProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
