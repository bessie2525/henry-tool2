const { callCloudFunction } = require('../../../utils/api')
const auth = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    currentChildIndex: 0,
    children: [],
    todayProgress: 0,
    todayTotal: 4,
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

      const parentInfo = auth.getUserInfo()
      if (!parentInfo || !parentInfo.parentId) {
        this.setData({ loading: false })
        return
      }

      const res = await callCloudFunction('review', {
        action: 'pending',
        status: 'pending'
      })

      if (res.success && res.reviews) {
        const pendingCount = res.reviews.length

        this.setData({
          children: [
            { 
              id: '1', 
              name: '我的孩子', 
              petName: '宠物', 
              petLevel: 1, 
              coins: 0, 
              mood: 'happy' 
            }
          ],
          pendingCount: pendingCount,
          todayProgress: 0,
          weeklyData: {
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
