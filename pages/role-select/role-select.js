const auth = require('../../utils/auth.js')

Page({
  data: {
    fromLogin: false,
    identities: [],
    hasStudent: false,
    hasParent: false,
    canRegister: true
  },

  onLoad(options) {
    console.log('角色选择页面加载', options)
    const fromLogin = options.fromLogin === '1'
    this.setData({ fromLogin })
    
    if (fromLogin) {
      this.loadIdentitiesFromServer()
    } else {
      this.loadIdentities()
    }
  },

  loadIdentitiesFromServer() {
    wx.showLoading({ title: '加载中...' })
    
    auth.getUserInfoFromServer().then(result => {
      wx.hideLoading()
      const identities = result.identities || []
      const hasStudent = identities.some(i => i.role === 'student')
      const hasParent = identities.some(i => i.role === 'parent')
      
      this.setData({
        identities,
        hasStudent,
        hasParent,
        canRegister: !hasStudent || !hasParent
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('获取用户信息失败', err)
      this.loadIdentities()
    })
  },

  loadIdentities() {
    const identities = auth.getIdentities()
    const hasStudent = identities.some(i => i.role === 'student')
    const hasParent = identities.some(i => i.role === 'parent')
    
    this.setData({
      identities,
      hasStudent,
      hasParent,
      canRegister: !hasStudent || !hasParent
    })
  },

  onSelectIdentity(e) {
    const role = e.currentTarget.dataset.role
    wx.showLoading({ title: '加载中...' })
    
    auth.selectRole(role).then(() => {
      wx.hideLoading()
      if (role === 'student') {
        wx.switchTab({
          url: '/pages/student/pet-home/pet-home'
        })
      } else {
        wx.redirectTo({
          url: '/pages/parent/dashboard/dashboard'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '选择失败',
        icon: 'none'
      })
    })
  },

  onSelectStudent() {
    if (this.data.hasStudent) {
      wx.showToast({
        title: '您已注册学生身份',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/student-register/student-register'
    })
  },

  onSelectParent() {
    if (this.data.hasParent) {
      wx.showToast({
        title: '您已注册家长身份',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/parent-register/parent-register'
    })
  },

  onBackToLogin() {
    auth.clearCurrentRole()
    wx.reLaunch({
      url: '/pages/login/login'
    })
  }
})
