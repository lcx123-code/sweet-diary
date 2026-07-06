Page({
  data: {
    years: []
  },

  onShow() {
    const entries = getApp().globalData.entries
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

    this.setData({ years })
  },

  goEntry(event) {
    wx.navigateTo({
      url: `/pages/entry/entry?id=${event.currentTarget.dataset.id}`
    })
  }
})
