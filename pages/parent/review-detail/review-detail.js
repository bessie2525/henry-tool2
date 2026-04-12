Page({
  data: {
    reviewId: null,
    review: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ reviewId: options.id })
      this.loadReviewDetail()
    }
  },

  loadReviewDetail() {
    
  },

  onApprove() {
    wx.showModal({
      title: '审核通过',
      content: '确定要通过这个任务吗？孩子将获得金币奖励',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '审核通过',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  onReject() {
    wx.showModal({
      title: '审核驳回',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已驳回',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  }
})
