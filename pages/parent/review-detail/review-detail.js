const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    reviewId: null,
    submission: null,
    student: null,
    coinReward: 10,
    expReward: 5,
    loading: true,
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ reviewId: options.id })
      this.loadReviewDetail()
    }
  },

  async loadReviewDetail() {
    try {
      this.setData({ loading: true })

      const res = await callCloudFunction('review', {
        action: 'detail',
        submissionId: this.data.reviewId
      })

      if (res.success) {
        this.setData({
          submission: res.submission,
          student: res.student
        })
      }
    } catch (error) {
      console.error('加载审核详情失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onCoinRewardChange(e) {
    this.setData({ coinReward: parseInt(e.detail.value) || 0 })
  },

  onExpRewardChange(e) {
    this.setData({ expReward: parseInt(e.detail.value) || 0 })
  },

  async onApprove() {
    if (this.data.submitting) return

    const that = this
    wx.showModal({
      title: '审核通过',
      content: '确定要通过这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            that.setData({ submitting: true })

            const approveRes = await callCloudFunction('review', {
              action: 'approve',
              submissionId: that.data.reviewId,
              coinReward: that.data.coinReward,
              expReward: that.data.expReward
            })

            if (approveRes.success) {
              wx.showToast({
                title: '审核通过',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: approveRes.message || '审核失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('审核失败:', error)
            wx.showToast({
              title: '审核失败',
              icon: 'none'
            })
          } finally {
            that.setData({ submitting: false })
          }
        }
      }
    })
  },

  async onReject() {
    if (this.data.submitting) return

    const that = this
    wx.showModal({
      title: '审核驳回',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: async (res) => {
        if (res.confirm) {
          try {
            that.setData({ submitting: true })

            const rejectRes = await callCloudFunction('review', {
              action: 'reject',
              submissionId: that.data.reviewId,
              comment: res.content || ''
            })

            if (rejectRes.success) {
              wx.showToast({
                title: '已驳回',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: rejectRes.message || '驳回失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('驳回失败:', error)
            wx.showToast({
              title: '驳回失败',
              icon: 'none'
            })
          } finally {
            that.setData({ submitting: false })
          }
        }
      }
    })
  },

  formatContent(content, type) {
    if (!content) return ''

    switch (type) {
      case 'chinese':
        return content.content || content.diaryText || ''
      case 'english':
        return content.words ? `学习单词：${content.words.join(', ')}` : ''
      case 'daily':
        return content.description || ''
      default:
        return ''
    }
  }
})
