import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JW Wine Archive 🍷',
  description: '기록으로 완성되는 우리의 셀러',
  openGraph: {
    title: 'JW Wine Archive 🍷',
    description: '기록으로 완성되는 우리의 셀러',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'JW Wine Archive 🍷',
    description: '기록으로 완성되는 우리의 셀러',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}