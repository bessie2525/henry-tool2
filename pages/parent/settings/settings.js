const auth = require('../../../utils/auth.js')

Page({
  data: {
    hasMultipleRoles: false,
    menuList: [
      { id: 'child', name: '孩子管理', icon: '👨‍👩‍👧', path: '/pages/parent/child-manage/child-manage' },
      { id: 'coin', name: '金币规则设置', icon: '🪙', path: '' },
      { id: 'about', name: '关于', icon: 'ℹ️', path: '' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const hasMultipleRoles = auth.hasMultipleRoles()
    this.setData({ hasMultipleRoles: hasMultipleRoles })
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu
    if (menu.path) {
      wx.navigateTo({
        url: menu.path
      })
    } else {
      wx.showToast({
        title: '功能待实现',
        icon: 'none'
      })
    }
  },

  onSwitchRole() {
    wx.redirectTo({
      url: '/pages/role-select/role-select?fromLogin=1'
    })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.clearAuth()
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})
