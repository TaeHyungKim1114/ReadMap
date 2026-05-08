'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, User, Lock, AlertCircle, Loader2, Mail } from 'lucide-react'

type AuthMode = 'login' | 'signup'

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  /** 회원가입 시 연락·프로필용. 로그인에는 사용하지 않음. */
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, signup } = useAuth()

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setNickname('')
    setContactEmail('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        setIsSubmitting(false)
        return
      }
      if (password.length < 4) {
        setError('비밀번호는 4자 이상이어야 합니다.')
        setIsSubmitting(false)
        return
      }
      const trimmedMail = contactEmail.trim().toLowerCase()
      if (!trimmedMail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedMail)) {
        setError('연락처 이메일 형식을 확인해 주세요. (로그인에는 사용되지 않습니다.)')
        setIsSubmitting(false)
        return
      }
      const result = await signup(username, password, nickname, trimmedMail)
      if (!result.success) {
        setError(result.error || '회원가입에 실패했습니다.')
      }
    } else {
      const result = await login(username, password)
      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다.')
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ReadMap</h1>
          <p className="mt-2 text-muted-foreground">당신의 맞춤형 독서 로드맵을 만들고, 당신의 목표를 읽어보세요</p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          {/* Tab Switcher */}
          <div className="mb-6 flex rounded-lg bg-secondary p-1">
            <button
              onClick={() => { setMode('login'); resetForm() }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'login' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => { setMode('signup'); resetForm() }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'signup' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="닉네임"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="연락처 이메일 (로그인과 무관)"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground [text-wrap:pretty] [word-break:keep-all]">
                    로그인은 아이디·비밀번호만 사용합니다. 이메일은 프로필·연락용으로만 저장됩니다.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="비밀번호 확인"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                mode === 'login' ? '로그인' : '회원가입'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' 
            ? '아직 계정이 없으신가요? ' 
            : '이미 계정이 있으신가요? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetForm() }}
            className="font-medium text-primary hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
