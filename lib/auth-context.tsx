'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export interface User {
  id: string
  username: string
  nickname: string
  email: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  /** 로그인은 아이디/비번만. contactEmail은 프로필·연락용으로 metadata에만 저장. */
  signup: (
    username: string,
    password: string,
    nickname: string,
    contactEmail: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: {
    nickname?: string
    contactEmail?: string
    password?: string
    currentPassword?: string
  }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 간단한 로컬 스토리지 기반 인증 (데모용)
// 실제 프로덕션에서는 Supabase 등의 백엔드 사용 권장
const USERS_KEY = 'readmap_users'
const CURRENT_USER_KEY = 'readmap_current_user'

interface StoredUser extends User {
  password: string
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

function setStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function trimEmailDomainHost(candidate: string): string {
  return candidate
    .trim()
    .replace(/^www\./i, '')
    .replace(/:\d+$/, '')
}

/** Supabase가 거절하는 합성 auth 이메일 도메인 (RFC/mDNS 예약 등). 여기 포함되면 다음 후보로 넘김. */
function isDisallowedSyntheticEmailDomain(host: string): boolean {
  const h = host.trim().toLowerCase()
  if (!h.includes('.')) return true
  if (h === 'localhost') return true
  if (h.endsWith('.localhost')) return true
  if (h.endsWith('.local')) return true
  return false
}

/** Vercel 배포 URL 등 `NEXT_PUBLIC_SITE_URL`에서 호스트만 추출 (배포 시 한 번 설정하면 프리뷰 외 환경에 유용). */
function hostnameFromSiteUrlEnv(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' ? process.env.NEXT_PUBLIC_SITE_URL.trim() : ''
  if (!raw) return ''
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const host = trimEmailDomainHost(new URL(withProto).hostname.toLowerCase())
    if (isDisallowedSyntheticEmailDomain(host)) return ''
    return host
  } catch {
    return ''
  }
}

/**
 * 실제 접속 중인 페이지 호스트(배포 도메인·vercel.app 등)를 내부 로그인 이메일 도메인으로 사용.
 * localhost / .local 은 Supabase가 거절할 수 있어 건너뜀.
 */
function hostnameFromBrowser(): string {
  if (typeof window === 'undefined') return ''
  const host = trimEmailDomainHost(window.location.hostname.toLowerCase())
  if (isDisallowedSyntheticEmailDomain(host)) return ''
  return host
}

/**
 * Supabase는 .local 같은 도메인을 무효로 거절.
 * 우선순위: 전용 env → 브라우저 배포 호스트 → SITE_URL → 기본값.
 */
function getInternalEmailDomain(): string {
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_SUPABASE_EMAIL_DOMAIN === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_EMAIL_DOMAIN.trim().replace(/^@/, '')
      : ''
  if (fromEnv && !isDisallowedSyntheticEmailDomain(fromEnv)) return fromEnv

  const fromPage = hostnameFromBrowser()
  if (fromPage) return fromPage

  const fromSiteUrl = hostnameFromSiteUrlEnv()
  if (fromSiteUrl) return fromSiteUrl

  return 'accounts.read-map.vercel.app'
}

function usernameSlugForEmail(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 48)
  return normalized || 'user'
}

/** Supabase 로그인용 내부 이메일(실제 받는 메일 필요 없음·확인 메일 비활성화 권장). */
function usernameToInternalAuthEmail(username: string): string {
  return `${usernameSlugForEmail(username)}@${getInternalEmailDomain()}`
}

function sanitizeContactEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Supabase 기본 SMTP 한도 등으로 나오는 문구를 사용자에게 풀어 설명 */
function humanizeSignupError(message: string | undefined): string {
  if (!message) return '회원가입에 실패했습니다.'
  const m = message.toLowerCase()
  if (
    m.includes('email rate limit') ||
    m.includes('rate limit exceeded') ||
    m.includes('too many emails sent') ||
    (m.includes('rate limit') && (m.includes('email') || m.includes('smtp')))
  ) {
    return '이메일 발송 한도에 걸렸습니다. 이 앱은 가입 확인 메일 수신 주소가 아닌 형식의 계정이라, Supabase Dashboard → Authentication → Providers → Email에서 「Confirm email(이메일로 가입 확인)」을 끄면 대부분 해결됩니다. 잠시 후 다시 시도할 수도 있습니다.'
  }
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  const mapSupabaseUser = (authUser: SupabaseUser): User => {
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>
    const username =
      (typeof meta.username === 'string' && meta.username.trim()) ||
      usernameSlugForEmail(authUser.email ?? '')
    const nickname =
      (typeof meta.nickname === 'string' && meta.nickname.trim()) ||
      (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
      username
    const profileEmail =
      (typeof meta.contact_email === 'string' && sanitizeContactEmail(meta.contact_email)) || ''

    return {
      id: authUser.id,
      username,
      nickname,
      /** 연락용 이메일(로그인과 무관). 없으면 빈 문자열. */
      email: profileEmail,
      createdAt: authUser.created_at ?? new Date().toISOString(),
    }
  }

  useEffect(() => {
    if (supabase) {
      let active = true

      void supabase.auth.getSession().then(({ data }) => {
        if (!active) return
        setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null)
        setIsLoading(false)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? mapSupabaseUser(session.user) : null)
        setIsLoading(false)
      })

      return () => {
        active = false
        subscription.unsubscribe()
      }
    }

    // 초기 로드 시 저장된 사용자 확인
    const storedUserId = localStorage.getItem(CURRENT_USER_KEY)
    if (storedUserId) {
      const users = getStoredUsers()
      const foundUser = users.find(u => u.id === storedUserId)
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (supabase) {
      const loginId = username.trim()
      const email = loginId.includes('@') ? loginId : usernameToInternalAuthEmail(loginId)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        return { success: false, error: error?.message || '로그인에 실패했습니다.' }
      }
      setUser(mapSupabaseUser(data.user))
      return { success: true }
    }

    const users = getStoredUsers()
    const foundUser = users.find(u => u.username === username && u.password === password)
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem(CURRENT_USER_KEY, foundUser.id)
      return { success: true }
    }
    
    return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
  }

  const signup = async (
    username: string, 
    password: string, 
    nickname: string,
    contactEmail: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (supabase) {
      const trimmedContact = sanitizeContactEmail(contactEmail)
      if (!trimmedContact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) {
        return { success: false, error: '연락처 이메일 형식을 확인해 주세요. (로그인에는 사용되지 않습니다.)' }
      }
      const email = usernameToInternalAuthEmail(username)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            nickname,
            contact_email: trimmedContact,
          },
        },
      })
      if (error || !data.user) {
        return {
          success: false,
          error: humanizeSignupError(error?.message),
        }
      }
      setUser(mapSupabaseUser(data.user))
      return { success: true }
    }

    const users = getStoredUsers()

    const trimmedContact = sanitizeContactEmail(contactEmail)
    if (!trimmedContact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) {
      return { success: false, error: '연락처 이메일 형식을 확인해 주세요. (로그인에는 사용되지 않습니다.)' }
    }

    if (users.some(u => u.username === username)) {
      return { success: false, error: '이미 존재하는 아이디입니다.' }
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      username,
      password,
      nickname,
      email: trimmedContact,
      createdAt: new Date().toISOString(),
    }

    setStoredUsers([...users, newUser])
    
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem(CURRENT_USER_KEY, newUser.id)
    
    return { success: true }
  }

  const logout = () => {
    if (supabase) {
      void supabase.auth.signOut()
      setUser(null)
      return
    }
    setUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  const updateProfile = async (data: {
    nickname?: string
    contactEmail?: string
    password?: string
    currentPassword?: string
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' }

    if (supabase) {
      if (data.password) {
        const { error } = await supabase.auth.updateUser({ password: data.password })
        if (error) return { success: false, error: error.message }
      }

      const metaPatch: Record<string, string> = { username: user.username }
      if (data.nickname !== undefined) {
        const n = data.nickname.trim()
        if (!n) return { success: false, error: '닉네임을 입력해주세요.' }
        metaPatch.nickname = n
      }
      if (data.contactEmail !== undefined) {
        const t = sanitizeContactEmail(data.contactEmail)
        if (t && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
          return { success: false, error: '연락처 이메일 형식을 확인해 주세요. (로그인에는 사용되지 않습니다.)' }
        }
        metaPatch.contact_email = t
      }

      if (Object.keys(metaPatch).length > 1) {
        const { error } = await supabase.auth.updateUser({ data: metaPatch })
        if (error) return { success: false, error: error.message }
        setUser((prev) => {
          if (!prev) return prev
          let next = prev
          if (data.nickname !== undefined) next = { ...next, nickname: data.nickname.trim() }
          if (data.contactEmail !== undefined) next = { ...next, email: sanitizeContactEmail(data.contactEmail) }
          return next
        })
      }

      return { success: true }
    }

    const users = getStoredUsers()
    const userIndex = users.findIndex(u => u.id === user.id)
    
    if (userIndex === -1) return { success: false, error: '사용자를 찾을 수 없습니다.' }

    // 비밀번호 변경 시 현재 비밀번호 확인
    if (data.password && data.currentPassword) {
      if (users[userIndex].password !== data.currentPassword) {
        return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' }
      }
      users[userIndex].password = data.password
    }

    if (data.contactEmail !== undefined) {
      const t = sanitizeContactEmail(data.contactEmail)
      if (t && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
        return { success: false, error: '연락처 이메일 형식을 확인해 주세요. (로그인에는 사용되지 않습니다.)' }
      }
      users[userIndex].email = t
    }

    if (data.nickname !== undefined) {
      const n = data.nickname.trim()
      if (!n) return { success: false, error: '닉네임을 입력해주세요.' }
      users[userIndex].nickname = n
    }

    setUser(prev => {
      if (!prev) return null
      let next = prev
      if (data.nickname !== undefined) next = { ...next, nickname: data.nickname.trim() }
      if (data.contactEmail !== undefined) next = { ...next, email: sanitizeContactEmail(data.contactEmail) }
      return next
    })

    setStoredUsers(users)
    return { success: true }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
