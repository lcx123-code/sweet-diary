Page({
  data: {
    userName: '',
    partnerName: '',
    daysTogether: 0,
    todayCount: 0,
    todayPreview: '',
    entries: []
  },

  onShow() {
    const app = getApp()
    const entries = app.globalData.entries
    this.setData({
      userName: app.globalData.user.name,
      partnerName: app.globalData.partnerName,
      daysTogether: app.globalData.daysTogether,
      todayCount: 1,
      todayPreview: entries[0]?.content || '写一句今天的小事，把这一页留给你们。',
      entries
    })
  },

  goWrite() {
    wx.switchTab({ url: '/pages/write/write' })
  },

  goEntry(event) {
    wx.navigateTo({
      url: `/pages/entry/entry?id=${event.currentTarget.dataset.id}`
    })
  }
})
