'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, StarHalf, ExternalLink, Check, PenLine, Lock, Edit3, ShoppingCart, BookMarked, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Book, createCoupangSearchUrl, createAladinSearchUrl, formatPrice, Difficulty } from '@/lib/book-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BookDrawerProps {
  book: Book | null
  onClose: () => void
  onMarkComplete: (book: Book) => void
  onUpdateWhyRead?: (bookId: string, whyRead: string) => void
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, { bg: string; text: string; label: string }> = {
    '쉬움': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Beginner' },
    '보통': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Intermediate' },
    '어려움': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Expert' },
  }

  const style = styles[difficulty]

  return (
    <Badge variant="outline" className={cn('font-medium border-0', style.bg, style.text)}>
      {style.label} · {difficulty}
    </Badge>
  )
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
      ))}
    </div>
  )
}

export function BookDrawer({ book, onClose, onMarkComplete, onUpdateWhyRead }: BookDrawerProps) {
  const coupangUrl = book ? book.coupangSearchUrl || createCoupangSearchUrl(book.title) : ''
  const aladinUrl = book
    ? book.aladinItemUrl || createAladinSearchUrl(`${book.title} ${book.author}`.trim())
    : ''
  const [isEditingWhyRead, setIsEditingWhyRead] = useState(false)
  const [whyReadText, setWhyReadText] = useState('')

  useEffect(() => {
    if (book) {
      setWhyReadText(book.whyRead || '이 책을 읽어야 하는 이유를 작성해보세요.')
      setIsEditingWhyRead(false)
    }
  }, [book])

  const handleSaveWhyRead = () => {
    if (book && onUpdateWhyRead) {
      onUpdateWhyRead(book.id, whyReadText)
    }
    setIsEditingWhyRead(false)
  }

  return (
    <AnimatePresence>
      {book && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-foreground">도서 상세정보</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              {/* Book Cover */}
              <div className="relative mx-auto mb-6 h-64 w-44 overflow-hidden rounded-xl bg-secondary shadow-xl">
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary via-muted to-secondary p-4 text-center">
                  <span className="text-sm font-bold text-foreground leading-tight">
                    {book.title}
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground">{book.author}</span>
                </div>
                
                {/* Status overlay for locked books */}
                {book.status === 'locked' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <Lock className="h-8 w-8 text-white mb-2" />
                    <span className="text-sm font-medium text-white text-center px-4">
                      이전 책의 서평을 작성하면 잠금 해제됩니다
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Author */}
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold text-foreground">{book.title}</h3>
                <p className="text-muted-foreground">{book.author}</p>
              </div>

              {/* Badges */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                <DifficultyBadge difficulty={book.difficulty} />
                <Badge
                  variant="outline"
                  className={cn(
                    'font-medium border-0',
                    book.status === 'completed' && 'bg-primary/20 text-primary',
                    book.status === 'in-progress' && 'bg-yellow-500/20 text-yellow-400',
                    book.status === 'locked' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {book.status === 'completed' ? '완료' : book.status === 'in-progress' ? '읽는 중' : '잠금'}
                </Badge>
                {book.hasReview && (
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-0">
                    서평 완료
                  </Badge>
                )}
              </div>

              {/* Complete Button for in-progress books */}
              {book.status === 'in-progress' && (
                <div className="mb-6">
                  <Button
                    onClick={() => {
                      // Trigger confetti
                      confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
                      })
                      onMarkComplete(book)
                    }}
                    className="w-full bg-gradient-to-r from-primary via-emerald-500 to-primary text-primary-foreground hover:opacity-90 h-14"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    다 읽었어요! 서평 작성하기
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    서평을 작성하면 다음 책이 잠금 해제되고 공유 카드를 만들 수 있어요
                  </p>
                </div>
              )}

              {/* Why Read This - Editable */}
              <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">이 책을 왜 읽어야 할까요?</h4>
                  </div>
                  {onUpdateWhyRead && (
                    <button
                      onClick={() => setIsEditingWhyRead(!isEditingWhyRead)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {isEditingWhyRead ? (
                  <div className="space-y-2">
                    <textarea
                      value={whyReadText}
                      onChange={(e) => setWhyReadText(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={4}
                      placeholder="이 책을 읽어야 하는 이유를 작성해보세요..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveWhyRead}
                        className="flex-1"
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setWhyReadText(book.whyRead || '')
                          setIsEditingWhyRead(false)
                        }}
                        className="flex-1"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {whyReadText || '이 책을 읽어야 하는 이유를 작성해보세요.'}
                  </p>
                )}
              </div>

              {/* Marketplace Rating Section */}
              <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 items-center rounded bg-[#f97316] px-2">
                    <span className="text-xs font-bold text-white">쿠팡</span>
                  </div>
                  <span className="text-sm text-muted-foreground">사용자 평점</span>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating rating={book.rating} />
                  <span className="text-lg font-bold text-foreground">{book.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({book.reviewCount.toLocaleString()}개 리뷰)
                  </span>
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold text-foreground">핵심 내용</h4>
                <ul className="space-y-2">
                  {book.keyTakeaways.map((takeaway, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{takeaway}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Purchase: Aladin (API product link when available) then Coupang */}
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full h-14 bg-[#0066d4] text-white hover:bg-[#0052a8]"
                  size="lg"
                >
                  <a href={aladinUrl} target="_blank" rel="noopener noreferrer">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5" />
                        <span className="font-semibold">알라딘에서 구매</span>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </a>
                </Button>

                <Button
                  asChild
                  className="w-full bg-[#f97316] text-white hover:bg-[#ea580c] h-14"
                  size="lg"
                >
                  <a href={coupangUrl} target="_blank" rel="noopener noreferrer">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="font-semibold">쿠팡 최저가 확인</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{formatPrice(book.price)}</span>
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </div>
                  </a>
                </Button>
              </div>
              
              <p className="mt-4 text-center text-xs text-muted-foreground">
                ISBN: {book.isbn}
              </p>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                알라딘 버튼은 검색 결과 중 일치 도서의 상품 페이지( Open API 제공 링크 )로 연결됩니다. 링크가 없으면 알라딘 검색으로 이동합니다.
              </p>
              <p className="mt-2 text-center text-xs text-gray-400">
                이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
