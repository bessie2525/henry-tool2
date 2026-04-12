Page({
  data: {
    tasks: [
      { id: '1', name: '阅读30分钟', icon: '📚', status: 'pending', requirePhoto: true },
      { id: '2', name: '运动打卡', icon: '🏃', status: 'pending', requirePhoto: false }
    ]
  },

  onLoad() {
    this.loadTasks()
  },

  loadTasks() {
    
  },

  onTaskTap(e) {
    const task = e.currentTarget.dataset.task
    wx.showToast({
      title: '打卡功能待实现',
      icon: 'none'
    })
  }
})
