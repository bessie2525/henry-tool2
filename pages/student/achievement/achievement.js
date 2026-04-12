Page({
  data: {
    categories: [
      { id: 'all', name: '全部' },
      { id: 'learning', name: '学习勤勉' },
      { id: 'chinese', name: '语文达人' },
      { id: 'english', name: '单词大师' },
      { id: 'pet', name: '宠物关爱' },
      { id: 'special', name: '特殊成就' }
    ],
    selectedCategory: 'all',
    achievements: [
      { id: '1', name: '初次见面', category: 'pet', description: '首次创建宠物', icon: '🐾', unlocked: true, reward: { coins: 10 }, claimed: true },
      { id: '2', name: '小作家', category: 'chinese', description: '累计写满30篇每日一记', icon: '📝', unlocked: false, progress: 5, total: 30, reward: { coins: 100 } },
      { id: '3', name: '词汇达人', category: 'english', description: '累计掌握500个单词', icon: '🔤', unlocked: false, progress: 20, total: 500, reward: { coins: 200 } },
      { id: '4', name: '勤劳小蜜蜂', category: 'learning', description: '连续7天完成所有任务', icon: '🐝', unlocked: false, progress: 3, total: 7, reward: { coins: 50 } }
    ]
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category.id })
  },

  onClaimTap(e) {
    const achievement = e.currentTarget.dataset.achievement
    wx.showToast({
      title: '领取功能待实现',
      icon: 'none'
    })
  }
})
