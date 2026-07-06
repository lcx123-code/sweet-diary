// ─── 数据库行类型 ─────────────────────────────────────

export interface Profile {
  id: string
  name: string | null
  created_at: string
}

export interface Couple {
  id: string
  invite_code: string
  created_at: string
}

export interface CoupleMember {
  id: string
  couple_id: string
  user_id: string
  invited_by: string | null
  confirmed_at: string | null
  left_at: string | null
  created_at: string
}

export interface Diary {
  id: string
  couple_id: string
  date: string
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export interface DiaryEntry {
  id: string
  diary_id: string
  user_id: string
  mood_id: string | null
  content: string | null
  snapshot_of: string | null
  diff_type: string | null
  status: 'draft' | 'published'
  milestone_type: string | null
  created_at: string
  updated_at: string
}

export interface Mood {
  id: string
  emoji: string
  label: string
  sort_order: number
}

export interface Image {
  id: string
  user_id: string
  bucket: string
  path: string
  width: number | null
  height: number | null
  created_at: string
}

export interface DiaryEntryImage {
  id: string
  entry_id: string
  image_id: string
  media_id: string | null
}

export interface SocialPost {
  id: string
  couple_id: string
  user_id: string
  content: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SocialPostImage {
  id: string
  post_id: string
  image_id: string
}

export interface SocialLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Event {
  id: string
  couple_id: string
  user_id: string
  title: string
  event_date: string
  type: string
  created_at: string
}

export interface PeriodLog {
  id: string
  user_id: string
  start_date: string
  end_date: string | null
  notes: string | null
  created_at: string
}

// ─── 业务组合类型 ─────────────────────────────────────

export interface DiaryEntryWithMood extends DiaryEntry {
  mood?: Mood | null
  author_name?: string
  image_url?: string
  image_width?: number
  image_height?: number
}

export interface DiaryWithEntries {
  diary: Diary
  entries: DiaryEntryWithMood[]
}

export interface CoupleWithPartner {
  couple: Couple
  partner: { id: string; name: string | null } | null
  myConfirmed: boolean
  partnerConfirmed: boolean
}
