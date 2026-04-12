Page({
  data: {
    tasks: [
      { id: 'chinese', name: '语文每日一记', icon: '📝', status: 'pending', reward: 10 },
      { id: 'english', name: '英语单词大冒险', icon: '🔤', status: 'pending', reward: 10 },
      { id: 'daily1', name: '阅读30分钟', icon: '📚', status: 'pending', reward: 5 },
      { id: 'daily2', name: '运动打卡', icon: '🏃', status: 'pending', reward: 5 }
    ],
    completedCount: 0,
    totalCount: 4
  },

  onLoad() {
    this.loadTasks()
  },

  loadTasks() {
    const completed = this.data.tasks.filter(t => t.status === 'approved').length
    this.setData({ completedCount: completed })
  },

  onTaskTap(e) {
    const task = e.currentTarget.dataset.task
    if (task.id === 'chinese') {
      wx.navigateTo({
        url: '/pages/student/task-chinese/task-chinese'
      })
    } else if (task.id === 'english') {
      wx.navigateTo({
        url: '/pages/student/task-english-learn/task-english-learn'
      })
    } else {
      wx.navigateTo({
        url: '/pages/student/task-daily/task-daily'
      })
    }
  }
})
