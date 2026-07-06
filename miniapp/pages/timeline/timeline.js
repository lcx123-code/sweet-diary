Page({
  data: {
    years: [],
    loading: true
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
    const yearMap = {}

    entries.forEach((entry) => {
      if (!yearMap[entry.year]) yearMap[entry.year] = {}
      if (!yearMap[entry.year][entry.month]) yearMap[entry.year][entry.month] = []
      yearMap[entry.year][entry.month].push(entry)
    })

    const years = Object.keys(yearMap).map((year) => ({
      year,
      months: Object.keys(yearMap[year]).map((month) => ({
        month,
        entries: yearMap[year][month]
      }))
    }))

    this.setData({ years, loading: false })
  },

  goEntry(event) {
    wx.navigateTo({
      url: `/pages/entry/entry?id=${event.currentTarget.dataset.id}`
    })
  }
})
