Page({
  data: {
    todayTheme: '我最喜欢的节日',
    content: '',
    historyList: []
  },

  onLoad() {
    this.loadData()
  },

  loadData() {
    
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onVoiceInput() {
    wx.showToast({
      title: '语音输入功能待实现',
      icon: 'none'
    })
  },

  onSubmit() {
    const content = this.data.content.trim()
    
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }
    
    if (content.length < 10) {
      wx.showToast({
        title: '最少输入10个字',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '提交成功，待审核',
      icon: 'success'
    })
  }
})
