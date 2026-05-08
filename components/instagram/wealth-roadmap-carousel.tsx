"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  TrendingUp,
  PieChart,
  Target,
  Sparkles,
  Calculator,
  Tablet,
  ArrowRight,
  CheckCircle2,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function WealthRoadmapCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, 2))
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0))

  return (
    <div className="flex flex-col items-center gap-6 p-4 md:p-8">
      {/* Carousel Container */}
      <div className="relative w-full max-w-[540px] aspect-square">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === 2}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="size-6" />
        </button>

        {/* Slides Container */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Slide 1: Cover */}
            <Slide1Cover />
            {/* Slide 2: Roadmap */}
            <Slide2Roadmap />
            {/* Slide 3: Detail */}
            <Slide3Detail />
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`size-2 rounded-full transition-all ${
                currentSlide === index
                  ? "bg-amber-400 w-6"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => downloadSlide(0)}
        >
          <Download className="size-4" />
          슬라이드 1 다운로드
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => downloadSlide(1)}
        >
          <Download className="size-4" />
          슬라이드 2 다운로드
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => downloadSlide(2)}
        >
          <Download className="size-4" />
          슬라이드 3 다운로드
        </Button>
      </div>
    </div>
  )
}

function downloadSlide(slideIndex: number) {
  const slideElement = document.getElementById(`slide-${slideIndex}`)
  if (!slideElement) return

  // Using html2canvas would be ideal here, but for now we'll alert
  alert(`슬라이드 ${slideIndex + 1} 다운로드 기능은 html2canvas 라이브러리가 필요합니다.`)
}

// Slide 1: Cover
function Slide1Cover() {
  return (
    <div
      id="slide-0"
      className="flex-shrink-0 w-full aspect-square bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm border border-emerald-500/20">
          <Sparkles className="size-5 text-emerald-400" />
        </div>
        <span className="text-emerald-400 font-medium text-sm tracking-wide">
          WEALTH ROADMAP
        </span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center gap-6">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight text-balance">
            사회초년생에서{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              경제적 자유
            </span>
            까지
          </h1>
          <p className="text-lg md:text-xl text-amber-400 font-semibold">
            궁극의 재테크 로드맵
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>시작</span>
            <span>경제적 자유</span>
          </div>
          <div className="h-3 rounded-full bg-slate-800/80 backdrop-blur-sm overflow-hidden border border-slate-700/50">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 animate-[progress_2s_ease-out_forwards] relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <style jsx>{`
            @keyframes progress {
              to {
                width: 100%;
              }
            }
            @keyframes shimmer {
              0%,
              100% {
                transform: translateX(-100%);
              }
              50% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <BookOpen className="size-4" />
          <span>4단계 완성 로드맵</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
          <span>스와이프</span>
          <ArrowRight className="size-4" />
        </div>
      </div>
    </div>
  )
}

// Slide 2: Roadmap Skill Tree
function Slide2Roadmap() {
  const stages = [
    {
      icon: BookOpen,
      title: "기초 다지기",
      subtitle: "Foundation",
      description: "재무제표 읽기, 저축 습관",
      color: "emerald",
    },
    {
      icon: TrendingUp,
      title: "주식 분석",
      subtitle: "Stock Analysis",
      description: "기술적/기본적 분석",
      color: "teal",
    },
    {
      icon: PieChart,
      title: "자산 배분",
      subtitle: "Asset Allocation",
      description: "포트폴리오 구성",
      color: "amber",
    },
    {
      icon: Target,
      title: "고급 전략",
      subtitle: "Advanced Strategy",
      description: "레버리지, 헤지 전략",
      color: "rose",
    },
  ]

  return (
    <div
      id="slide-1"
      className="flex-shrink-0 w-full aspect-square bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">재테크 스킬트리</h2>
        <p className="text-sm text-slate-400">THE ROADMAP</p>
      </div>

      {/* Skill Tree */}
      <div className="relative z-10 flex-1 flex flex-col justify-center gap-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon
          const isLeft = index % 2 === 0
          const colorClasses = {
            emerald: {
              bg: "from-emerald-500/20 to-emerald-600/10",
              border: "border-emerald-500/30",
              text: "text-emerald-400",
              glow: "shadow-emerald-500/20",
            },
            teal: {
              bg: "from-teal-500/20 to-teal-600/10",
              border: "border-teal-500/30",
              text: "text-teal-400",
              glow: "shadow-teal-500/20",
            },
            amber: {
              bg: "from-amber-500/20 to-amber-600/10",
              border: "border-amber-500/30",
              text: "text-amber-400",
              glow: "shadow-amber-500/20",
            },
            rose: {
              bg: "from-rose-500/20 to-rose-600/10",
              border: "border-rose-500/30",
              text: "text-rose-400",
              glow: "shadow-rose-500/20",
            },
          }[stage.color]!

          return (
            <div
              key={index}
              className={`flex items-center gap-3 ${isLeft ? "" : "flex-row-reverse"}`}
            >
              {/* Stage Card */}
              <div
                className={`flex-1 p-3 rounded-xl bg-gradient-to-br ${colorClasses.bg} backdrop-blur-sm border ${colorClasses.border} shadow-lg ${colorClasses.glow}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg bg-slate-900/50 ${colorClasses.text}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        0{index + 1}
                      </span>
                      <h3 className="font-bold text-white text-sm truncate">
                        {stage.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Node */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`size-4 rounded-full bg-gradient-to-br ${colorClasses.bg} border-2 ${colorClasses.border}`}
                />
                {index < stages.length - 1 && (
                  <div className="w-0.5 h-8 bg-gradient-to-b from-slate-600 to-slate-700" />
                )}
              </div>

              {/* Empty Space */}
              <div className="flex-1" />
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center">
        <p className="text-xs text-slate-500">
          각 단계를 클리어하고 다음 레벨로!
        </p>
      </div>
    </div>
  )
}

// Slide 3: Detail View
function Slide3Detail() {
  return (
    <div
      id="slide-2"
      className="flex-shrink-0 w-full aspect-square bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 flex flex-col relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 mb-4">
        <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <span className="text-emerald-400 text-xs font-medium">
            STAGE 01
          </span>
        </div>
        <span className="text-slate-400 text-sm">기초 다지기</span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col gap-4">
        {/* Recommended Book */}
        <div className="p-4 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-start gap-4">
            {/* Book Cover Placeholder */}
            <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/30 flex-shrink-0">
              <div className="text-center p-2">
                <BookOpen className="size-6 text-amber-200 mx-auto mb-1" />
                <span className="text-[8px] text-amber-200 font-medium leading-tight block">
                  돈의 속성
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-amber-400 font-medium">
                  추천 도서
                </span>
                <CheckCircle2 className="size-3 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">돈의 속성</h3>
              <p className="text-sm text-slate-400 mb-2">김승호 저</p>
              <p className="text-xs text-slate-500 line-clamp-2">
                부의 기본 원리와 돈에 대한 올바른 마인드셋을 배우는 필독서
              </p>
            </div>
          </div>
        </div>

        {/* Essential Gear */}
        <div className="p-4 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-sm text-white font-medium">필수 장비</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Calculator className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">재무계산기</p>
                <p className="text-xs text-slate-500">복리 계산 필수</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Tablet className="size-5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">태블릿</p>
                <p className="text-xs text-slate-500">차트 분석용</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="relative z-10 mt-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-amber-500/20 backdrop-blur-sm border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">
                나만의 로드맵 만들기
              </p>
              <p className="text-xs text-slate-400">ReadMap에서 시작하세요</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/30">
              <span>시작하기</span>
              <ArrowRight className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
