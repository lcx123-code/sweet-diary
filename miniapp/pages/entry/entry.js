Page({
  data: {
    date: '',
    entries: []
  },

  onLoad(options) {
    const allEntries = getApp().globalData.entries
    const current = allEntries.find((entry) => entry.id === options.id) || allEntries[0]
    const entries = allEntries.filter((entry) => entry.date === current.date)
    this.setData({
      date: current.date,
      entries: entries.length ? entries : [current]
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
