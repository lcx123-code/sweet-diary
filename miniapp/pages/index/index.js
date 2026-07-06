Page({
  data: {
    userName: '',
    partnerName: '',
    daysTogether: 0,
    todayCount: 0,
    todayPreview: '',
    entries: [],
    loading: true,
    hasCouple: false
  },

  async onShow() {
    const app = getApp()
    if (!app.globalData.user) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })
    await app.loadCurrentUserData().catch((error) => {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
    })
    const entries = app.globalData.entries || []
    const todayKey = new Date()
    const todayDate = `${todayKey.getMonth() + 1}.${todayKey.getDate()}`
    const todayEntries = entries.filter((entry) => entry.date === todayDate)
    this.setData({
      userName: app.globalData.profile?.name || app.globalData.user?.email || '你的日记',
      partnerName: app.globalData.partnerName,
      daysTogether: app.globalData.daysTogether,
      todayCount: todayEntries.length,
      todayPreview: todayEntries[0]?.content || '写一句今天的小事，把这一页留给你们。',
      entries,
      hasCouple: !!app.globalData.coupleId,
      loading: false
    })
  },

  goWrite() {
    wx.switchTab({ url: '/pages/write/write' })
  },

  goJoin() {
    wx.navigateTo({ url: '/pages/join/join' })
  },

  goEntry(event) {
    wx.navigateTo({
      url: `/pages/entry/entry?id=${event.currentTarget.dataset.id}`
    })
  }
})
