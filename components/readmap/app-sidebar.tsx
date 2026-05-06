'use client'

import { Map, Library, Users, Settings, BookOpen, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: Map, label: '로드맵 탐색', href: '#explore' },
  { icon: Library, label: '내 서재', href: '#my-library' },
  { icon: Users, label: '커뮤니티', href: '#community' },
  { icon: Settings, label: '설정', href: '#settings' },
]

interface AppSidebarProps {
  onNavigate?: (section: string) => void
  activeSection?: string
  userName?: string
  activeRoadmapTitle?: string
}

export function AppSidebar({ 
  onNavigate, 
  activeSection = '#explore',
  userName = '독서가',
  activeRoadmapTitle = '로드맵을 선택하세요'
}: AppSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* User Profile Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground">{userName}</h1>
          <p className="truncate text-xs text-muted-foreground">{activeRoadmapTitle}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = activeSection === item.href || 
            (activeSection === '#roadmap' && item.href === '#explore')
          
          return (
            <motion.button
              key={item.label}
              onClick={() => onNavigate?.(item.href)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </motion.button>
          )
        })}
      </nav>

      {/* Stats Card */}
      <div className="m-4 rounded-xl border border-border bg-secondary/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">나의 진행 상황</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">읽은 책</span>
            <span className="font-semibold text-foreground">12권</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">완료한 로드맵</span>
            <span className="font-semibold text-foreground">3개</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">연속 독서</span>
            <span className="font-semibold text-primary">7일째</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
