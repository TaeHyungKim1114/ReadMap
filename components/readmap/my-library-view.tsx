'use client'

import { motion } from 'framer-motion'
import { Book, Review, createCoupangSearchUrl, createAladinSearchUrl, formatDate, formatPrice } from '@/lib/book-data'
import { useAuth } from '@/lib/auth-context'
import { Star, BookOpen, Calendar, ExternalLink, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MyLibraryViewProps {
  completedBooks: Book[]
  myReviews: Review[]
}

export function MyLibraryView({ completedBooks, myReviews }: MyLibraryViewProps) {
  const { user } = useAuth()

  const getReviewForBook = (bookId: string) => {
    return myReviews.find(r => r.bookId === bookId)
  }

  if (completedBooks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">아직 완료한 책이 없습니다</h3>
        <p className="mt-2 text-center text-muted-foreground">
          로드맵에서 책을 읽고 서평을 작성하면<br />
          여기에 기록됩니다.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">완료한 책</p>
          <p className="text-2xl font-bold text-primary">{completedBooks.length}권</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">작성한 서평</p>
          <p className="text-2xl font-bold text-foreground">{myReviews.length}개</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">평균 평점</p>
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold text-foreground">
              {myReviews.length > 0 
                ? (myReviews.reduce((acc, r) => acc + r.rating, 0) / myReviews.length).toFixed(1)
                : '-'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 완료한 책 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">내가 읽은 책</h3>
        
        <div className="grid gap-4">
          {completedBooks.map((book, index) => {
            const review = getReviewForBook(book.id)
            
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex gap-6">
                  {/* 책 커버 */}
                  <div className="h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted p-2 text-center">
                      <span className="text-xs font-semibold text-foreground leading-tight line-clamp-3">
                        {book.title}
                      </span>
                      <span className="mt-1 text-[10px] text-muted-foreground">{book.author}</span>
                    </div>
                  </div>

                  {/* 책 정보 및 서평 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        book.difficulty === '쉬움' ? 'bg-green-500/10 text-green-400' :
                        book.difficulty === '보통' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {book.difficulty}
                      </span>
                    </div>

                    {/* 내 서평 */}
                    {review ? (
                      <div className="mt-4 rounded-lg bg-secondary/50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(new Date(review.createdAt))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {review.content}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center">
                        <p className="text-sm text-muted-foreground">서평이 없습니다</p>
                      </div>
                    )}

                    {/* 쿠팡 링크 */}
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      <div className="mr-auto text-sm">
                        <span className="text-muted-foreground">구매가: </span>
                        <span className="font-medium text-foreground">{formatPrice(book.price)}</span>
                      </div>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a
                          href={book.aladinItemUrl || createAladinSearchUrl(`${book.title} ${book.author}`.trim())}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          알라딘
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a
                          href={book.coupangSearchUrl || createCoupangSearchUrl(book.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          쿠팡
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
