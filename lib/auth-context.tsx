'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  id: string
  username: string
  nickname: string
  email: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (username: string, password: string, nickname: string, email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: { nickname?: string; password?: string; currentPassword?: string }) => Promise<{ success: boolean; error?: string }>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const users = getStoredUsers()
    
    if (users.some(u => u.username === username)) {
      return { success: false, error: '이미 존재하는 아이디입니다.' }
    }
    
    if (users.some(u => u.email === email)) {
      return { success: false, error: '이미 사용 중인 이메일입니다.' }
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      username,
      password,
      nickname,
      email,
      createdAt: new Date()
    }

    setStoredUsers([...users, newUser])
    
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem(CURRENT_USER_KEY, newUser.id)
    
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  const updateProfile = async (data: { 
    nickname?: string
    password?: string
    currentPassword?: string 
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' }

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

    if (data.nickname) {
      users[userIndex].nickname = data.nickname
      setUser(prev => prev ? { ...prev, nickname: data.nickname! } : null)
    }

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
