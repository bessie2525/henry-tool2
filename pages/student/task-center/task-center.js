const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    tasks: [],
    loading: true
  },

  onLoad() {
    this.loadTasks()
  },

  onShow() {
    this.loadTasks()
  },

  onPullDownRefresh() {
    this.loadTasks().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadTasks() {
    try {
      this.setData({ loading: true })

      const res = await callCloudFunction('task', {
        action: 'today'
      })

      if (res.success) {
        const tasks = res.tasks.map(task => ({
          id: task.id,
          type: task.type,
          name: task.title,
          description: task.description,
          icon: task.type === 'chinese' ? '📝' : task.type === 'english' ? '🔤' : '✅',
          status: task.status || 'pending',
          reward: task.coinReward,
          expReward: task.expReward
        }))
        this.setData({ tasks })
      }
    } catch (error) {
      console.error('加载任务失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTaskTap(e) {
    const task = e.currentTarget.dataset.task
    if (task.type === 'chinese') {
      wx.navigateTo({
        url: `/pages/student/task-chinese/task-chinese?taskId=${task.id}&taskTitle=${task.name}`
      })
    } else if (task.type === 'english') {
      wx.navigateTo({
        url: `/pages/student/task-english-learn/task-english-learn?taskId=${task.id}&taskTitle=${task.name}`
      })
    } else {
      wx.navigateTo({
        url: `/pages/student/task-daily/task-daily?taskId=${task.id}&taskTitle=${task.name}`
      })
    }
  }
})
