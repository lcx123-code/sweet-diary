Page({
  data: {
    email: '',
    password: '',
    loading: false
  },

  onEmail(event) {
    this.setData({ email: event.detail.value })
  },

  onPassword(event) {
    this.setData({ password: event.detail.value })
  },

  async login() {
    if (!this.data.email || !this.data.password) {
      wx.showToast({ title: '请输入邮箱和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      await getApp().signIn(this.data.email.trim(), this.data.password)
      wx.showToast({ title: '已登录', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 400)
    } catch (error) {
      wx.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loginWithWechat() {
    this.setData({ loading: true })
    try {
      await getApp().signInWithWechat()
      wx.showToast({ title: '已登录', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 400)
    } catch (error) {
      wx.showToast({ title: error.message || '微信登录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goJoin() {
    wx.navigateTo({ url: '/pages/join/join' })
  }
})
