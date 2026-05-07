import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ReadMap - 부의 성장을 위한 독서 로드맵',
  description: '큐레이션된 독서 로드맵으로 부의 축적과 테크 투자를 마스터하세요. 인터랙티브 스킬 트리로 학습 여정을 추적하세요.',
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
        <footer className="border-t border-border py-8 text-center bg-background">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              사이트 관련 모든 문의:{' '}
              <a href="mailto:thomaskim104@gmail.com" className="text-primary hover:underline">
                thomaskim104@gmail.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              자유로운 피드백, 의견 부탁드립니다
            </p>
          </div>
        </footer>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
