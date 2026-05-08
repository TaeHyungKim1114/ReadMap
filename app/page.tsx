'use client'

import { useState, useMemo, useEffect } from 'react'
import { AppSidebar } from '@/components/readmap/app-sidebar'
import { SearchBar } from '@/components/readmap/search-bar'
import { ProgressBar } from '@/components/readmap/progress-bar'
import { RoadmapCanvas } from '@/components/readmap/roadmap-canvas'
import { BookDrawer } from '@/components/readmap/book-drawer'
import { ReviewModal } from '@/components/readmap/review-modal'
import { CommunityView } from '@/components/readmap/community-view'
import { RoadmapSelector } from '@/components/readmap/roadmap-selector'
import { AIRoadmapGenerator } from '@/components/readmap/ai-roadmap-generator'
import { MyLibraryView } from '@/components/readmap/my-library-view'
import { SettingsView } from '@/components/readmap/settings-view'
import { AuthForm } from '@/components/readmap/auth-form'
import { BookShareCard } from '@/components/readmap/book-share-card'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { roadmaps as initialRoadmaps, sampleReviews, type Book, type Review, type Roadmap } from '@/lib/book-data'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Edit3, ExternalLink, Save, ShoppingCart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createCoupangSearchUrl, createAladinSearchUrl } from '@/lib/book-data'
import { mergeBranchInfoFromBooks } from '@/lib/branch-info'

type ViewMode = 'roadmap' | 'community' | 'select-roadmap' | 'my-library' | 'settings'
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

type PersistedUserData = {
  roadmaps: Roadmap[]
  reviews: Review[]
  activeRoadmapId: string | null
}

function normalizePersistedUserData(data: PersistedUserData): PersistedUserData {
  const normalizedReviews = Array.isArray(data.reviews)
    ? data.reviews.map((review) => ({
        ...review,
        createdAt:
          review.createdAt instanceof Date
            ? review.createdAt
            : new Date(review.createdAt as unknown as string),
      }))
    : []

  return {
    roadmaps: Array.isArray(data.roadmaps) ? data.roadmaps : [],
    reviews: normalizedReviews,
    activeRoadmapId: data.activeRoadmapId ?? null,
  }
}

function getUserDataStorageKey(userId: string) {
  return `readmap_user_data:${userId}`
}

function loadUserData(userId: string): PersistedUserData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getUserDataStorageKey(userId))
    if (!raw) return null
    return normalizePersistedUserData(JSON.parse(raw) as PersistedUserData)
  } catch {
    return null
  }
}

function saveUserData(userId: string, data: PersistedUserData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getUserDataStorageKey(userId), JSON.stringify(data))
}

async function loadUserDataFromServer(userId: string): Promise<PersistedUserData | null> {
  try {
    const response = await fetch(`/api/user-data?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
    })
    if (response.status === 404) return null
    if (!response.ok) return null
    const payload = (await response.json()) as { data?: PersistedUserData }
    return payload.data ? normalizePersistedUserData(payload.data) : null
  } catch {
    return null
  }
}

async function saveUserDataToServer(userId: string, data: PersistedUserData): Promise<void> {
  try {
    await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data }),
    })
  } catch {
    // Keep local persistence as fallback if network/db write fails.
  }
}

function MainApp() {
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [bookToReview, setBookToReview] = useState<Book | null>(null)
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(initialRoadmaps)
  const [reviews, setReviews] = useState<Review[]>(sampleReviews)
  const [activeRoadmapId, setActiveRoadmapId] = useState(initialRoadmaps[0].id)
  const [viewMode, setViewMode] = useState<ViewMode>('select-roadmap')
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [completedBookForShare, setCompletedBookForShare] = useState<Book | null>(null)
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false)

  useEffect(() => {
    if (!user) {
      setHasLoadedUserData(false)
      return
    }

    let isCancelled = false
    const load = async () => {
      const localPersisted = loadUserData(user.id)
      const serverPersisted = await loadUserDataFromServer(user.id)
      const persisted = serverPersisted ?? localPersisted

      if (isCancelled) return

      if (persisted) {
        const nextRoadmaps = Array.isArray(persisted.roadmaps) && persisted.roadmaps.length > 0
          ? persisted.roadmaps
          : initialRoadmaps
        const nextActiveRoadmapId =
          persisted.activeRoadmapId && nextRoadmaps.some((r) => r.id === persisted.activeRoadmapId)
            ? persisted.activeRoadmapId
            : nextRoadmaps[0]?.id ?? initialRoadmaps[0].id

        setRoadmaps(nextRoadmaps)
        setReviews(Array.isArray(persisted.reviews) ? persisted.reviews : sampleReviews)
        setActiveRoadmapId(nextActiveRoadmapId)
        setSelectedBranch(null)
      } else {
        setRoadmaps(initialRoadmaps)
        setReviews(sampleReviews)
        setActiveRoadmapId(initialRoadmaps[0].id)
        setSelectedBranch(null)
      }

      setHasLoadedUserData(true)
    }

    load()
    return () => {
      isCancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user || !hasLoadedUserData) return
    const data = {
      roadmaps,
      reviews,
      activeRoadmapId: activeRoadmapId ?? null,
    }
    saveUserData(user.id, data)
    void saveUserDataToServer(user.id, data)
  }, [user, hasLoadedUserData, roadmaps, reviews, activeRoadmapId])

  const activeRoadmap = useMemo(() => 
    roadmaps.find(r => r.id === activeRoadmapId) ?? roadmaps[0],
    [roadmaps, activeRoadmapId]
  )

  const filteredBooks = activeRoadmap.books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 사용자의 완료된 책들
  const completedBooks = useMemo(() => {
    return roadmaps.flatMap(r => r.books.filter(b => b.status === 'completed'))
  }, [roadmaps])

  // 사용자의 서평들
  const myReviews = useMemo(() => {
    if (!user) return []
    return reviews.filter(r => r.userId === user.id)
  }, [reviews, user])

  // Find the next book after completing current one based on branch selection
  const getNextBook = (currentBook: Book): Book | null => {
    const roadmap = roadmaps.find(r => r.books.some(b => b.id === currentBook.id))
    if (!roadmap) return null

    // 분기점 책인 경우
    if (currentBook.requiresChoice && selectedBranch) {
      const nextInBranch = roadmap.books.find(
        b => b.branch === selectedBranch && b.prerequisiteIds?.includes(currentBook.id)
      )
      return nextInBranch || null
    }

    // 일반 선형 진행
    const nextBooks = roadmap.books.filter(b => b.prerequisiteIds?.includes(currentBook.id))
    if (nextBooks.length === 1) return nextBooks[0]
    if (nextBooks.length > 1 && selectedBranch) {
      return nextBooks.find(b => b.branch === selectedBranch) || nextBooks[0]
    }
    
    return nextBooks[0] || null
  }

  // Handle marking a book as complete (opens review modal)
  const handleMarkComplete = (book: Book) => {
    setSelectedBook(null)
    setBookToReview(book)
  }

  // Handle direct completion from canvas node (also opens review modal)
  const handleDirectMarkComplete = (book: Book) => {
    setBookToReview(book)
  }

  // Handle review submission
  const handleReviewSubmit = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    // Store the completed book for share card before updating state
    const completedBook = bookToReview

    // Create new review
    const newReview: Review = {
      ...reviewData,
      id: `review-${Date.now()}`,
      createdAt: new Date()
    }
    setReviews(prev => [newReview, ...prev])

    // Update roadmaps - mark current book as completed with review, unlock next
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id !== activeRoadmapId) return roadmap

      const updatedBooks = roadmap.books.map((book) => {
        // Mark reviewed book as completed
        if (book.id === reviewData.bookId) {
          return { ...book, status: 'completed' as const, hasReview: true }
        }
        
        // 다음 책 잠금 해제 로직
        if (book.prerequisiteIds?.includes(reviewData.bookId) && book.status === 'locked') {
          // 모든 선행 조건이 충족되었는지 확인
          const allPrereqsMet = book.prerequisiteIds.every(prereqId => {
            const prereqBook = roadmap.books.find(b => b.id === prereqId)
            return prereqBook?.status === 'completed' || prereqId === reviewData.bookId
          })
          
          if (allPrereqsMet) {
            // 분기가 있는 경우 선택된 분기만 해제, 분기가 없으면 바로 해제
            if (book.branch) {
              if (book.branch === selectedBranch || !selectedBranch) {
                return { ...book, status: 'in-progress' as const }
              }
            } else {
              return { ...book, status: 'in-progress' as const }
            }
          }
        }
        
        return book
      })

      // Recalculate completion percentage
      const completedCount = updatedBooks.filter(b => b.status === 'completed').length
      const completionPercentage = Math.round((completedCount / updatedBooks.length) * 100)

      return { ...roadmap, books: updatedBooks, completionPercentage }
    }))

    setBookToReview(null)
    
    // Show share card after a brief delay for the confetti
    if (completedBook) {
      setTimeout(() => {
        setCompletedBookForShare(completedBook)
      }, 500)
    }
  }

  const handleNavigation = (section: string) => {
    if (section === '#community') {
      setViewMode('community')
    } else if (section === '#explore') {
      setViewMode('select-roadmap')
    } else if (section === '#my-library') {
      setViewMode('my-library')
    } else if (section === '#settings') {
      setViewMode('settings')
    } else {
      setViewMode('roadmap')
    }
  }

  const handleRoadmapSelect = (roadmapId: string) => {
    setActiveRoadmapId(roadmapId)
    setSelectedBranch(null) // 로드맵 변경 시 분기 선택 초기화
    setViewMode('roadmap')
  }

  const handleAIRoadmapGenerated = (newRoadmap: Roadmap) => {
    setRoadmaps(prev => [...prev, newRoadmap])
    setActiveRoadmapId(newRoadmap.id)
    setSelectedBranch(null)
    setViewMode('roadmap')
    setIsEditMode(true) // AI 생성 후 편집 모드로 진입
  }

  const normalizeRoadmap = (raw: RoadmapLike): Roadmap => {
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
      id: raw.id || `generated-${Date.now()}`,
      title: raw.title || 'AI 생성 로드맵',
      description: raw.description || 'AI가 생성한 로드맵입니다.',
      category: raw.category || 'AI',
      icon: raw.icon,
      books: spreadBooks,
      completionPercentage:
        spreadBooks.length > 0
          ? Math.round((spreadBooks.filter(book => book.status === 'completed').length / spreadBooks.length) * 100)
          : 0,
      totalBooks: raw.totalBooks ?? spreadBooks.length,
      estimatedDays: raw.estimatedDays,
      hasBranches: raw.hasBranches ?? hasBranchTracks,
      recommendedItems: Array.isArray(raw.recommendedItems) ? raw.recommendedItems : [],
      branchInfo: normalizedBranchInfo,
    }
  }

  const handleGenerateRoadmap = async () => {
    const prompt = searchQuery.trim()
    if (!prompt || isGenerating) return

    setIsGenerating(true)
    console.log('[generate] request start', { prompt })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        let serverMessage = ''
        try {
          const errorPayload = (await response.json()) as {
            error?: string
            detail?: string
            attempts?: string[]
          }
          const attemptMessage = Array.isArray(errorPayload.attempts) && errorPayload.attempts.length > 0
            ? `\n상세 원인:\n- ${errorPayload.attempts.join('\n- ')}`
            : ''
          serverMessage = `${[errorPayload.error, errorPayload.detail].filter(Boolean).join(' - ')}${attemptMessage}`.trim()
        } catch {
          serverMessage = await response.text()
        }
        throw new Error(`API 요청 실패 (${response.status})${serverMessage ? `: ${serverMessage}` : ''}`)
      }

      const data: unknown = await response.json()
      const payload = data as { roadmap?: RoadmapLike; roadmaps?: RoadmapLike[] }
      console.log('[generate] response payload', payload)

      if (Array.isArray(payload.roadmaps) && payload.roadmaps.length > 0) {
        const firstRoadmap = normalizeRoadmap(payload.roadmaps[0])
        setRoadmaps(prev => {
          const exists = prev.some(roadmap => roadmap.id === firstRoadmap.id)
          if (exists) {
            return prev.map(roadmap =>
              roadmap.id === firstRoadmap.id ? firstRoadmap : roadmap
            )
          }
          return [...prev, firstRoadmap]
        })
        setActiveRoadmapId(firstRoadmap.id)
        setSelectedBranch(null)
        setViewMode('roadmap')
        setSearchQuery('')
        console.log('[generate] applied roadmap from roadmaps[0]', {
          id: firstRoadmap.id,
          nodeCount: firstRoadmap.books.length,
        })
        return
      }

      if (!payload.roadmap) {
        throw new Error('유효한 로드맵 데이터가 없습니다.')
      }

      const generatedRoadmap = normalizeRoadmap(payload.roadmap)
      setRoadmaps(prev => {
        const exists = prev.some(roadmap => roadmap.id === generatedRoadmap.id)
        if (exists) {
          return prev.map(roadmap =>
            roadmap.id === generatedRoadmap.id ? generatedRoadmap : roadmap
          )
        }
        return [...prev, generatedRoadmap]
      })
      setActiveRoadmapId(generatedRoadmap.id)
      setSelectedBranch(null)
      setViewMode('roadmap')
      setSearchQuery('')
      console.log('[generate] applied roadmap', {
        id: generatedRoadmap.id,
        nodeCount: generatedRoadmap.books.length,
      })
    } catch (error) {
      console.error('로드맵 생성 실패:', error)
      toast({
        variant: 'destructive',
        title: '로드맵 생성 실패',
        description:
          error instanceof Error
            ? error.message
            : '로드맵 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsGenerating(false)
      console.log('[generate] request end')
    }
  }

  // 책 삭제 핸들러
  const handleDeleteBook = (bookId: string) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id !== activeRoadmapId) return roadmap

      // 삭제할 책을 찾고 위치 정보 저장
      const deletedBook = roadmap.books.find(b => b.id === bookId)
      if (!deletedBook) return roadmap

      // 책 삭제
      let updatedBooks = roadmap.books.filter(b => b.id !== bookId)

      // 삭제된 책을 prerequisite으로 가진 책들 업데이트
      updatedBooks = updatedBooks.map(book => {
        if (book.prerequisiteIds?.includes(bookId)) {
          // 삭제된 책의 prerequisite을 상속
          const newPrereqs = [
            ...(book.prerequisiteIds.filter(id => id !== bookId)),
            ...(deletedBook.prerequisiteIds || [])
          ]
          return { ...book, prerequisiteIds: newPrereqs.length > 0 ? newPrereqs : undefined }
        }
        return book
      })

      // 위치 재계산
      updatedBooks = updatedBooks.map((book, index) => ({
        ...book,
        position: { x: 40 + index * 160, y: 90 }
      }))

      return { ...roadmap, books: updatedBooks }
    }))
  }

  // 책 추가 핸들러
  const handleAddBook = (afterBookId: string | null) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id !== activeRoadmapId) return roadmap

      const newBookId = `book-${Date.now()}`
      const lastBook = roadmap.books[roadmap.books.length - 1]
      const newPosition = lastBook 
        ? { x: lastBook.position.x + 160, y: 90 }
        : { x: 40, y: 90 }

      const newBook: Book = {
        id: newBookId,
        title: '새 책 추가',
        author: '저자를 입력하세요',
        coverUrl: '',
        status: 'locked',
        difficulty: '보통',
        hasReview: false,
        keyTakeaways: ['핵심 내용을 추가하세요'],
        position: newPosition,
        price: 20000,
        usedPrice: 10000,
        rating: 4.0,
        reviewCount: 0,
        coupangSearchUrl: createCoupangSearchUrl('새 책 추가'),
        aladinItemUrl: createAladinSearchUrl('새 책 추가'),
        isbn: '0000000000',
        prerequisiteIds: afterBookId ? [afterBookId] : undefined,
        whyRead: '이 책을 왜 읽어야 하는지 작성해보세요.'
      }

      return { ...roadmap, books: [...roadmap.books, newBook] }
    }))
  }

  // 로드맵 저장 핸들러
  const handleSaveRoadmap = () => {
    // 실제로는 API 호출 등으로 저장
    setIsEditMode(false)
    // 성공 피드백 (실제 구현에서는 toast 등 사용)
    alert('로드맵이 저장되었습니다!')
  }

  // Why Read 업데이트 핸들러
  const handleUpdateWhyRead = (bookId: string, whyRead: string) => {
    setRoadmaps(prev => prev.map(roadmap => ({
      ...roadmap,
      books: roadmap.books.map(book => 
        book.id === bookId ? { ...book, whyRead } : book
      )
    })))
  }

  // 로드맵 삭제 핸들러
  const handleDeleteRoadmap = (roadmapId: string) => {
    // 최소 1개 로드맵은 유지
    if (roadmaps.length <= 1) {
      alert('최소 1개의 로드맵은 유지해야 합니다.')
      return
    }

    setRoadmaps(prev => prev.filter(r => r.id !== roadmapId))
    
    // 삭제된 로드맵이 현재 활성화된 로드맵이면 다른 로드맵으로 전환
    if (activeRoadmapId === roadmapId) {
      const remaining = roadmaps.filter(r => r.id !== roadmapId)
      if (remaining.length > 0) {
        setActiveRoadmapId(remaining[0].id)
      }
    }
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case 'community': return '커뮤니티 서평'
      case 'select-roadmap': return '로드맵 탐색'
      case 'my-library': return '내 서재'
      case 'settings': return '설정'
      default: return activeRoadmap.title
    }
  }

  const getViewDescription = () => {
    switch (viewMode) {
      case 'community': return '다른 독자들의 서평을 확인하고 인사이트를 얻어보세요'
      case 'select-roadmap': return '관심 있는 로드맵을 선택하고 학습을 시작하세요'
      case 'my-library': return '완료한 책과 작성한 서평을 확인하세요'
      case 'settings': return '계정 설정을 관리하세요'
      default: return activeRoadmap.description
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar 
        onNavigate={handleNavigation} 
        activeSection={
          viewMode === 'community' ? '#community' : 
          viewMode === 'select-roadmap' ? '#explore' : 
          viewMode === 'my-library' ? '#my-library' :
          viewMode === 'settings' ? '#settings' :
          '#roadmap'
        }
        userName={user?.nickname || '독서가'}
        activeRoadmapTitle={activeRoadmap?.title || '로드맵을 선택하세요'}
      />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header with Search */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getViewTitle()}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {getViewDescription()}
              </p>
            </div>
            {viewMode === 'roadmap' && (
              <div className="flex gap-2">
                {isEditMode ? (
                  <Button onClick={handleSaveRoadmap} className="gap-2">
                    <Save className="h-4 w-4" />
                    내 맵 저장하기
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditMode(true)} className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    편집하기
                  </Button>
                )}
              </div>
            )}
          </div>
          {viewMode === 'roadmap' && (
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onGenerate={handleGenerateRoadmap}
              isGenerating={isGenerating}
            />
          )}
        </motion.header>

        {viewMode === 'roadmap' && (
          <>
            {/* Progress Bar */}
            <section className="mb-8">
              <ProgressBar
                percentage={activeRoadmap.completionPercentage}
                title="로드맵 진행률"
              />
            </section>

            {/* Roadmap Canvas */}
            <section className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  학습 경로
                </h2>
                <RoadmapCanvas
                  books={filteredBooks}
                  roadmap={activeRoadmap}
                  onBookSelect={setSelectedBook}
                  selectedBookId={selectedBook?.id ?? null}
                  selectedBranch={selectedBranch}
                  onBranchSelect={setSelectedBranch}
                  isEditable={isEditMode}
                  onDeleteBook={handleDeleteBook}
                  onAddBook={handleAddBook}
                  onSave={handleSaveRoadmap}
                  onMarkComplete={handleDirectMarkComplete}
                />
              </motion.div>
            </section>

            {/* Quick Stats */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">전체 도서</p>
                <p className="text-2xl font-bold text-foreground">{activeRoadmap.books.length}권</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold text-primary">
                  {activeRoadmap.books.filter((b) => b.status === 'completed').length}권
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">읽는 중</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {activeRoadmap.books.filter((b) => b.status === 'in-progress').length}권
                </p>
              </div>
            </motion.section>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-3 text-sm font-semibold text-foreground">이 학습을 시작하기 위해 필요한 필수 장비</h3>
              {(activeRoadmap.recommendedItems?.length ?? 0) > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {activeRoadmap.recommendedItems?.map((item) => (
                    <a
                      key={item.id}
                      href={item.coupangSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                      <span className="ml-3 inline-flex items-center gap-1 text-xs text-primary">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        쿠팡에서 구매
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">AI가 추천한 장비가 아직 없습니다.</p>
              )}
            </motion.section>
          </>
        )}

        {viewMode === 'community' && (
          <CommunityView reviews={reviews} />
        )}

        {viewMode === 'select-roadmap' && (
          <RoadmapSelector 
            roadmaps={roadmaps} 
            activeRoadmapId={activeRoadmapId}
            onSelect={handleRoadmapSelect}
            onOpenAIGenerator={() => setShowAIGenerator(true)}
            onDelete={handleDeleteRoadmap}
          />
        )}

        {viewMode === 'my-library' && (
          <MyLibraryView 
            completedBooks={completedBooks}
            myReviews={myReviews}
          />
        )}

        {viewMode === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Book Detail Drawer */}
      <BookDrawer 
        book={selectedBook} 
        onClose={() => setSelectedBook(null)} 
        onMarkComplete={handleMarkComplete}
        onUpdateWhyRead={handleUpdateWhyRead}
      />

      {/* AI Roadmap Generator Modal */}
      {showAIGenerator && (
        <AIRoadmapGenerator
          onRoadmapGenerated={handleAIRoadmapGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

      {/* Book Share Card Modal */}
      {completedBookForShare && (
        <BookShareCard
          book={completedBookForShare}
          roadmap={activeRoadmap}
          stepNumber={activeRoadmap.books.filter(b => b.status === 'completed').length}
          totalSteps={activeRoadmap.books.length}
          onClose={() => setCompletedBookForShare(null)}
          whyIReadThis={completedBookForShare.whyRead}
        />
      )}

      {/* Review Modal */}
      <ReviewModal
        book={bookToReview}
        nextBook={bookToReview ? getNextBook(bookToReview) : null}
        onClose={() => setBookToReview(null)}
        onSubmit={handleReviewSubmit}
        roadmapId={activeRoadmapId}
        roadmapTitle={activeRoadmap.title}
        userId={user.id}
        userName={user.nickname}
      />

    </div>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
