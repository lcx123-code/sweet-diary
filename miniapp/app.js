const supabase = require('./utils/supabase')

function formatEntry(entry, imageMap = {}) {
  const date = new Date(entry.created_at)
  const images = imageMap[entry.id] || []
  return {
    id: entry.id,
    diaryId: entry.diary_id,
    date: `${date.getMonth() + 1}.${date.getDate()}`,
    day: String(date.getDate()).padStart(2, '0'),
    month: `${date.getMonth() + 1}月`,
    year: `${date.getFullYear()}`,
    author: entry.author_name || '记录者',
    mood: entry.mood?.emoji || '',
    moodId: entry.mood_id || '',
    type: milestoneLabel(entry.milestone_type),
    milestoneType: entry.milestone_type || null,
    content: entry.content || '',
    createdAt: entry.created_at,
    images
  }
}

function milestoneLabel(type) {
  const labels = {
    first_trip: '旅行',
    anniversary: '纪念日',
    birthday: '生日',
    move_in: '同居',
    proposal: '求婚',
    other: '特别时刻'
  }
  return labels[type] || '普通记录'
}

App({
  globalData: {
    session: null,
    user: null,
    profile: null,
    coupleId: null,
    partnerName: '',
    daysTogether: 0,
    entries: [],
    moods: []
  },

  onLaunch() {
    const token = wx.getStorageSync('sb_access_token')
    const user = wx.getStorageSync('sb_user')
    if (token && user) {
      this.globalData.session = { access_token: token }
      this.globalData.user = user
    }
  },

  async signIn(email, password) {
    const session = await supabase.signIn(email, password)
    wx.setStorageSync('sb_access_token', session.access_token)
    wx.setStorageSync('sb_user', session.user)
    this.globalData.session = session
    this.globalData.user = session.user
    await this.loadCurrentUserData()
    return session
  },

  signOut() {
    supabase.signOut()
    this.globalData.session = null
    this.globalData.user = null
    this.globalData.profile = null
    this.globalData.coupleId = null
    this.globalData.partnerName = ''
    this.globalData.daysTogether = 0
    this.globalData.entries = []
  },

  async loadCurrentUserData() {
    const user = this.globalData.user
    if (!user?.id) return

    const [profile, membership, moods] = await Promise.all([
      supabase.getProfile(user.id),
      supabase.getMyMembership(user.id),
      supabase.getMoods()
    ])

    this.globalData.profile = profile
    this.globalData.moods = moods || []

    if (!membership?.couple_id) {
      this.globalData.coupleId = null
      this.globalData.entries = []
      return
    }

    this.globalData.coupleId = membership.couple_id
    const [couple, partner] = await Promise.all([
      supabase.getCouple(membership.couple_id),
      supabase.getPartnerInfo(user.id).catch(() => null)
    ])

    this.globalData.partnerName = partner?.partner_name || ''
    this.globalData.daysTogether = couple?.created_at ? daysSince(couple.created_at) : 0
    await this.loadEntries()
  },

  async loadEntries() {
    const coupleId = this.globalData.coupleId
    if (!coupleId) {
      this.globalData.entries = []
      return []
    }

    const [diaries, rawEntries] = await Promise.all([
      supabase.getDiaries(coupleId),
      supabase.getEntries()
    ])

    const diaryIds = new Set((diaries || []).map((diary) => diary.id))
    const entries = (rawEntries || []).filter((entry) => diaryIds.has(entry.diary_id))
    const userIds = Array.from(new Set(entries.map((entry) => entry.user_id)))
    const profiles = await Promise.all(userIds.map((id) => supabase.getProfile(id).catch(() => null)))
    const profileMap = new Map(profiles.filter(Boolean).map((profile) => [profile.id, profile.name]))

    entries.forEach((entry) => {
      entry.author_name = profileMap.get(entry.user_id) || '记录者'
    })

    const imageRows = await supabase.getEntryImages(entries.map((entry) => entry.id)).catch(() => [])
    const imageMap = {}
    ;(imageRows || []).forEach((row) => {
      const img = Array.isArray(row.images) ? row.images[0] : row.images
      if (!img?.bucket || !img?.path) return
      if (!imageMap[row.entry_id]) imageMap[row.entry_id] = []
      imageMap[row.entry_id].push(supabase.getPublicImageUrl(img.bucket, img.path))
    })

    this.globalData.entries = entries.map((entry) => formatEntry(entry, imageMap))
    return this.globalData.entries
  }
})

function daysSince(value) {
  const start = new Date(value)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
