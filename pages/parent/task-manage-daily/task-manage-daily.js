const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    taskList: [],
    loading: false,
    newTaskTitle: '',
    newTaskDesc: '',
    newCoinReward: 10,
    newExpReward: 5
  },

  onLoad() {
    this.loadTasks()
  },

  async loadTasks() {
    try {
      this.setData({ loading: true })
      const res = await callCloudFunction('task', {
        action: 'daily_list'
      })

      this.setData({ taskList: res.tasks || [] })
    } catch (err) {
      console.error('加载日常任务失败', err)
    } finally {
      this.setData({ loading: false })
    }
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

  async onAddTask() {
    const { newTaskTitle, newTaskDesc, newCoinReward, newExpReward } = this.data
    
    if (!newTaskTitle.trim() || !newTaskDesc.trim()) {
      wx.showToast({
        title: '请输入完整信息',
        icon: 'none'
      })
      return
    }

    try {
      await callCloudFunction('task', {
        action: 'daily_add',
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        coinReward: newCoinReward,
        expReward: newExpReward
      })

      this.setData({
        newTaskTitle: '',
        newTaskDesc: ''
      })
      await this.loadTasks()
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('添加日常任务失败', err)
    }
  },

  async onToggleTask(e) {
    const id = e.currentTarget.dataset.id
    const task = this.data.taskList.find(item => item.id === id)
    if (!task) return

    try {
      await callCloudFunction('task', {
        action: 'daily_update',
        taskId: id,
        enabled: !task.enabled
      })
      await this.loadTasks()
      
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('更新日常任务失败', err)
    }
  },

  onDeleteTask(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteTask(id)
        }
      }
    })
  },

  async deleteTask(id) {
    try {
      await callCloudFunction('task', {
        action: 'daily_delete',
        taskId: id
      })
      await this.loadTasks()

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('删除日常任务失败', err)
    }
  }
})
