import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ReadMap',
  description: '당신의 맞춤형 독서 로드맵을 만들고, 당신의 목표를 읽어보세요.',
  openGraph: {
    title: 'ReadMap',
    description: '당신의 맞춤형 독서 로드맵을 만들고, 당신의 목표를 읽어보세요.',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: 'ReadMap',
    description: '당신의 맞춤형 독서 로드맵을 만들고, 당신의 목표를 읽어보세요.',
  },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="dark bg-background">
      <body className="font-sans antialiased bg-background min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-border py-6 text-center bg-background">
          <p className="mx-auto max-w-5xl px-4 text-sm leading-relaxed text-muted-foreground">
            사이트 관련 모든 문의:{' '}
            <a href="mailto:thomaskim104@gmail.com" className="text-primary hover:underline">
              thomaskim104@gmail.com
            </a>
            <span className="mx-2 text-border" aria-hidden>
              ·
            </span>
            자유로운 피드백, 의견 부탁드립니다
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            본 웹사이트는 알라딘의 OpenAPI를 사용해 제작하였습니다. 알라딘에서 많은 구매 부탁드려요!
          </p>
        </footer>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
