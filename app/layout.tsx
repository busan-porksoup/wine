import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import '@fontsource/pretendard/400.css'
import '@fontsource/pretendard/600.css'
import '@fontsource/pretendard/700.css'
import './globals.css'

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

// Portrait vineyard photos in /public — randomly chosen per request
const VINEYARD_BACKGROUNDS = [
  '/71d350178084297.64e28376ce709.webp',
  '/c6e6ac178084297.64e28378c0a8d.webp',
  '/ffbbe2178084297.64e28377bdb75.webp',
  '/1b8993178084297.64e3d87e3b2c1.webp',
  '/718df2178084297.64e3d87e3c4ce.webp',
  '/65d074178084297.64e6431f3f83d.webp',
  '/850f44178084297.64e6431f3c0d3.webp',
  '/ba742d178084297.64e3d87fde8f0.webp',
  '/c86c0c178084297.64e3dcf50c70e.webp',
  '/1215de178084297.64e6477057b14.webp',
]

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
  const bgUrl = VINEYARD_BACKGROUNDS[Math.floor(Math.random() * VINEYARD_BACKGROUNDS.length)]
  return (
    <html lang="ko" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <div
          className="bg-vineyard"
          aria-hidden="true"
          style={{ backgroundImage: `url('${bgUrl}')` }}
        />
        <div className="bg-wash" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
