const auth = require('../../utils/auth.js')

Page({
  data: {
    nickname: '',
    loading: false
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onSubmit() {
    const nickname = this.data.nickname.trim()
    
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }
    
    if (this.data.loading) return
    
    this.setData({ loading: true })
    wx.showLoading({ title: '注册中...' })
    
    auth.registerParent(nickname).then(result => {
      wx.hideLoading()
      
      auth.setCurrentRole('parent')
      auth.setParentInfo({
        _id: result.parentId
      })
      
      wx.redirectTo({
        url: '/pages/parent-bind/parent-bind'
      })
      
      this.setData({ loading: false })
    }).catch(err => {
      wx.hideLoading()
      console.error('注册失败', err)
      wx.showToast({
        title: err.message || '注册失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  }
})
