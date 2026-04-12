const auth = require('../../utils/auth.js')

Page({
  data: {
    inviteCode: '',
    loading: false
  },

  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.value.toUpperCase() })
  },

  onBind() {
    const inviteCode = this.data.inviteCode.trim()
    
    if (!inviteCode || inviteCode.length !== 6) {
      wx.showToast({
        title: '请输入6位邀请码',
        icon: 'none'
      })
      return
    }
    
    if (this.data.loading) return
    
    this.setData({ loading: true })
    wx.showLoading({ title: '绑定中...' })
    
    auth.bindChild(inviteCode).then(result => {
      wx.hideLoading()
      
      wx.showToast({
        title: '绑定成功！',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/parent/dashboard/dashboard'
        })
      }, 1500)
      
      this.setData({ loading: false })
    }).catch(err => {
      wx.hideLoading()
      console.error('绑定失败', err)
      wx.showToast({
        title: err.message || '绑定失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  onSkip() {
    wx.switchTab({
      url: '/pages/parent/dashboard/dashboard'
    })
  }
})
