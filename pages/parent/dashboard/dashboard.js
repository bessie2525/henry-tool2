Page({
  data: {
    currentChildIndex: 0,
    children: [
      { id: '1', name: '小明', petName: '咪咪', petLevel: 5, coins: 120, mood: 'happy' }
    ],
    todayProgress: 2,
    todayTotal: 4,
    pendingCount: 3,
    weeklyData: {
      chineseDays: 5,
      englishAccuracy: 85,
      checkinRate: 90
    }
  },

  onLoad() {
    this.loadData()
  },

  loadData() {
    
  },

  onChildChange(e) {
    const index = e.detail.value
    this.setData({ currentChildIndex: index })
  },

  onReviewTap() {
    wx.navigateTo({
      url: '/pages/parent/review/review'
    })
  },

  onTaskManageTap() {
    wx.navigateTo({
      url: '/pages/parent/task-manage/task-manage'
    })
  },

  onReportTap() {
    wx.navigateTo({
      url: '/pages/parent/report/report'
    })
  }
})
