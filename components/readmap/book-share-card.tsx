'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Instagram, BookOpen, QrCode, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Book, Roadmap } from '@/lib/book-data'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface BookShareCardProps {
  book: Book
  roadmap: Roadmap
  stepNumber: number
  totalSteps: number
  onClose: () => void
  whyIReadThis?: string
}

export function BookShareCard({ 
  book, 
  roadmap, 
  stepNumber, 
  totalSteps, 
  onClose,
  whyIReadThis 
}: BookShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Confetti effect on mount
  useEffect(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsDownloading(true)

    try {
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      })
      
      const link = document.createElement('a')
      link.download = `readmap-${book.title}-completion.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Celebration Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">축하합니다!</span>
              <Sparkles className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Share Card - Instagram Story Size (9:16 aspect ratio scaled down) */}
          <div
            ref={cardRef}
            className="relative mx-auto aspect-[9/16] w-80 overflow-hidden rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          >
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative flex h-full flex-col items-center justify-between p-6 text-white">
              {/* Top Section - Logo & Step */}
              <div className="w-full text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-90">ReadMap</span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                  <span className="text-xs font-medium">
                    Step {stepNumber} of {totalSteps} 완료
                  </span>
                </div>
              </div>

              {/* Middle Section - Book Info */}
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                {/* Book Cover Placeholder */}
                <div className="mb-6 h-48 w-32 rounded-xl bg-white/20 shadow-2xl backdrop-blur-sm overflow-hidden">
                  <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                    <span className="text-sm font-bold leading-tight">{book.title}</span>
                    <span className="mt-2 text-xs opacity-80">{book.author}</span>
                  </div>
                </div>

                {/* Book Title & Author */}
                <h2 className="mb-1 text-center text-xl font-bold">{book.title}</h2>
                <p className="mb-4 text-sm opacity-80">{book.author}</p>

                {/* Quote or Why I Read This */}
                {(whyIReadThis || book.keyTakeaways[0]) && (
                  <div className="max-w-[250px] rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-center text-xs leading-relaxed opacity-90">
                      &ldquo;{whyIReadThis || book.keyTakeaways[0]}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Section - Roadmap Info & QR */}
              <div className="w-full">
                <div className="mb-4 text-center">
                  <p className="text-xs opacity-70">로드맵</p>
                  <p className="font-semibold">{roadmap.title}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">readmap.app</span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                    <QrCode className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:opacity-90"
              size="lg"
            >
              <Download className="h-5 w-5" />
              {isDownloading ? '다운로드 중...' : '스토리 이미지 다운로드'}
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  // Instagram share (opens Instagram)
                  window.open('https://www.instagram.com/', '_blank')
                }}
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  // Generic share
                  if (navigator.share) {
                    navigator.share({
                      title: `${book.title} 완료!`,
                      text: `ReadMap에서 "${roadmap.title}" 로드맵의 ${stepNumber}단계를 완료했습니다!`,
                      url: window.location.href,
                    })
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                공유하기
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
