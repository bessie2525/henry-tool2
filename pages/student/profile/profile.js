const auth = require('../../../utils/auth.js')

Page({
  data: {
    studentInfo: null,
    inviteCode: 'ABC123',
    menuList: [
      { id: 'achievement', name: '我的成就', icon: '🏆', path: '/pages/student/achievement/achievement' },
      { id: 'settings', name: '设置', icon: '⚙️', path: '' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const studentInfo = auth.getStudentInfo()
    if (studentInfo) {
      this.setData({ 
        studentInfo: studentInfo,
        inviteCode: studentInfo.inviteCode || 'ABC123'
      })
    }
  },

  onCopyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({
          title: '已复制邀请码',
          icon: 'success'
        })
      }
    })
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
