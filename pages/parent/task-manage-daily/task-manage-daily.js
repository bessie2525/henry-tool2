Page({
  data: {
    taskList: [
      { id: 1, title: '运动打卡', description: '运动30分钟', enabled: true, coinReward: 12, expReward: 6 },
      { id: 2, title: '阅读打卡', description: '阅读15分钟', enabled: true, coinReward: 10, expReward: 5 },
      { id: 3, title: '早睡打卡', description: '21:00前睡觉', enabled: false, coinReward: 8, expReward: 4 }
    ],
    newTaskTitle: '',
    newTaskDesc: '',
    newCoinReward: 10,
    newExpReward: 5
  },

  onLoad() {
    this.loadTasks()
  },

  loadTasks() {
    
  },

  onTitleInput(e) {
    this.setData({ newTaskTitle: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ newTaskDesc: e.detail.value })
  },

  onCoinInput(e) {
    this.setData({ newCoinReward: parseInt(e.detail.value) || 0 })
  },

  onExpInput(e) {
    this.setData({ newExpReward: parseInt(e.detail.value) || 0 })
  },

  onAddTask() {
    const { newTaskTitle, newTaskDesc, newCoinReward, newExpReward, taskList } = this.data
    
    if (!newTaskTitle.trim() || !newTaskDesc.trim()) {
      wx.showToast({
        title: '请输入完整信息',
        icon: 'none'
      })
      return
    }
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      enabled: true,
      coinReward: newCoinReward,
      expReward: newExpReward
    }
    
    this.setData({
      taskList: [...taskList, newTask],
      newTaskTitle: '',
      newTaskDesc: ''
    })
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
  },

  onToggleTask(e) {
    const id = e.currentTarget.dataset.id
    const { taskList } = this.data
    
    const updatedList = taskList.map(task => {
      if (task.id === id) {
        return { ...task, enabled: !task.enabled }
      }
      return task
    })
    
    this.setData({ taskList: updatedList })
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    })
  },

  onDeleteTask(e) {
    const id = e.currentTarget.dataset.id
    const { taskList } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            taskList: taskList.filter(t => t.id !== id)
          })
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  }
})
