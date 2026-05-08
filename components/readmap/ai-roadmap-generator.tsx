'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, BookOpen, Target, Wand2, Bot, Brain, Search, Zap, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Roadmap, Book, createCoupangSearchUrl, createAladinSearchUrl } from '@/lib/book-data'
import { mergeBranchInfoFromBooks } from '@/lib/branch-info'
import { useToast } from '@/hooks/use-toast'

interface AIRoadmapGeneratorProps {
  onRoadmapGenerated: (roadmap: Roadmap) => void
  onClose: () => void
}
type ErrorState = {
  message: string
  details?: string[]
  isExpanded: boolean
}

type APINode = {
  id: string
  title?: string
  label?: string
  author?: string
  coupangSearchUrl?: string
  aladinItemUrl?: string
  branch?: string
  requiresChoice?: boolean
  position?: { x: number; y: number }
}

type APIEdge = {
  source: string
  target: string
}

type RoadmapLike = Partial<Roadmap> & {
  nodes?: APINode[]
  edges?: APIEdge[]
}

// 타이프라이터 메시지
const loadingMessages = [
  { icon: Search, text: '100,000권 이상의 도서 데이터베이스를 분석하고 있어요...' },
  { icon: Brain, text: '당신의 목표에 맞는 최적의 학습 경로를 설계하고 있어요...' },
  { icon: Bot, text: 'AI가 난이도와 선후관계를 분석하고 있어요...' },
  { icon: Zap, text: '맞춤형 로드맵을 생성하고 있어요...' },
]

// 샘플 AI 생성 로드맵 데이터
const generateMockAIRoadmap = (goal: string): Roadmap => {
  const id = `ai-${Date.now()}`
  
  const mockBooks: Book[] = [
    {
      id: `${id}-book-1`,
      title: '시작하기: 기초 다지기',
      author: 'AI 추천',
      coverUrl: '/books/ai-rec-1.jpg',
      status: 'in-progress',
      difficulty: '쉬움',
      hasReview: false,
      keyTakeaways: [
        '기본 개념 이해하기',
        '올바른 마인드셋 형성',
        '학습 계획 세우기'
      ],
      position: { x: 40, y: 90 },
      price: 18000,
      usedPrice: 9000,
      rating: 4.5,
      reviewCount: 1234,
      coupangSearchUrl: createCoupangSearchUrl('시작하기 기초 다지기 도서'),
      isbn: '1234567890',
      whyRead: '이 분야에 입문하기 위한 필수 기초서입니다. 쉬운 언어로 핵심 개념을 설명합니다.'
    },
    {
      id: `${id}-book-2`,
      title: '심화 학습: 실전 적용',
      author: 'AI 추천',
      coverUrl: '/books/ai-rec-2.jpg',
      status: 'locked',
      difficulty: '보통',
      hasReview: false,
      keyTakeaways: [
        '실전 케이스 스터디',
        '고급 테크닉 습득',
        '문제 해결 능력 향상'
      ],
      position: { x: 200, y: 90 },
      price: 22000,
      usedPrice: 11000,
      rating: 4.3,
      reviewCount: 567,
      coupangSearchUrl: createCoupangSearchUrl('심화 학습 실전 적용 도서'),
      isbn: '1234567891',
      prerequisiteIds: [`${id}-book-1`],
      whyRead: '기초를 다진 후 실전에 적용하는 방법을 배웁니다.'
    },
    {
      id: `${id}-book-3`,
      title: '마스터리: 전문가 되기',
      author: 'AI 추천',
      coverUrl: '/books/ai-rec-3.jpg',
      status: 'locked',
      difficulty: '어려움',
      hasReview: false,
      keyTakeaways: [
        '전문성 확보',
        '자신만의 방법론 개발',
        '목표 완성'
      ],
      position: { x: 360, y: 90 },
      price: 25000,
      usedPrice: 13000,
      rating: 4.7,
      reviewCount: 890,
      coupangSearchUrl: createCoupangSearchUrl('마스터리 전문가 되기 도서'),
      isbn: '1234567892',
      prerequisiteIds: [`${id}-book-2`],
      whyRead: '전문가 수준의 지식과 통찰을 얻을 수 있습니다.'
    }
  ]

  return {
    id,
    title: `AI 맞춤: ${goal.slice(0, 20)}${goal.length > 20 ? '...' : ''}`,
    description: `"${goal}"를 위한 AI 맞춤형 독서 로드맵입니다.`,
    category: 'AI 생성',
    icon: '🤖',
    completionPercentage: 0,
    totalBooks: mockBooks.length,
    estimatedDays: mockBooks.length * 14,
    hasBranches: false,
    books: mockBooks
  }
}

const sampleGoals = [
  '개발자로서 성장하고 싶어요',
  '투자와 재테크를 배우고 싶어요',
  '창업을 준비하고 있어요',
  '리더십을 키우고 싶어요',
  '마케팅을 배우고 싶어요'
]

const normalizeRoadmap = (raw: RoadmapLike, fallbackGoal: string): Roadmap => {
  if (Array.isArray(raw.books)) {
    return raw as Roadmap
  }

  const nodes = Array.isArray(raw.nodes) ? raw.nodes : []
  const edges = Array.isArray(raw.edges) ? raw.edges : []
  const usedIds = new Set<string>()
  const toNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

  const books: Book[] = nodes.map((node, index) => {
    const baseId = (node.id || `book-${index + 1}`).trim() || `book-${index + 1}`
    let id = baseId
    let suffix = 1
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    usedIds.add(id)

    const incomingCount = edges.filter(edge => edge.target === node.id).length

    return {
      id,
      title: node.title || node.label || `도서 ${index + 1}`,
      author: node.author || '저자 미정',
      coverUrl: '',
      status: incomingCount === 0 ? 'in-progress' : 'locked',
      difficulty: '보통',
      hasReview: false,
      keyTakeaways: [],
      position: {
        x: toNumber(node.position?.x, 40 + index * 160),
        y: toNumber(node.position?.y, 90),
      },
      price: 0,
      usedPrice: 0,
      rating: 0,
      reviewCount: 0,
      coupangSearchUrl: node.coupangSearchUrl || createCoupangSearchUrl(node.title || node.label || `도서 ${index + 1}`),
      aladinItemUrl:
        node.aladinItemUrl ||
        createAladinSearchUrl(`${node.title || node.label || `도서 ${index + 1}`} ${node.author || ''}`.trim()),
      isbn: '',
      branch: node.branch,
      requiresChoice: node.requiresChoice,
      prerequisiteIds: edges
        .filter(edge => edge.target === node.id)
        .map(edge => edge.source),
      whyRead: '',
    }
  })

  const spreadBooks = books.map((book, index, arr) => {
    const hasCollision = arr.some((other, otherIndex) => {
      if (otherIndex === index) return false
      return (
        Math.abs(other.position.x - book.position.x) < 70 &&
        Math.abs(other.position.y - book.position.y) < 70
      )
    })

    if (!hasCollision) return book
    return {
      ...book,
      position: {
        x: 40 + index * 170,
        y: 90 + (index % 2) * 70,
      },
    }
  })
  const inferredTrackIds = Array.from(
    new Set(spreadBooks.map((book) => book.branch).filter(Boolean))
  ) as string[]
  const hasBranchTracks = inferredTrackIds.length > 0
  const normalizedBranchInfo = mergeBranchInfoFromBooks(
    raw.branchInfo,
    spreadBooks.map((b) => ({
      id: b.id,
      branch: b.branch,
      requiresChoice: b.requiresChoice,
      title: b.title,
    })),
    { topicHint: (raw.title || '').trim() || undefined }
  )

  return {
    id: raw.id || `ai-${Date.now()}`,
    title: raw.title || `AI 맞춤: ${fallbackGoal.slice(0, 20)}${fallbackGoal.length > 20 ? '...' : ''}`,
    description: raw.description || `"${fallbackGoal}"를 위한 AI 맞춤형 독서 로드맵입니다.`,
    category: raw.category || 'AI 생성',
    icon: raw.icon || '🤖',
    completionPercentage: 0,
    totalBooks: spreadBooks.length,
    estimatedDays: spreadBooks.length * 14,
    hasBranches: raw.hasBranches ?? hasBranchTracks,
    recommendedItems: Array.isArray(raw.recommendedItems) ? raw.recommendedItems : [],
    branchInfo: normalizedBranchInfo,
    books: spreadBooks,
  }
}

// 타이프라이터 컴포넌트
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 30)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, onComplete])

  return (
    <span>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export function AIRoadmapGenerator({ onRoadmapGenerated, onClose }: AIRoadmapGeneratorProps) {
  const { toast } = useToast()
  const [goal, setGoal] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [generatedRoadmap, setGeneratedRoadmap] = useState<Roadmap | null>(null)
  const [errorState, setErrorState] = useState<ErrorState | null>(null)

  const handleGenerate = async () => {
    if (!goal.trim() || isGenerating) return

    setIsGenerating(true)
    setCurrentMessageIndex(0)
    setErrorState(null)
    let loadingInterval: ReturnType<typeof setInterval> | undefined
    try {
      loadingInterval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % (loadingMessages.length + 1))
      }, 1000)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: goal.trim() }),
      })

      if (!response.ok) {
        let errorMessage = '일시적으로 AI 로드맵 생성에 실패했어요.'
        let errorDetails: string[] = []
        
        try {
          const errorPayload = (await response.json()) as {
            error?: string
            detail?: string
            attempts?: string[]
          }
          
          if (errorPayload.error) {
            errorMessage = errorPayload.error
          }
          
          if (Array.isArray(errorPayload.attempts) && errorPayload.attempts.length > 0) {
            errorDetails = errorPayload.attempts
          }
          
          if (errorPayload.detail) {
            errorDetails = [errorPayload.detail, ...errorDetails]
          }
        } catch {
          errorMessage = '서버와의 통신 중 오류가 발생했어요.'
        }
        
        setErrorState({
          message: errorMessage,
          details: errorDetails.length > 0 ? errorDetails : undefined,
          isExpanded: false,
        })
        
        toast({
          variant: 'destructive',
          title: '로드맵 생성 실패',
          description: '잠시 후 다시 시도해주세요.',
        })
        return
      }

      const payload = (await response.json()) as { roadmap?: RoadmapLike; roadmaps?: RoadmapLike[] }
      if (Array.isArray(payload.roadmaps) && payload.roadmaps.length > 0) {
        setGeneratedRoadmap(normalizeRoadmap(payload.roadmaps[0], goal))
      } else if (payload.roadmap) {
        setGeneratedRoadmap(normalizeRoadmap(payload.roadmap, goal))
      } else {
        // Shape mismatch fallback
        setGeneratedRoadmap(generateMockAIRoadmap(goal))
      }
    } catch (error) {
      console.error('AI 로드맵 생성 실패:', error)
      
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch')
      
      setErrorState({
        message: isNetworkError 
          ? '네트워크 연결을 확인해주세요.' 
          : '일시적으로 AI 로드맵 생성에 실패했어요.',
        details: error instanceof Error ? [error.message] : undefined,
        isExpanded: false,
      })
      
      toast({
        variant: 'destructive',
        title: '로드맵 생성 실패',
        description: '잠시 후 다시 시도해주세요.',
      })
    } finally {
      if (loadingInterval) clearInterval(loadingInterval)
      setIsGenerating(false)
      setCurrentMessageIndex(loadingMessages.length)
    }
  }

  const handleConfirm = () => {
    if (generatedRoadmap) {
      onRoadmapGenerated(generatedRoadmap)
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-6 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">AI 맞춤형 로드맵 생성</h2>
          <p className="mt-2 text-muted-foreground">
            달성하고 싶은 목표를 입력하면 AI가 최적의 독서 로드맵을 추천해드려요
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              {/* AI 분석 애니메이션 */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-primary/30 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-10 w-10 text-primary animate-bounce" />
                  </div>
                  {/* 궤도 애니메이션 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-primary" />
                  </motion.div>
                </div>
              </div>

              {/* 로딩 메시지들 */}
              <div className="space-y-3">
                {loadingMessages.map((msg, index) => {
                  const Icon = msg.icon
                  const isActive = index === currentMessageIndex - 1
                  const isPast = index < currentMessageIndex - 1

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: index < currentMessageIndex ? 1 : 0.3,
                        x: 0 
                      }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 transition-all',
                        isActive && 'border-primary bg-primary/10',
                        isPast && 'border-primary/30 bg-primary/5',
                        !isActive && !isPast && 'border-border'
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        isActive || isPast ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        'text-sm',
                        isActive ? 'text-foreground font-medium' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      )}>
                        {isActive ? (
                          <TypewriterText text={msg.text} />
                        ) : (
                          msg.text
                        )}
                      </span>
                      {isPast && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto text-primary"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : !generatedRoadmap ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Error State */}
              {errorState && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive">로드맵 생성 실패</h4>
                      <p className="mt-1 text-sm text-destructive/80">{errorState.message}</p>
                      <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
                      
                      {/* Error Details (Collapsible) */}
                      {errorState.details && errorState.details.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => setErrorState(prev => prev ? { ...prev, isExpanded: !prev.isExpanded } : null)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {errorState.isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            상세 정보 {errorState.isExpanded ? '접기' : '보기'}
                          </button>
                          
                          <AnimatePresence>
                            {errorState.isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 rounded-lg bg-background/50 p-3 text-xs font-mono text-muted-foreground">
                                  {errorState.details.map((detail, idx) => (
                                    <p key={idx} className="mb-1 last:mb-0">- {detail}</p>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      
                      {/* Retry Button */}
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !goal.trim()}
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                        다시 시도하기
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Goal Input */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  어떤 것을 얻고 싶으신가요?
                </label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value)
                      if (errorState) setErrorState(null)
                    }}
                    placeholder="예: 개발자로서 성장하고 싶어요"
                    className="w-full rounded-xl border border-border bg-background py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
              </div>

              {/* Sample Goals */}
              <div className="mb-6">
                <p className="mb-3 text-xs font-medium text-muted-foreground">추천 목표</p>
                <div className="flex flex-wrap gap-2">
                  {sampleGoals.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => setGoal(sample)}
                      className={cn(
                        'rounded-full border border-border px-3 py-1.5 text-xs transition-all',
                        goal === sample
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!goal.trim() || isGenerating}
                className="w-full gap-2 py-6 text-base"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    로드맵 생성하기
                  </>
                )}
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                AI는 입력한 목표를 분석하여 단계별 독서 로드맵을 추천합니다
              </p>
              
              {/* Admin Help Text */}
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  로드맵 생성이 계속 실패한다면, 서버 환경변수 설정 및 배포 상태를 확인해주세요.
                  환경변수 변경 후에는 재배포가 필요합니다.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Generated Roadmap Preview */}
              <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{generatedRoadmap.title}</h3>
                    <p className="text-sm text-muted-foreground">{generatedRoadmap.description}</p>
                  </div>
                </div>

                {/* Books Preview */}
                <div className="space-y-3">
                  {generatedRoadmap.books.map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{book.title}</p>
                        <p className="text-xs text-muted-foreground">난이도: {book.difficulty}</p>
                      </div>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        book.status === 'in-progress' 
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {book.status === 'in-progress' ? '시작' : '잠금'}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    총 {generatedRoadmap.totalBooks}권 · 예상 {generatedRoadmap.estimatedDays}일
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedRoadmap(null)}
                  className="flex-1"
                >
                  다시 생성하기
                </Button>
                <Button onClick={handleConfirm} className="flex-1 gap-2">
                  <Sparkles className="h-4 w-4" />
                  이 로드맵 시작하기
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
