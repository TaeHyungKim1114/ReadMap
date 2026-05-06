'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Send, Unlock, PenLine } from 'lucide-react'
import { Book, Review } from '@/lib/book-data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReviewModalProps {
  book: Book | null
  nextBook: Book | null
  onClose: () => void
  onSubmit: (review: Omit<Review, 'id' | 'createdAt'>) => void
  roadmapId: string
  roadmapTitle: string
  userId: string
  userName: string
}

function StarRatingInput({ 
  rating, 
  onRatingChange 
}: { 
  rating: number
  onRatingChange: (rating: number) => void 
}) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              (hoverRating || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewModal({ 
  book, 
  nextBook, 
  onClose, 
  onSubmit,
  roadmapId,
  roadmapTitle,
  userId,
  userName
}: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!book || rating === 0 || content.trim().length < 10) return

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    onSubmit({
      bookId: book.id,
      bookTitle: book.title,
      userId,
      userName,
      userAvatar: '',
      rating,
      content: content.trim(),
      roadmapId,
      roadmapTitle
    })

    setIsSubmitting(false)
    setRating(0)
    setContent('')
    onClose()
  }

  const isValid = rating > 0 && content.trim().length >= 10

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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <PenLine className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">서평 작성하기</h2>
                  <p className="text-sm text-muted-foreground">다음 책을 잠금 해제하려면 서평을 작성하세요</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Book Info */}
            <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-4">
              <div className="flex gap-4">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted p-1 text-center">
                    <span className="text-[8px] font-medium text-foreground leading-tight">
                      {book.title}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                별점 <span className="text-destructive">*</span>
              </label>
              <StarRatingInput rating={rating} onRatingChange={setRating} />
              {rating === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">별점을 선택해주세요</p>
              )}
            </div>

            {/* Review Content */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                서평 내용 <span className="text-destructive">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이 책에서 무엇을 배웠나요? 어떤 점이 인상적이었나요? (최소 10자)"
                className="h-32 w-full resize-none rounded-xl border border-border bg-secondary/50 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {content.length}/10자 이상 {content.length >= 10 && <span className="text-primary">작성 완료</span>}
              </p>
            </div>

            {/* Next Book Preview */}
            {nextBook && (
              <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Unlock className="h-4 w-4" />
                  <span>서평 작성 후 잠금 해제될 책</span>
                </div>
                <p className="mt-2 text-foreground">{nextBook.title}</p>
                <p className="text-xs text-muted-foreground">{nextBook.author}</p>
              </div>
            )}

            {/* Info Note */}
            <div className="mb-6 rounded-lg bg-secondary/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                작성한 서평은 커뮤니티에 자동으로 공유되어 다른 독자들에게 도움이 됩니다.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                나중에 하기
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!isValid || isSubmitting}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  '제출 중...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    서평 제출하기
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
