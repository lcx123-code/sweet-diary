const supabase = require('../../utils/supabase')

const recordTypes = [
  { label: '普通记录', value: null },
  { label: '纪念日', value: 'anniversary' },
  { label: '旅行', value: 'first_trip' },
  { label: '生日', value: 'birthday' },
  { label: '特别时刻', value: 'other' }
]

Page({
  data: {
    content: '',
    dateLabel: '',
    recordTypes,
    moods: [],
    typeIndex: 0,
    moodId: '',
    moodEmoji: '',
    images: [],
    saving: false,
    savingMessage: ''
  },

  onShow() {
    const app = getApp()
    if (!app.globalData.user) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    const now = new Date()
    this.setData({
      dateLabel: `${now.getMonth() + 1}.${now.getDate()}`,
      moods: app.globalData.moods || []
    })
  },

  onInput(event) {
    this.setData({ content: event.detail.value })
  },

  chooseType(event) {
    this.setData({ typeIndex: Number(event.currentTarget.dataset.index) })
  },

  chooseMood(event) {
    const mood = event.currentTarget.dataset.mood
    const active = this.data.moodId === mood.id
    this.setData({
      moodId: active ? '' : mood.id,
      moodEmoji: active ? '' : mood.emoji
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      success: (res) => {
        const files = res.tempFiles.map((file) => ({
          path: file.tempFilePath,
          width: file.width,
          height: file.height,
          size: file.size
        }))
        this.setData({ images: [...this.data.images, ...files].slice(0, 3) })
      }
    })
  },

  removeImage(event) {
    const index = Number(event.currentTarget.dataset.index)
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  async save() {
    const app = getApp()
    const user = app.globalData.user
    const coupleId = app.globalData.coupleId

    if (!user) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    if (!coupleId) {
      wx.showToast({ title: '请先绑定日记', icon: 'none' })
      return
    }
    if (!this.data.content.trim()) {
      wx.showToast({ title: '写点什么吧', icon: 'none' })
      return
    }

    this.setData({ saving: true, savingMessage: '正在保存文字...' })

    try {
      const today = new Date().toISOString().slice(0, 10)
      let diary = await supabase.findDiary(coupleId, today)
      if (!diary) {
        diary = await supabase.createDiary(coupleId, today)
      }

      const entry = await supabase.createEntry({
        diary_id: diary.id,
        user_id: user.id,
        mood_id: this.data.moodId || null,
        content: this.data.content.trim(),
        status: 'published',
        milestone_type: recordTypes[this.data.typeIndex].value
      })

      if (this.data.images.length > 0) {
        for (let i = 0; i < this.data.images.length; i += 1) {
          this.setData({ savingMessage: `正在保存照片 ${i + 1}/${this.data.images.length}...` })
          const image = await supabase.uploadDiaryImage(this.data.images[i], user.id)
          if (image?.id) {
            await supabase.linkEntryImage(entry.id, image.id)
          }
        }
      }

      this.setData({ savingMessage: '正在更新日记...' })
      await app.loadEntries()
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ content: '', images: [], saving: false, savingMessage: '' })
      wx.switchTab({ url: '/pages/index/index' })
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
      this.setData({ saving: false, savingMessage: '' })
    }
  }
})
