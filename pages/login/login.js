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
    if (auth.isLoggedIn() && auth.getCurrentRole()) {
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

  onLogin() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    wx.showLoading({ title: '登录中...' })
    
    auth.clearCurrentRole()
    
    auth.login().then(result => {
      wx.hideLoading()
      
      console.log('登录结果', result)
      
      if (result.registered) {
        if (result.hasMultipleRoles || (result.identities && result.identities.length > 0)) {
          wx.redirectTo({
            url: '/pages/role-select/role-select?fromLogin=1'
          })
        } else {
          wx.redirectTo({
            url: '/pages/role-select/role-select'
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
  },

  onClearLogin() {
    auth.clearCurrentRole()
    wx.showToast({
      title: '已清除角色选择',
      icon: 'success'
    })
  }
})
