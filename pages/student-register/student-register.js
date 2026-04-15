const auth = require('../../utils/auth.js')
const constants = require('../../utils/constants.js')

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
    
    if (nickname.length < 2 || nickname.length > 10) {
      wx.showToast({
        title: '昵称2-10个字符',
        icon: 'none'
      })
      return
    }
    
    if (this.data.loading) return
    
    this.setData({ loading: true })
    wx.showLoading({ title: '注册中...' })
    
    auth.registerStudent(nickname).then(result => {
      wx.hideLoading()
      
      wx.showToast({
        title: '注册成功！',
        icon: 'success',
        duration: 1000
      })
      
      setTimeout(() => {
        auth.setCurrentRole('student')
        auth.setStudentInfo({
          _id: result.studentId,
          inviteCode: result.inviteCode,
          coinBalance: 0
        })
        
        wx.redirectTo({
          url: '/pages/pet-create/pet-create'
        })
      }, 1000)
      
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
