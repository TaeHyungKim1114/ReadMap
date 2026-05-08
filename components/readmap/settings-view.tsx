'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, CheckCircle2, AlertCircle, LogOut, Mail, Calendar } from 'lucide-react'

export function SettingsView() {
  const { user, updateProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  
  // 프로필 수정
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    setNickname(user.nickname)
    setContactEmail(user.email ?? '')
  }, [user])
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setIsUpdatingProfile(true)

    if (!nickname.trim()) {
      setProfileMessage({ type: 'error', text: '닉네임을 입력해주세요.' })
      setIsUpdatingProfile(false)
      return
    }

    const result = await updateProfile({ nickname, contactEmail })
    
    if (result.success) {
      setProfileMessage({ type: 'success', text: '프로필이 업데이트되었습니다.' })
    } else {
      setProfileMessage({ type: 'error', text: result.error || '업데이트에 실패했습니다.' })
    }
    
    setIsUpdatingProfile(false)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    setIsUpdatingPassword(true)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      setIsUpdatingPassword(false)
      return
    }

    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: '비밀번호는 4자 이상이어야 합니다.' })
      setIsUpdatingPassword(false)
      return
    }

    const result = await updateProfile({ password: newPassword, currentPassword })
    
    if (result.success) {
      setPasswordMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setPasswordMessage({ type: 'error', text: result.error || '비밀번호 변경에 실패했습니다.' })
    }
    
    setIsUpdatingPassword(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 사용자 정보 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.nickname}</h2>
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email || '연락 이메일 미등록'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : ''} 가입
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 탭 전환 */}
      <div className="flex rounded-lg bg-secondary p-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'profile' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          프로필 수정
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'password' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          비밀번호 변경
        </button>
      </div>

      {/* 프로필 수정 */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">프로필 수정</h3>
          
          {profileMessage && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              profileMessage.type === 'success' 
                ? 'bg-primary/10 text-primary' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {profileMessage.type === 'success' 
                ? <CheckCircle2 className="h-4 w-4" />
                : <AlertCircle className="h-4 w-4" />
              }
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                닉네임
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="pl-10"
                  placeholder="닉네임을 입력하세요"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                연락처 이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  autoComplete="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="pl-10"
                  placeholder="example@domain.com"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                로그인에는 사용되지 않으며, 안내용으로만 저장됩니다. 비워 두면 삭제됩니다.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                아이디
              </label>
              <Input
                type="text"
                value={user?.username || ''}
                disabled
                className="bg-secondary text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">아이디는 변경할 수 없습니다.</p>
            </div>

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? '저장 중...' : '변경사항 저장'}
            </Button>
          </form>
        </motion.div>
      )}

      {/* 비밀번호 변경 */}
      {activeTab === 'password' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">비밀번호 변경</h3>
          
          {passwordMessage && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              passwordMessage.type === 'success' 
                ? 'bg-primary/10 text-primary' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {passwordMessage.type === 'success' 
                ? <CheckCircle2 className="h-4 w-4" />
                : <AlertCircle className="h-4 w-4" />
              }
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                현재 비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10"
                  placeholder="현재 비밀번호"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                새 비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  placeholder="새 비밀번호 (4자 이상)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                새 비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  placeholder="새 비밀번호 확인"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </form>
        </motion.div>
      )}

      {/* 로그아웃 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-destructive/20 bg-destructive/5 p-6"
      >
        <h3 className="mb-2 text-lg font-semibold text-foreground">로그아웃</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          다른 계정으로 로그인하거나 앱을 종료하려면 로그아웃하세요.
        </p>
        <Button variant="destructive" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </motion.div>
    </div>
  )
}
