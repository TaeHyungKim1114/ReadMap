'use client'

import { motion } from 'framer-motion'
import { Star, MessageSquare, BookOpen, User } from 'lucide-react'
import { Review, formatDate } from '@/lib/book-data'
import { cn } from '@/lib/utils'

interface CommunityViewProps {
  reviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            rating >= star
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  // Generate avatar color based on username
  const avatarColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ]
  const avatarColor = avatarColors[review.userName.charCodeAt(0) % avatarColors.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white', avatarColor)}>
            {review.userAvatar ? (
              <img src={review.userAvatar} alt={review.userName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{review.userName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {/* Book Info */}
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{review.bookTitle}</span>
        <span className="text-xs text-muted-foreground">| {review.roadmapTitle}</span>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {review.content}
      </p>
    </motion.div>
  )
}

export function CommunityView({ reviews }: CommunityViewProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-border bg-card/50">
        <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">아직 서평이 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">첫 번째 서평을 작성해보세요!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">커뮤니티 서평</h2>
        </div>
        <span className="text-sm text-muted-foreground">{reviews.length}개의 서평</span>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((review, index) => (
          <ReviewCard key={review.id} review={review} index={index} />
        ))}
      </div>
    </div>
  )
}
