Page({
  data: {
    tasks: [],
    loading: false
  },

  onLoad() {
    this.loadTasks()
  },

  async loadTasks() {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: { action: 'today' }
      })

      if (res.result.success) {
        const tasks = (res.result.tasks || [])
          .filter(task => task.type === 'daily')
          .map(task => ({
            id: task.id,
            name: task.title,
            description: task.description,
            icon: task.title.includes('阅读') ? '📚' : task.title.includes('运动') ? '🏃' : '✅',
            status: task.status || 'pending',
            requirePhoto: !!task.requirePhoto,
            coinReward: task.coinReward || 0,
            expReward: task.expReward || 0
          }))

        this.setData({ tasks })
      }
    } catch (err) {
      console.error('加载日常任务失败', err)
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
    
    if (task.status === 'submitted' || task.status === 'approved') {
      wx.showToast({
        title: task.status === 'approved' ? '已完成打卡' : '已提交待审核',
        icon: 'none'
      })
      return
    }
    
    this.confirmCheckIn(task)
  },

  confirmCheckIn(task) {
    wx.showModal({
      title: '打卡确认',
      content: `确定完成「${task.name}」了吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitTask(task)
        }
      }
    })
  },

  async submitTask(task) {
    wx.showLoading({ title: '提交中...' })
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'submit',
          taskId: task.id,
          taskType: 'daily',
          taskTitle: task.name,
          coinReward: task.coinReward,
          expReward: task.expReward,
          submissionContent: {
            taskId: task.id,
            title: task.name,
            description: task.description,
            completedAt: new Date().toISOString()
          }
        }
      })
      
      wx.hideLoading()
      this.setData({ loading: false })
      
      if (res.result.success) {
        const tasks = this.data.tasks.map(t => {
          if (t.id === task.id) {
            return { ...t, status: 'submitted' }
          }
          return t
        })
        
        this.setData({ tasks })
        
        wx.showToast({
          title: '已提交审核',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '提交失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ loading: false })
      console.error('提交失败', err)
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    }
  }
})
