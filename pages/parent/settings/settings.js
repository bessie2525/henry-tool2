Page({
  data: {
    menuList: [
      { id: 'child', name: '孩子管理', icon: '👨‍👩‍👧', path: '/pages/parent/child-manage/child-manage' },
      { id: 'coin', name: '金币规则设置', icon: '🪙', path: '' },
      { id: 'about', name: '关于', icon: 'ℹ️', path: '' }
    ]
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu
    if (menu.path) {
      wx.navigateTo({
        url: menu.path
      })
    } else {
      wx.showToast({
        title: '功能待实现',
        icon: 'none'
      })
    }
  }
})
