import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces, Poppins } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/context/SessionContext'
import { AudioProvider } from '@/context/AudioContext'
import { ToastProvider } from '@/context/ToastContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
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
  themeColor: '#FAFAF8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} ${poppins.variable} font-sans antialiased min-h-dvh bg-[var(--canvas)] text-[var(--text-primary)]`}>
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
