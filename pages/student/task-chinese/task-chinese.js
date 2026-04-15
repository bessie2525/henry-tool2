const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    taskId: null,
    taskTitle: '语文每日一记',
    todayTheme: '我最喜欢的节日',
    content: '',
    submitting: false,
    historyList: []
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({ taskId: options.taskId })
    }
    if (options.taskTitle) {
      this.setData({ taskTitle: options.taskTitle })
    }
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

  async onSubmit() {
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
    
    if (this.data.submitting) {
      return
    }
    
    try {
      this.setData({ submitting: true })
      
      const res = await callCloudFunction('task', {
        action: 'submit',
        taskType: 'chinese',
        taskTitle: this.data.taskTitle,
        submissionContent: {
          content: content,
          theme: this.data.todayTheme
        }
      })
      
      if (res.success) {
        wx.showToast({
          title: '提交成功，待审核',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.message || '提交失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交失败:', error)
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
