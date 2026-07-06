import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { DiaryEntryWithMood, DiaryWithEntries } from '../lib/supabase-types'

interface DiaryState {
  timeline: DiaryWithEntries[]
  isLoading: boolean

  fetchTimeline: (coupleId: string) => Promise<void>
  getEntry: (entryId: string) => Promise<DiaryEntryWithMood | null>
  getDiaryEntries: (diaryId: string) => Promise<DiaryEntryWithMood[]>
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

async function attachAuthorNames(entries: DiaryEntryWithMood[]) {
  const userIds = Array.from(new Set(entries.map((entry) => entry.user_id)))
  if (userIds.length === 0) return

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds)

  const nameMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]))

  entries.forEach((entry) => {
    entry.author_name = nameMap.get(entry.user_id) || '记录者'
  })
}

async function attachEntryImages(entries: DiaryEntryWithMood[]) {
  const entryIds = entries.map((entry) => entry.id)
  if (entryIds.length === 0) return

  const { data: imageData } = await supabase
    .from('diary_entry_images')
    .select('entry_id, image_id, images(bucket, path, width, height)')
    .in('entry_id', entryIds)

  if (!imageData) return

  const countMap = new Map<string, number>()
  const firstMap = new Map<string, any>()
  const imagesMap = new Map<string, NonNullable<DiaryEntryWithMood['images']>>()

  for (const row of imageData) {
    const entryId = row.entry_id
    countMap.set(entryId, (countMap.get(entryId) ?? 0) + 1)
    const img = Array.isArray(row.images) ? row.images[0] : row.images
    if (img?.bucket && img?.path) {
      if (!firstMap.has(entryId)) firstMap.set(entryId, img)
      const { data: urlData } = supabase.storage
        .from(img.bucket)
        .getPublicUrl(img.path)
      const list = imagesMap.get(entryId) ?? []
      list.push({
        id: row.image_id,
        uri: urlData.publicUrl,
        width: img.width ?? undefined,
        height: img.height ?? undefined,
      })
      imagesMap.set(entryId, list)
    }
  }

  entries.forEach((entry) => {
    ;(entry as any).image_count = countMap.get(entry.id) ?? 0
    entry.images = imagesMap.get(entry.id) ?? []
    const img = firstMap.get(entry.id)
    if (img?.bucket && img?.path) {
      const { data: urlData } = supabase.storage
        .from(img.bucket)
        .getPublicUrl(img.path)
      entry.image_url = urlData.publicUrl
      entry.image_width = img.width ?? undefined
      entry.image_height = img.height ?? undefined
    }
  })
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

    await attachAuthorNames(filtered)

    await attachEntryImages(filtered)

    set({ timeline: groupByDate(filtered), isLoading: false })
  },

  getEntry: async (entryId) => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*, mood:mood_id(*)')
      .eq('id', entryId)
      .single()

    if (error || !data) return null
    const entry = data as unknown as DiaryEntryWithMood
    await attachAuthorNames([entry])
    await attachEntryImages([entry])
    return entry
  },

  getDiaryEntries: async (diaryId) => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*, mood:mood_id(*)')
      .eq('diary_id', diaryId)
      .eq('status', 'published')
      .order('created_at', { ascending: true })

    if (error || !data) return []
    const entries = data as unknown as DiaryEntryWithMood[]
    await attachAuthorNames(entries)
    await attachEntryImages(entries)
    return entries
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
