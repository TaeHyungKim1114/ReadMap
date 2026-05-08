import { WealthRoadmapCarousel } from "@/components/instagram/wealth-roadmap-carousel"

export const metadata = {
  title: "Instagram Carousel - ReadMap",
  description: "재테크 학습 로드맵 인스타그램 캐러셀",
}

export default function InstagramCarouselPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Instagram Carousel Preview
        </h1>
        <p className="text-muted-foreground text-sm">
          좌우 화살표로 슬라이드를 넘기세요
        </p>
      </div>
      <WealthRoadmapCarousel />
    </main>
  )
}
