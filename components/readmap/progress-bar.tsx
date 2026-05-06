'use client'

import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

interface ProgressBarProps {
  percentage: number
  title: string
}

export function ProgressBar({ percentage, title }: ProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">나의 학습 여정을 추적하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold text-primary">{percentage}%</span>
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-dark to-primary"
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>입문</span>
        <span>중급</span>
        <span>전문가</span>
      </div>
    </motion.div>
  )
}
