'use client'

import { motion } from 'framer-motion'
import { ChevronRight, BookOpen, Users, Sparkles, Trash2, Pin, PinOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Roadmap } from '@/lib/book-data'
import { cn } from '@/lib/utils'

interface RoadmapSelectorProps {
  roadmaps: Roadmap[]
  activeRoadmapId: string
  onSelect: (roadmapId: string) => void
  onOpenAIGenerator: () => void
  onDelete: (roadmapId: string) => void
  onTogglePin: (roadmapId: string) => void
}

function RoadmapCard({ 
  roadmap, 
  isActive, 
  onClick,
  onDelete,
  onTogglePin,
  index 
}: { 
  roadmap: Roadmap
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onTogglePin: () => void
  index: number
}) {
  const completedBooks = roadmap.books.filter(b => b.status === 'completed').length

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all',
        isActive
          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(52,211,153,0.15)]'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl text-2xl',
            isActive ? 'bg-primary/20' : 'bg-secondary'
          )}>
            {roadmap.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{roadmap.title}</h3>
            <p className="text-xs text-muted-foreground">{roadmap.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title={roadmap.isPinned ? '상단 고정 해제' : '상단 고정'}
          >
            {roadmap.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </div>
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('정말로 이 로드맵을 삭제하시겠습니까?')) {
                onDelete()
              }
            }}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </div>
          <ChevronRight className={cn(
            'h-5 w-5 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )} />
        </div>
      </div>
      
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {roadmap.description}
      </p>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{completedBooks}/{roadmap.books.length}권 완료</span>
        </div>
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${roadmap.completionPercentage}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
              className={cn(
                'h-full rounded-full',
                isActive ? 'bg-primary' : 'bg-muted-foreground'
              )}
            />
          </div>
        </div>
        <span className={cn(
          'text-xs font-medium',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}>
          {roadmap.completionPercentage}%
        </span>
      </div>
    </motion.button>
  )
}

export function RoadmapSelector({ roadmaps, activeRoadmapId, onSelect, onOpenAIGenerator, onDelete, onTogglePin }: RoadmapSelectorProps) {
  return (
    <div className="space-y-6">
      {/* AI 로드맵 생성 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          onClick={onOpenAIGenerator}
          className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-600 py-6 text-base hover:from-primary/90 hover:to-emerald-600/90"
        >
          <Sparkles className="h-5 w-5" />
          AI 맞춤형 로드맵 생성하기
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          목표를 입력하면 AI가 최적의 독서 로드맵을 추천해드려요
        </p>
      </motion.div>

      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">내 로드맵</h2>
        <span className="text-sm text-muted-foreground">({roadmaps.length}개)</span>
      </div>
      <div className="grid gap-3">
        {roadmaps.map((roadmap, index) => (
          <RoadmapCard
            key={roadmap.id}
            roadmap={roadmap}
            isActive={activeRoadmapId === roadmap.id}
            onClick={() => onSelect(roadmap.id)}
            onDelete={() => onDelete(roadmap.id)}
            onTogglePin={() => onTogglePin(roadmap.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
