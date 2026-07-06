Page({
  data: {
    email: '',
    password: ''
  },

  onEmail(event) {
    this.setData({ email: event.detail.value })
  },

  onPassword(event) {
    this.setData({ password: event.detail.value })
  },

  login() {
    wx.showToast({ title: '已进入', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500)
  },

  goJoin() {
    wx.navigateTo({ url: '/pages/join/join' })
  }
})
