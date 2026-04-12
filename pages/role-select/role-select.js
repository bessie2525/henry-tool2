const auth = require('../../utils/auth.js')

Page({
  data: {},

  onLoad() {
    console.log('角色选择页面加载')
  },

  onSelectStudent() {
    wx.navigateTo({
      url: '/pages/student-register/student-register'
    })
  },

  onSelectParent() {
    wx.navigateTo({
      url: '/pages/parent-register/parent-register'
    })
  }
})
