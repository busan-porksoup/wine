import '@fontsource/pretendard/400.css'
import '@fontsource/pretendard/600.css'
import '@fontsource/pretendard/700.css'
import './globals.css'

export const metadata = {
  title: 'JW WineLog',
  description: '우리의 와인 일지',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, fontFamily: "'Pretendard', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}