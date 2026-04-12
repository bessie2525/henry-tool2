Page({
  data: {
    categories: [
      { id: 'skin', name: '皮肤' },
      { id: 'accessory', name: '装饰' },
      { id: 'scene', name: '场景' }
    ],
    selectedCategory: 'skin',
    items: []
  },

  onLoad() {
    this.loadItems()
  },

  loadItems() {
    
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category.id })
  },

  onItemTap(e) {
    wx.showToast({
      title: '换装功能待实现',
      icon: 'none'
    })
  }
})
