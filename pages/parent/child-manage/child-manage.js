Page({
  data: {
    children: [
      { id: '1', name: '小明', inviteCode: 'ABC123' }
    ]
  },

  onLoad() {
    this.loadChildren()
  },

  loadChildren() {
    
  },

  onCopyCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制邀请码',
          icon: 'success'
        })
      }
    })
  },

  onUnbind(e) {
    wx.showModal({
      title: '解绑确认',
      content: '确定要解绑这个孩子吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '解绑成功',
            icon: 'success'
          })
        }
      }
    })
  }
})
