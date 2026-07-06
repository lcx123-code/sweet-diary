import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { DiaryEntryWithMood, DiaryWithEntries } from '../lib/supabase-types'

interface DiaryState {
  timeline: DiaryWithEntries[]
  isLoading: boolean

  fetchTimeline: (coupleId: string) => Promise<void>
  getEntry: (entryId: string) => Promise<DiaryEntryWithMood | null>
  createEntry: (
    coupleId: string,
    userId: string,
    content: string,
    moodId?: string | null,
    milestoneType?: string | null,
  ) => Promise<{ id?: string; error?: string }>
}

function groupByDate(entries: DiaryEntryWithMood[]): DiaryWithEntries[] {
  const map = new Map<string, DiaryEntryWithMood[]>()
  for (const e of entries) {
    const date = e.created_at.slice(0, 10)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(e)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      diary: { id: list[0].diary_id, couple_id: '', date, ai_summary: null, created_at: '', updated_at: '' },
      entries: list,
    }))
}

export const useDiaryStore = create<DiaryState>((set) => ({
  timeline: [],
  isLoading: false,

  fetchTimeline: async (coupleId) => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('diary_entries')
      .select(`
        *,
        mood:mood_id(*)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error || !data) {
      set({ isLoading: false })
      return
    }

    // 只保留当前 couple 的（通过 diary 关联）
    const { data: diaries } = await supabase
      .from('diaries')
      .select('id')
      .eq('couple_id', coupleId)

    const diaryIds = new Set(diaries?.map((d) => d.id) ?? [])
    const filtered = data.filter((e) => diaryIds.has(e.diary_id)) as unknown as DiaryEntryWithMood[]

    // 暂用 user_id 前 8 位作为显示名
    filtered.forEach((e) => {
      e.author_name = e.user_id.slice(0, 8)
    })

    // 批量查图片数量 + 首张图片 URL
    const entryIds = filtered.map((e) => e.id)
    if (entryIds.length > 0) {
      const { data: imageData } = await supabase
        .from('diary_entry_images')
        .select('entry_id, image_id, images(bucket, path, width, height)')
        .in('entry_id', entryIds)

      if (imageData) {
        const countMap = new Map<string, number>()
        const firstMap = new Map<string, any>()
        for (const row of imageData) {
          const eid = row.entry_id
          countMap.set(eid, (countMap.get(eid) ?? 0) + 1)
          if (!firstMap.has(eid)) {
            const img = Array.isArray(row.images) ? row.images[0] : row.images
            if (img) firstMap.set(eid, img)
          }
        }
        filtered.forEach((e) => {
          ;(e as any).image_count = countMap.get(e.id) ?? 0
          const img = firstMap.get(e.id)
          if (img?.bucket && img?.path) {
            const { data: urlData } = supabase.storage
              .from(img.bucket)
              .getPublicUrl(img.path)
            e.image_url = urlData.publicUrl
            e.image_width = img.width ?? undefined
            e.image_height = img.height ?? undefined
          }
        })
      }
    }

    set({ timeline: groupByDate(filtered), isLoading: false })
  },

  getEntry: async (entryId) => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*, mood:mood_id(*)')
      .eq('id', entryId)
      .single()

    if (error || !data) return null
    return data as unknown as DiaryEntryWithMood
  },

  createEntry: async (coupleId, userId, content, moodId, milestoneType?) => {
    const today = new Date().toISOString().slice(0, 10)
    let diaryId: string

    const { data: existingDiary } = await supabase
      .from('diaries')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('date', today)
      .maybeSingle()

    if (existingDiary) {
      diaryId = existingDiary.id
    } else {
      const { data: newDiary, error: createDiaryError } = await supabase
        .from('diaries')
        .insert({ couple_id: coupleId, date: today })
        .select()
        .single()

      if (createDiaryError || !newDiary) {
        return { error: createDiaryError?.message ?? '创建日记失败' }
      }
      diaryId = newDiary.id
    }

    const { data: entry, error } = await supabase
      .from('diary_entries')
      .insert({
        diary_id: diaryId,
        user_id: userId,
        mood_id: moodId ?? null,
        content,
        status: 'published',
        milestone_type: milestoneType ?? null,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: entry.id }
  },
}))
