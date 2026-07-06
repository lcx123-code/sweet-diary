const recordTypes = ['普通记录', '纪念日', '旅行', '生日', '特别时刻']
const moods = ['😊', '🌿', '🍲', '✨', '🌧️', '☕']

Page({
  data: {
    content: '',
    dateLabel: '',
    recordTypes,
    moods,
    typeIndex: 0,
    mood: '',
    images: [],
    saving: false,
    savingMessage: ''
  },

  onLoad() {
    const now = new Date()
    this.setData({
      dateLabel: `${now.getMonth() + 1}.${now.getDate()}`
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
    this.setData({ mood: this.data.mood === mood ? '' : mood })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      success: (res) => {
        const files = res.tempFiles.map((file) => file.tempFilePath)
        this.setData({ images: [...this.data.images, ...files].slice(0, 3) })
      }
    })
  },

  removeImage(event) {
    const index = Number(event.currentTarget.dataset.index)
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  save() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '写点什么吧', icon: 'none' })
      return
    }

    this.setData({ saving: true, savingMessage: '正在保存文字...' })
    setTimeout(() => {
      this.setData({ savingMessage: this.data.images.length ? '正在保存照片...' : '正在更新日记...' })
    }, 450)
    setTimeout(() => {
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ saving: false, savingMessage: '' })
      wx.switchTab({ url: '/pages/index/index' })
    }, 900)
  }
})
