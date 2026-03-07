import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono, Bebas_Neue } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ToastProvider } from '@/lib/toast-context'
import { SettingsProvider } from '@/lib/settings-context'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Rondo Admin',
  description: 'Admin Dashboard – Rondo Sportsbar Hanau',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rondo Admin',
  },
}

export const viewport: Viewport = {
  themeColor: '#c9a84c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${dmSans.variable} ${geistMono.variable} ${bebasNeue.variable}`}>
      <body className="font-sans antialiased">
        <SettingsProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
