Page({
  data: {
    todayTheme: '',
    themeList: [
      '我最喜欢的节日',
      '我的梦想',
      '一件开心的事',
      '我的好朋友'
    ]
  },

  onLoad() {
    this.loadThemes()
  },

  loadThemes() {
    
  },

  onThemeInput(e) {
    this.setData({ todayTheme: e.detail.value })
  },

  onSelectTheme(e) {
    const theme = e.currentTarget.dataset.theme
    this.setData({ todayTheme: theme })
  },

  onSaveTheme() {
    if (!this.data.todayTheme.trim()) {
      wx.showToast({
        title: '请输入主题',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    })
  }
})
