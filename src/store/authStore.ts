import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { withTimeout, withRetry } from '../lib/async'

// 纯 JSON 接口：只存需要的字段，不存 Supabase SDK 实例（避免 Symbol 属性）
interface UserInfo {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: UserInfo | null
  isLoading: boolean
  isHydrated: boolean

  setUser: (user: UserInfo | null) => void
  hydrate: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

/** 从 Supabase Session 提取纯字段，丢弃所有 Symbol/内部属性 */
function extractUserInfo(session: any): UserInfo | null {
  if (!session?.user) return null
  const meta = session.user.user_metadata ?? {}
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: (meta.name as string) ?? '',
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isHydrated: false,

  setUser: (user) => set({ user, isLoading: false }),

  hydrate: async () => {
    // 初始化时尝试恢复已有 session
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 8_000)
      if (data.session) {
        set({ user: extractUserInfo(data.session), isLoading: false, isHydrated: true })
      } else {
        set({ isLoading: false, isHydrated: true })
      }
    } catch {
      set({ isLoading: false, isHydrated: true })
    }
  },

  signUp: async (email, password, name) => {
    try {
      const { error } = await withRetry(() =>
        withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          }),
          15_000
        )
      )
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err?.message ?? '注册失败，请检查网络' }
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) return { error: error.message }

      if (data?.session) {
        set({ user: extractUserInfo(data.session) })
      }

      return {}
    } catch (err: any) {
      return { error: err?.message ?? '登录失败，请检查网络' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
