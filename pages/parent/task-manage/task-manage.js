Page({
  data: {
    menuList: [
      { id: 'chinese', name: '语文任务设置', icon: '📝', path: '/pages/parent/task-manage-chinese/task-manage-chinese' },
      { id: 'english', name: '英语单词管理', icon: '🔤', path: '/pages/parent/task-manage-english/task-manage-english' },
      { id: 'daily', name: '日常打卡管理', icon: '✅', path: '/pages/parent/task-manage-daily/task-manage-daily' }
    ]
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu
    if (menu.path) {
      wx.navigateTo({
        url: menu.path
      })
    }
  }
})
