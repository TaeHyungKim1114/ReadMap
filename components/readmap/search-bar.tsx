'use client'

import { Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  isGenerating?: boolean
}

export function SearchBar({ value, onChange, onGenerate, isGenerating = false }: SearchBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="로드맵 또는 책 검색..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 border-border bg-card pl-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>
      <Button
        variant="outline"
        onClick={onGenerate}
        disabled={isGenerating || !value.trim()}
        className="h-11 border-border bg-card px-4 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        {isGenerating ? (
          <>
            <Filter className="mr-2 h-4 w-4 animate-spin" />
            생성 중...
          </>
        ) : (
          '로드맵 생성'
        )}
      </Button>
    </motion.div>
  )
}
