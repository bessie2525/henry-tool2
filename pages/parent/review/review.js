const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    reviewList: [],
    filterType: 'pending',
    loading: true
  },

  onLoad() {
    this.loadReviews()
  },

  onShow() {
    this.loadReviews()
  },

  onPullDownRefresh() {
    this.loadReviews().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadReviews() {
    try {
      this.setData({ loading: true })

      const res = await callCloudFunction('review', {
        action: 'pending',
        status: this.data.filterType
      })

      if (res.success) {
        const reviewList = res.reviews.map(item => ({
          id: item.id,
          type: item.taskType,
          title: item.taskTitle,
          studentName: item.studentName,
          content: this.formatContent(item.submissionContent, item.taskType),
          time: this.formatTime(item.submitTime),
          status: item.status,
          coinReward: item.coinReward,
          expReward: item.expReward
        }))

        this.setData({ reviewList })
      }
    } catch (error) {
      console.error('加载审核列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  formatContent(content, type) {
    if (!content) return ''
    
    switch (type) {
      case 'chinese':
        return content.content || content.diaryText || ''
      case 'english':
        return content.words ? `单词：${content.words.join(', ')}` : ''
      case 'daily':
        return content.photo ? '图片打卡' : content.description || ''
      default:
        return ''
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  },

  onFilterChange(e) {
    this.setData({ filterType: e.detail.value })
    this.loadReviews()
  },

  onReviewTap(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/parent/review-detail/review-detail?id=${item.id}`
    })
  }
})
