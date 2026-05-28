const { callFunction: callCloudFunction } = require('../../../utils/api')
const auth = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    currentChildIndex: 0,
    children: [],
    todayProgress: 0,
    todayTotal: 4,
    todayPercent: 0,
    pendingCount: 0,
    weeklyData: {
      chineseDays: 0,
      englishAccuracy: 0,
      checkinRate: 0
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadData() {
    try {
      this.setData({ loading: true })

      const res = await callCloudFunction('stats', {
        action: 'dashboard'
      })

      if (res.success) {
        const todayProgress = res.todayProgress || 0
        const todayTotal = res.todayTotal || 4
        const todayPercent = todayTotal > 0 ? Math.round((todayProgress / todayTotal) * 100) : 0

        this.setData({
          children: [
            { 
              id: res.studentId || '1', 
              name: res.studentName || '我的孩子', 
              petName: res.petName || '宠物', 
              petLevel: res.petLevel || 1, 
              coins: res.petCoins || 0, 
              mood: 'happy' 
            }
          ],
          pendingCount: res.pendingCount || 0,
          todayProgress,
          todayTotal,
          todayPercent,
          weeklyData: res.weeklyData || {
            chineseDays: 0,
            englishAccuracy: 0,
            checkinRate: 0
          }
        })
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
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
  },

  onSettingsTap() {
    wx.navigateTo({
      url: '/pages/parent/settings/settings'
    })
  }
})
