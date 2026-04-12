const auth = require('../../utils/auth.js')

Page({
  data: {
    loading: false
  },

  onLoad() {
    console.log('登录页面加载')
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    if (auth.isLoggedIn()) {
      if (auth.isStudent()) {
        wx.switchTab({
          url: '/pages/student/pet-home/pet-home'
        })
      } else if (auth.isParent()) {
        wx.redirectTo({
          url: '/pages/parent/dashboard/dashboard'
        })
      }
    }
  },

  onClearLogin() {
    auth.clearAuth()
    wx.showToast({
      title: '已清除登录状态',
      icon: 'success'
    })
  },

  onLogin() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    wx.showLoading({ title: '登录中...' })
    
    auth.login().then(result => {
      wx.hideLoading()
      
      if (result.registered) {
        if (result.role === 'student') {
          wx.switchTab({
            url: '/pages/student/pet-home/pet-home'
          })
        } else {
          wx.redirectTo({
            url: '/pages/parent/dashboard/dashboard'
          })
        }
      } else {
        wx.redirectTo({
          url: '/pages/role-select/role-select'
        })
      }
      
      this.setData({ loading: false })
    }).catch(err => {
      wx.hideLoading()
      console.error('登录失败', err)
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  }
})
