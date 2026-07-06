import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type CoupleStatus = 'none' | 'pending' | 'active'

interface CoupleState {
  coupleId: string | null
  inviteCode: string | null
  partnerName: string | null
  partnerId: string | null
  myConfirmed: boolean
  status: CoupleStatus
  isLoading: boolean
  createdAt: string | null

  fetchMyCouple: (user: { id: string }) => Promise<void>
  createCouple: (userId: string) => Promise<{ inviteCode?: string; error?: string }>
  joinCouple: (userId: string, code: string) => Promise<{ error?: string }>
  confirmPartner: (userId: string) => Promise<{ error?: string }>
  leaveCouple: () => Promise<void>
  reset: () => void
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  coupleId: null,
  inviteCode: null,
  partnerName: null,
  partnerId: null,
  myConfirmed: false,
  status: 'none',
  isLoading: false,
  createdAt: null,

  reset: () =>
    set({
      coupleId: null,
      inviteCode: null,
      partnerName: null,
      partnerId: null,
      myConfirmed: false,
      status: 'none',
      createdAt: null,
    }),

  fetchMyCouple: async (user) => {
    set({ isLoading: true })

    // 1) 找当前用户 active 的 couple_member（不用 join，避免 RLS 干扰）
    const { data: myMember, error: myErr } = await supabase
      .from('couple_members')
      .select('*')
      .eq('user_id', user.id)
      .is('left_at', null)
      .maybeSingle()

    if (myErr) {
      console.warn('fetchMyCouple myMember error:', myErr)
    }

    if (!myMember) {
      set({ isLoading: false, status: 'none' })
      return
    }

    const myConfirmed = !!myMember.confirmed_at

    // 2) 查 couples 表拿 invite_code + created_at
    let inviteCode: string | null = null
    let createdAt: string | null = null
    const { data: couple } = await supabase
      .from('couples')
      .select('invite_code, created_at')
      .eq('id', myMember.couple_id)
      .maybeSingle()
    if (couple) {
      inviteCode = couple.invite_code
      createdAt = couple.created_at
    }

    // 3) 用 SECURITY DEFINER RPC 查伴侣信息（绕过 RLS 递归问题）
    let partnerName: string | null = null
    let partnerConfirmed = false
    let partnerId: string | null = null

    const { data: partnerRows } = await supabase
      .rpc('get_partner_info', { p_user_id: user.id })

    if (partnerRows && partnerRows.length > 0) {
      const partner = partnerRows[0] as any
      partnerId = partner.partner_id ?? null
      partnerName = partner.partner_name ?? partnerId
      partnerConfirmed = !!partner.partner_confirmed
    }

    set({
      coupleId: myMember.couple_id,
      inviteCode,
      partnerName,
      partnerId,
      myConfirmed,
      status: myConfirmed && partnerConfirmed ? 'active' : 'pending',
      isLoading: false,
      createdAt,
    })
  },

  createCouple: async (userId) => {
    set({ isLoading: true })

    const { data, error } = await supabase.rpc('create_couple', {
      _user_id: userId,
    })

    if (error) {
      set({ isLoading: false })
      return { error: error.message }
    }

    const row = (Array.isArray(data) ? data[0] : data) as { couple_id: string; invite_code: string; created_at?: string }
    set({
      coupleId: row.couple_id,
      inviteCode: row.invite_code,
      myConfirmed: true,
      status: 'pending',
      isLoading: false,
      createdAt: row.created_at ?? null,
    })

    return { inviteCode: row.invite_code }
  },

  joinCouple: async (userId, code) => {
    set({ isLoading: true })

    // 1) 通过邀请码找到 couple
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle()

    if (!couple) {
      set({ isLoading: false })
      return { error: '邀请码无效' }
    }

    // 2) 加入
    const { error: insertError } = await supabase
      .from('couple_members')
      .insert({
        couple_id: couple.id,
        user_id: userId,
        role: 'member',
        confirmed_at: new Date().toISOString(),
      })

    if (insertError) {
      set({ isLoading: false })
      return { error: insertError.message }
    }

    set({ coupleId: couple.id, status: 'pending', isLoading: false })
    return {}
  },

  confirmPartner: async (userId) => {
    const { coupleId } = get()
    if (!coupleId) return { error: '未加入任何伴侣关系' }

    set({ isLoading: true })

    const { error } = await supabase
      .from('couple_members')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('couple_id', coupleId)
      .eq('user_id', userId)
      .is('left_at', null)

    if (error) {
      set({ isLoading: false })
      return { error: error.message }
    }

    set({ myConfirmed: true, status: 'active', isLoading: false })
    return {}
  },

  leaveCouple: async () => {
    const { coupleId } = get()
    if (!coupleId) return

    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id
    if (!userId) return

    await supabase
      .from('couple_members')
      .update({ left_at: new Date().toISOString() })
      .eq('couple_id', coupleId)
      .eq('user_id', userId)

    set({
      coupleId: null,
      inviteCode: null,
      partnerName: null,
      partnerId: null,
      status: 'none',
    })
  },
}))
