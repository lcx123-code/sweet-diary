import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Mood } from '../lib/supabase-types'

interface MoodState {
  moods: Mood[]
  selectedId: string | null
  isLoading: boolean

  fetchMoods: () => Promise<void>
  selectMood: (id: string | null) => void
}

export const useMoodStore = create<MoodState>((set) => ({
  moods: [],
  selectedId: null,
  isLoading: false,

  fetchMoods: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      set({ moods: data, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  selectMood: (id) => set({ selectedId: id }),
}))
