Page({
  data: {
    reviewList: [
      { id: '1', type: 'chinese', title: '语文每日一记', content: '今天我读了一本很好的书...', time: '10:30', status: 'pending' },
      { id: '2', type: 'daily', title: '运动打卡', content: '跑步30分钟', time: '09:15', status: 'pending' }
    ],
    filterType: 'pending'
  },

  onLoad() {
    this.loadReviews()
  },

  loadReviews() {
    
  },

  onFilterChange(e) {
    this.setData({ filterType: e.detail.value })
  },

  onReviewTap(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/parent/review-detail/review-detail?id=${item.id}`
    })
  }
})
