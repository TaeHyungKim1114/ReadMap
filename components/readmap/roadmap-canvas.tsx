'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Book, type BookStatus, Roadmap } from '@/lib/book-data'
import { cn } from '@/lib/utils'
import { Lock, CheckCircle2, Clock, GitBranch, X, Plus, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'

interface RoadmapCanvasProps {
  books: Book[]
  roadmap: Roadmap
  onBookSelect: (book: Book) => void
  selectedBookId: string | null
  selectedBranch: string | null
  onBranchSelect: (branch: string) => void
  // 편집 기능
  isEditable?: boolean
  onDeleteBook?: (bookId: string) => void
  onAddBook?: (afterBookId: string | null) => void
  onSave?: () => void
  // 완료 기능
  onMarkComplete?: (book: Book) => void
}

function triggerConfettiAtElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x, y },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
    zIndex: 100,
  })
}

function BookNode({
  book,
  onClick,
  isSelected,
  index,
  isInSelectedBranch,
  isEditable,
  onDelete,
  onMarkComplete,
  trackColor,
}: {
  book: Book
  onClick: () => void
  isSelected: boolean
  index: number
  isInSelectedBranch: boolean
  isEditable?: boolean
  onDelete?: () => void
  onMarkComplete?: () => void
  trackColor?: string
}) {
  const statusStyles: Record<BookStatus, string> = {
    completed: 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(52,211,153,0.4)]',
    'in-progress': 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse',
    locked: 'border-border bg-card/50 opacity-60',
  }

  const StatusIcon = {
    completed: CheckCircle2,
    'in-progress': Clock,
    locked: Lock,
  }[book.status]

  const isUnselectedBranch = book.branch && !isInSelectedBranch

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkComplete) {
      // Trigger confetti at this node
      const target = e.currentTarget.closest('[data-book-node]') as HTMLElement
      if (target) {
        triggerConfettiAtElement(target)
      }
      onMarkComplete()
    }
  }

  return (
    <motion.div
      data-book-node
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isUnselectedBranch ? 0.3 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: book.status !== 'locked' || !isUnselectedBranch ? 1.08 : 1 }}
      whileTap={{ scale: book.status !== 'locked' ? 0.95 : 1 }}
      onClick={onClick}
      className={cn(
        'absolute cursor-pointer rounded-xl border-2 p-2 transition-all duration-300 group',
        statusStyles[book.status],
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        book.branch && 'border-l-4',
        book.status === 'completed' && 'border-primary ring-2 ring-primary/30'
      )}
      style={{
        left: book.position.x,
        top: book.position.y,
        borderLeftColor: book.branch ? trackColor : undefined,
      }}
    >
      {/* Golden glow for completed books */}
      {book.status === 'completed' && (
        <motion.div
          className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 via-yellow-400/30 to-primary/30 blur-md -z-10"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Delete button for editable mode */}
      {isEditable && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="relative h-20 w-14">
        <div className="h-full w-full overflow-hidden rounded-md bg-secondary">
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted p-1 text-center">
            <span className="text-[9px] font-semibold text-foreground leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        </div>
        
        {/* Status Icon - outside overflow container */}
        {!isEditable && (
          <div
            className={cn(
              'absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card',
              book.status === 'completed' && 'bg-primary text-primary-foreground',
              book.status === 'in-progress' && 'bg-yellow-500 text-yellow-950',
              book.status === 'locked' && 'bg-muted text-muted-foreground'
            )}
          >
            <StatusIcon className="h-3 w-3" />
          </div>
        )}

        {/* Branch indicator - outside overflow container */}
        {book.branch && !isEditable && (
          <div
            className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold text-white"
            style={{ backgroundColor: trackColor ?? '#3b82f6' }}
          >
            {book.branch}
          </div>
        )}

        {/* Step number badge for completed books */}
        {book.status === 'completed' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex h-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-emerald-400 px-2"
          >
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </motion.div>
        )}
      </div>
      
      <p className="mt-1 max-w-14 text-center text-[8px] font-medium text-foreground line-clamp-2">
        {book.author}
      </p>

      {/* Mark as Complete button for in-progress books */}
      {book.status === 'in-progress' && onMarkComplete && !isEditable && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleMarkComplete}
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-1 text-[8px] font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          다 읽었어요
        </motion.button>
      )}
    </motion.div>
  )
}

function AddBookButton({
  position,
  onClick,
}: {
  position: { x: number; y: number }
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="absolute flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-card/50 text-primary transition-all hover:border-primary hover:bg-primary/10"
      style={{ left: position.x, top: position.y }}
    >
      <Plus className="h-5 w-5" />
    </motion.button>
  )
}

function ConnectionLine({
  from,
  to,
  status,
  index,
  branch,
  branchColor,
  isInSelectedBranch,
  isCompleted,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  status: BookStatus
  index: number
  branch?: string
  branchColor?: string
  isInSelectedBranch: boolean
  isCompleted?: boolean
}) {
  // 가로 레이아웃 기준 - 노드 크기 조정
  const nodeWidth = 72 // w-14 (56px) + padding
  const nodeHeight = 104 // h-20 (80px) + padding + text

  const fromX = from.x + nodeWidth / 2
  const fromY = from.y + nodeHeight / 2
  const toX = to.x + nodeWidth / 2
  const toY = to.y + nodeHeight / 2

  // 가로 연결선 - 부드러운 곡선
  const midX = (fromX + toX) / 2
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`

  const getStrokeColor = () => {
    if (isCompleted) return 'url(#completedGradient)'
    if (branch && branchColor) return branchColor
    if (status === 'completed') return 'var(--primary)'
    if (status === 'in-progress') return '#eab308'
    return 'var(--border)'
  }

  return (
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: isInSelectedBranch ? 1 : 0.2 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
      d={path}
      fill="none"
      stroke={getStrokeColor()}
      strokeWidth={isCompleted ? 3 : 2}
      strokeLinecap="round"
      strokeDasharray={status === 'locked' ? '6 6' : '0'}
      className="transition-all duration-300"
    />
  )
}

function ProgressLine({ books }: { books: Book[] }) {
  const completedCount = books.filter(b => b.status === 'completed').length
  const totalCount = books.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="absolute bottom-12 left-6 right-6 h-2">
      <div className="h-full w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary"
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Step 1</span>
        <span className="font-medium text-primary">{completedCount}/{totalCount} 완료</span>
        <span>Step {totalCount}</span>
      </div>
    </div>
  )
}

function BranchSelector({
  branchInfo,
  selectedBranch,
  onSelect,
}: {
  branchInfo: Roadmap['branchInfo']
  selectedBranch: string | null
  onSelect: (branch: string) => void
}) {
  if (!branchInfo?.tracks?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-4 top-4 z-10 rounded-xl border border-border bg-card/95 p-3 backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
        <GitBranch className="h-3.5 w-3.5 text-primary" />
        경로 선택
      </div>
      <div className="flex flex-wrap gap-2">
        {branchInfo.tracks.map((track, index) => {
          const trackColors = ['#3b82f6', '#a855f7', '#14b8a6', '#f59e0b']
          const color = trackColors[index % trackColors.length]
          const isActive = selectedBranch === track.id
          return (
            <button
              key={track.id}
              onClick={() => onSelect(track.id)}
              className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all"
              style={{
                borderColor: isActive ? color : undefined,
                backgroundColor: isActive ? `${color}20` : undefined,
              }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {track.id}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{track.name}</p>
                <p className="text-[10px] text-muted-foreground">{track.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

export function RoadmapCanvas({ 
  books, 
  roadmap,
  onBookSelect, 
  selectedBookId,
  selectedBranch,
  onBranchSelect,
  isEditable = false,
  onDeleteBook,
  onAddBook,
  onSave,
  onMarkComplete,
}: RoadmapCanvasProps) {
  const nodeWidth = 72
  const nodeHeight = 104
  const canvasPadding = 40
  const trackIds = roadmap.branchInfo?.tracks?.map((track) => track.id) ?? []
  const trackColorPalette = ['#3b82f6', '#a855f7', '#14b8a6', '#f59e0b']
  const trackColorById = trackIds.reduce<Map<string, string>>((map, id, index) => {
    map.set(id, trackColorPalette[index % trackColorPalette.length])
    return map
  }, new Map<string, string>())
  const displayBooks = (() => {
    const booksCopy = books.map((book) => ({ ...book, position: { ...book.position } }))
    const uniqueTracks = Array.from(new Set(booksCopy.map((book) => book.branch).filter(Boolean))) as string[]
    const depthMemo = new Map<string, number>()
    const byId = new Map(booksCopy.map((book) => [book.id, book]))
    const getDepth = (book: Book): number => {
      if (depthMemo.has(book.id)) return depthMemo.get(book.id) as number
      const prereqs = book.prerequisiteIds ?? []
      const prereqDepth = prereqs.reduce((max, id) => {
        const parent = byId.get(id)
        if (!parent) return max
        return Math.max(max, getDepth(parent))
      }, -1)
      const depth = prereqDepth + 1
      depthMemo.set(book.id, depth)
      return depth
    }

    const centeredBaseY = 150
    const depthGap = 180
    const stackGap = 120
    const trackGap = 130
    const laneMain = '__MAIN__'
    const hasMainLane = booksCopy.some((book) => !book.branch)
    const sortedTracks = uniqueTracks.length > 0
      ? [...(hasMainLane ? [laneMain] : []), ...uniqueTracks.sort()]
      : [laneMain]
    const centerIndex = (sortedTracks.length - 1) / 2
    const trackYById = new Map<string, number>(
      sortedTracks.map((id, index) => [id, centeredBaseY + (index - centerIndex) * trackGap])
    )

    const layoutItems = booksCopy.map((book) => {
      const depth = getDepth(book)
      return {
        book,
        depth,
        lane: book.branch ?? laneMain,
      }
    })

    const groupTotalByKey = new Map<string, number>()
    layoutItems.forEach(({ depth, lane }) => {
      const key = `${depth}|${lane}`
      groupTotalByKey.set(key, (groupTotalByKey.get(key) ?? 0) + 1)
    })

    const groupSeenByKey = new Map<string, number>()
    const maxPerColumn = 2

    return layoutItems.map(({ book, depth, lane }) => {
      const key = `${depth}|${lane}`
      const seen = groupSeenByKey.get(key) ?? 0
      const total = groupTotalByKey.get(key) ?? 1
      groupSeenByKey.set(key, seen + 1)

      // Keep mindmap-like horizontal expansion:
      // if one depth/lane has too many nodes, spill into next columns.
      const columnOffset = Math.floor(seen / maxPerColumn)
      const rowInColumn = seen % maxPerColumn
      const remaining = total - columnOffset * maxPerColumn
      const rowsInThisColumn = Math.max(1, Math.min(maxPerColumn, remaining))
      const stackOffset = (rowInColumn - (rowsInThisColumn - 1) / 2) * stackGap
      const x = 40 + (depth + columnOffset) * depthGap
      const y = (trackYById.get(lane) ?? centeredBaseY) + stackOffset

      return {
        ...book,
        position: { x, y },
      }
    })
  })()

  const positionedBooks = (() => {
    if (displayBooks.length === 0) return displayBooks

    const minX = Math.min(...displayBooks.map((book) => book.position.x))
    const minY = Math.min(...displayBooks.map((book) => book.position.y))
    const shiftX = minX < canvasPadding ? canvasPadding - minX : 0
    const shiftY = minY < canvasPadding ? canvasPadding - minY : 0

    return displayBooks.map((book) => ({
      ...book,
      position: {
        x: book.position.x + shiftX,
        y: book.position.y + shiftY,
      },
    }))
  })()

  const maxBookX = positionedBooks.length > 0 ? Math.max(...positionedBooks.map((book) => book.position.x)) : 0
  const maxBookY = positionedBooks.length > 0 ? Math.max(...positionedBooks.map((book) => book.position.y)) : 0
  const canvasWidth = Math.max(900, Math.ceil(maxBookX + nodeWidth + canvasPadding * 3))
  const canvasHeight = Math.max(380, Math.ceil(maxBookY + nodeHeight + canvasPadding * 3))

  const getConnections = () => {
    const connections: { from: Book; to: Book; branch?: string; isCompleted?: boolean }[] = []
    
    positionedBooks.forEach(book => {
      if (book.prerequisiteIds) {
        book.prerequisiteIds.forEach(prereqId => {
          const prereqBook = positionedBooks.find(b => b.id === prereqId)
          if (prereqBook) {
            const isCompleted = prereqBook.status === 'completed' && book.status === 'completed'
            connections.push({ from: prereqBook, to: book, branch: book.branch, isCompleted })
          }
        })
      }
    })
    
    return connections
  }

  const connections = getConnections()

  const branchPointBook = roadmap.branchInfo 
    ? positionedBooks.find(b => b.id === roadmap.branchInfo?.branchPoint)
    : null
  const showBranchSelector = roadmap.hasBranches && (roadmap.branchInfo?.tracks?.length ?? 0) > 0

  // 마지막 책 위치 계산 (추가 버튼용)
  const lastBook = positionedBooks.length > 0 ? positionedBooks.reduce((prev, curr) => 
    curr.position.x > prev.position.x ? curr : prev
  ) : null
  const addButtonPosition = lastBook 
    ? { x: lastBook.position.x + 140, y: lastBook.position.y + 30 }
    : { x: 40, y: 90 }

  return (
    <div className="relative h-[420px] w-full overflow-auto rounded-xl border border-border bg-card/50">
      {/* Save button for editable mode */}
      {isEditable && onSave && (
        <div className="absolute left-4 top-4 z-10">
          <Button
            onClick={onSave}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            내 맵 저장하기
          </Button>
        </div>
      )}

      <div className="relative p-6 pt-28 pb-20" style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Branch Selector */}
        {showBranchSelector && !isEditable && (
          <BranchSelector
            branchInfo={roadmap.branchInfo}
            selectedBranch={selectedBranch}
            onSelect={onBranchSelect}
          />
        )}

        {/* SVG for connection lines */}
        <svg className="pointer-events-none absolute inset-0" width={canvasWidth} height={canvasHeight}>
          <defs>
            <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <AnimatePresence>
            {connections.map((conn, index) => {
              const isInSelectedBranch = !conn.branch || conn.branch === selectedBranch || !selectedBranch
              return (
                <ConnectionLine
                  key={`line-${conn.from.id}-${conn.to.id}-${index}`}
                  from={conn.from.position}
                  to={conn.to.position}
                  status={conn.to.status}
                  index={index}
                  branch={conn.branch}
                  branchColor={conn.branch ? trackColorById.get(conn.branch) : undefined}
                  isInSelectedBranch={isInSelectedBranch}
                  isCompleted={conn.isCompleted}
                />
              )
            })}
          </AnimatePresence>
        </svg>

        {/* Book nodes */}
        <AnimatePresence>
          {positionedBooks.map((book, index) => {
            const isInSelectedBranch = !book.branch || book.branch === selectedBranch || !selectedBranch
            return (
              <BookNode
                key={book.id}
                book={book}
                onClick={() => onBookSelect(book)}
                isSelected={selectedBookId === book.id}
                index={index}
                isInSelectedBranch={isInSelectedBranch}
                isEditable={isEditable}
                onDelete={onDeleteBook ? () => onDeleteBook(book.id) : undefined}
                onMarkComplete={onMarkComplete && book.status === 'in-progress' ? () => onMarkComplete(book) : undefined}
                trackColor={book.branch ? trackColorById.get(book.branch) : undefined}
              />
            )
          })}
        </AnimatePresence>

        {/* Add book button for editable mode */}
        {isEditable && onAddBook && (
          <AddBookButton
            position={addButtonPosition}
            onClick={() => onAddBook(lastBook?.id || null)}
          />
        )}

        {/* Progress Line at bottom */}
        {!isEditable && <ProgressLine books={positionedBooks} />}

        {/* Legend */}
        {!isEditable && (
          <div className="absolute bottom-24 right-3 flex items-center gap-4 rounded-lg border border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">완료</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">읽는 중</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <span className="text-muted-foreground">잠금</span>
            </div>
            {roadmap.hasBranches && (roadmap.branchInfo?.tracks?.length ?? 0) > 0 && (
              <>
                <div className="h-3 w-px bg-border" />
                {roadmap.branchInfo?.tracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-1.5 text-[10px]">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: trackColorById.get(track.id) ?? '#64748b' }}
                    />
                    <span className="text-muted-foreground">{track.id}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
