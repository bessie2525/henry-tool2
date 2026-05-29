const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    todayTheme: '',
    loading: false,
    saving: false,
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

  async loadThemes() {
    try {
      this.setData({ loading: true })
      const res = await callCloudFunction('task', {
        action: 'chinese_theme_get',
        role: 'parent'
      })

      this.setData({
        todayTheme: res.theme || ''
      })
    } catch (err) {
      console.error('加载语文主题失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onThemeInput(e) {
    this.setData({ todayTheme: e.detail.value })
  },

  onSelectTheme(e) {
    const theme = e.currentTarget.dataset.theme
    this.setData({ todayTheme: theme })
  },

  async onSaveTheme() {
    if (!this.data.todayTheme.trim()) {
      wx.showToast({
        title: '请输入主题',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ saving: true })
      await callCloudFunction('task', {
        action: 'chinese_theme_set',
        role: 'parent',
        theme: this.data.todayTheme.trim()
      })
      
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('保存语文主题失败', err)
    } finally {
      this.setData({ saving: false })
    }
  }
})
