import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reflex - Фиксация мыслей',
  description: 'Приложение для быстрой фиксации мыслей и рефлексии',
  manifest: '/manifest.json',
  themeColor: '#09090b',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Reflex',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
