import Image from 'next/image'
import { Download } from 'lucide-react'

export default function DownloadProfilePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">ReadMap 인스타그램 프로필 이미지</h1>
      <p className="text-muted-foreground mb-8 text-center">
        아래 이미지를 클릭하거나 다운로드 버튼을 눌러 저장하세요
      </p>
      
      <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-border">
        <Image
          src="/instagram-profile.jpg"
          alt="ReadMap Instagram Profile"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <a
        href="/instagram-profile.jpg"
        download="readmap-instagram-profile.jpg"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Download className="w-5 h-5" />
        다운로드
      </a>
      
      <p className="text-sm text-muted-foreground mt-8">
        권장 사이즈: 320x320px (인스타그램 프로필용)
      </p>
    </div>
  )
}
