import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Newsreader, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/context/SessionContext'
import { AudioProvider } from '@/context/AudioContext'
import { ToastProvider } from '@/context/ToastContext'

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
  weight: ['400', '500'],
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
  themeColor: 'var(--color-paper)',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${hankenGrotesk.variable} ${newsreader.variable} ${plexMono.variable} font-sans antialiased min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]`}>
        <SessionProvider>
          <AudioProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AudioProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
