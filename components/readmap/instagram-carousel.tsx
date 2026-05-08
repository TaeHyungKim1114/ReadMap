"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  BookOpen,
  TrendingUp,
  PieChart,
  Target,
  Sparkles,
  Calculator,
  Tablet,
  ChevronRight,
  ArrowRight,
} from "lucide-react"

export function InstagramCarousel() {
  return (
    <Carousel className="w-full">
      <CarouselContent>
        <CarouselItem>
          <CoverSlide />
        </CarouselItem>
        <CarouselItem>
          <RoadmapSlide />
        </CarouselItem>
        <CarouselItem>
          <DetailSlide />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious className="left-2 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
      <CarouselNext className="right-2 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
    </Carousel>
  )
}

function CoverSlide() {
  return (
    <div className="aspect-square w-full bg-gradient-to-br from-[#0a0f0d] via-[#0d1a14] to-[#0a0f0d] relative overflow-hidden rounded-lg">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-yellow-glow/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(52, 211, 153, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12">
        {/* Top badge */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1.5 rounded-full border border-emerald/30 bg-emerald/10 backdrop-blur-sm">
            <span className="text-xs font-medium text-emerald tracking-wider uppercase">
              Financial Education
            </span>
          </div>
        </div>

        {/* Main title */}
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
            <span className="text-yellow-glow">월급쟁이</span>에서
            <br />
            <span className="text-emerald">금융 자유</span>까지
          </h1>
          <p className="text-lg text-muted-foreground">
            The Ultimate Wealth Management Roadmap
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-12 w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Your Journey</span>
            <span className="text-emerald">0% → 100%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald to-yellow-glow rounded-full animate-pulse"
              style={{ width: "25%" }}
            />
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-muted-foreground">
            <span>기초</span>
            <span>분석</span>
            <span>배분</span>
            <span>고급</span>
          </div>
        </div>

        {/* Decorative icons */}
        <div className="absolute bottom-24 left-8 flex items-center gap-2 text-emerald/60">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs">Growth</span>
        </div>
        <div className="absolute bottom-24 right-8 flex items-center gap-2 text-yellow-glow/60">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs">Wealth</span>
        </div>

        {/* Swipe indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-muted-foreground">
          <span className="text-xs">Swipe to explore</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function RoadmapSlide() {
  const stages = [
    {
      number: "01",
      title: "Foundation",
      titleKr: "기초 다지기",
      description: "금융 기초 & 저축 습관",
      icon: BookOpen,
      color: "emerald",
    },
    {
      number: "02",
      title: "Stock Analysis",
      titleKr: "주식 분석",
      description: "재무제표 & 가치 평가",
      icon: TrendingUp,
      color: "emerald",
    },
    {
      number: "03",
      title: "Asset Allocation",
      titleKr: "자산 배분",
      description: "포트폴리오 구축 전략",
      icon: PieChart,
      color: "yellow-glow",
    },
    {
      number: "04",
      title: "Advanced Strategy",
      titleKr: "고급 전략",
      description: "세금 최적화 & 부동산",
      icon: Target,
      color: "yellow-glow",
    },
  ]

  return (
    <div className="aspect-square w-full bg-gradient-to-br from-[#0a0f0d] via-[#0d1a14] to-[#0a0f0d] relative overflow-hidden rounded-lg">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-32 h-32 bg-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-40 h-40 bg-yellow-glow/8 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-medium text-emerald tracking-wider uppercase">
            Learning Path
          </span>
          <h2 className="text-xl font-bold text-foreground mt-1">
            재테크 스킬 트리
          </h2>
        </div>

        {/* Skill Tree */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald via-emerald/50 to-yellow-glow" />

            {/* Stages */}
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon
                const isGold = stage.color === "yellow-glow"
                return (
                  <div key={stage.number} className="relative flex items-start gap-4">
                    {/* Node */}
                    <div
                      className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-sm ${
                        isGold
                          ? "bg-yellow-glow/10 border-yellow-glow/30"
                          : "bg-emerald/10 border-emerald/30"
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isGold ? "text-yellow-glow" : "text-emerald"}`} />
                      <span
                        className={`absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          isGold ? "bg-yellow-glow text-background" : "bg-emerald text-background"
                        }`}
                      >
                        {stage.number}
                      </span>
                    </div>

                    {/* Content card */}
                    <div
                      className={`flex-1 p-3 rounded-lg border backdrop-blur-sm ${
                        isGold
                          ? "bg-yellow-glow/5 border-yellow-glow/20"
                          : "bg-emerald/5 border-emerald/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${isGold ? "text-yellow-glow" : "text-emerald"}`}>
                          {stage.title}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-foreground">{stage.titleKr}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald/30" />
          <div className="w-4 h-1.5 rounded-full bg-emerald" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald/30" />
        </div>
      </div>
    </div>
  )
}

function DetailSlide() {
  return (
    <div className="aspect-square w-full bg-gradient-to-br from-[#0a0f0d] via-[#0d1a14] to-[#0a0f0d] relative overflow-hidden rounded-lg">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-32 left-10 w-48 h-48 bg-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-glow/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald/30 bg-emerald/10 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-[10px] font-medium text-emerald uppercase tracking-wider">
              Stage 01 Detail
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground">기초 다지기</h2>
          <p className="text-xs text-muted-foreground mt-1">Foundation Building</p>
        </div>

        {/* Content cards */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Recommended Book Card */}
          <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-emerald" />
              <span className="text-xs font-medium text-emerald uppercase tracking-wider">
                Recommended Book
              </span>
            </div>
            <div className="flex gap-4">
              {/* Book cover placeholder */}
              <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-yellow-glow/20 to-emerald/20 border border-border flex items-center justify-center shrink-0">
                <span className="text-2xl">📖</span>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-base font-bold text-foreground leading-tight">
                  돈의 속성
                </h3>
                <p className="text-xs text-muted-foreground mt-1">김승호 저</p>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="w-3 h-3 rounded-full bg-yellow-glow"
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    필독서
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">
                  부자가 되기 위한 기본 마인드셋과 돈을 대하는 올바른 자세를 배울 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Essential Gear Card */}
          <div className="p-4 rounded-xl border border-yellow-glow/20 bg-yellow-glow/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-glow" />
              <span className="text-xs font-medium text-yellow-glow uppercase tracking-wider">
                Essential Gear
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-secondary/30 flex flex-col items-center gap-2">
                <Calculator className="w-8 h-8 text-yellow-glow" />
                <span className="text-xs font-medium text-foreground text-center">
                  Financial Calculator
                </span>
                <span className="text-[10px] text-muted-foreground">
                  복리 계산 필수
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-secondary/30 flex flex-col items-center gap-2">
                <Tablet className="w-8 h-8 text-yellow-glow" />
                <span className="text-xs font-medium text-foreground text-center">
                  iPad for Charting
                </span>
                <span className="text-[10px] text-muted-foreground">
                  차트 분석용
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald/20 to-yellow-glow/20 border border-emerald/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">나만의 로드맵 생성</p>
              <p className="text-sm font-semibold text-foreground">
                ReadMap에서 시작하기
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-emerald text-background text-xs font-semibold flex items-center gap-1">
              Start
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Footer indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald/30" />
          <div className="w-4 h-1.5 rounded-full bg-emerald" />
        </div>
      </div>
    </div>
  )
}
