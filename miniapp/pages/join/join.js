Page({
  data: {
    code: ''
  },

  onInput(event) {
    this.setData({ code: event.detail.value.toUpperCase() })
  },

  join() {
    if (this.data.code.length < 4) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    wx.showToast({ title: '已加入', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 600)
  },

  goBack() {
    wx.navigateBack()
  }
})
