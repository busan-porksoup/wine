import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import '@fontsource/pretendard/400.css'
import '@fontsource/pretendard/600.css'
import '@fontsource/pretendard/700.css'
import './globals.css'
import { VineyardBackground } from './VineyardBackground'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JW Wine Archive',
  description: '기록으로 완성되는 우리의 셀러',
  openGraph: {
    title: 'JW Wine Archive',
    description: '기록으로 완성되는 우리의 셀러',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'JW Wine Archive',
    description: '기록으로 완성되는 우리의 셀러',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <VineyardBackground />
        <div className="bg-wash" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
