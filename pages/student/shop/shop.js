Page({
  data: {
    categories: [
      { id: 'food', name: '食物', emoji: '🍖' },
      { id: 'drink', name: '饮品', emoji: '💧' },
      { id: 'skin', name: '皮肤', emoji: '👔' },
      { id: 'accessory', name: '装饰', emoji: '🎀' },
      { id: 'scene', name: '场景', emoji: '🏠' },
      { id: 'prop', name: '道具', emoji: '✨' }
    ],
    selectedCategory: 'food',
    items: [
      { id: '1', name: '小鱼干', price: 5, emoji: '🐟', category: 'food' },
      { id: '2', name: '牛排', price: 20, emoji: '🥩', category: 'food' },
      { id: '3', name: '蛋糕', price: 30, emoji: '🍰', category: 'food' }
    ]
  },

  onLoad() {
    this.loadShopItems()
  },

  loadShopItems() {
    
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category.id })
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '购买确认',
      content: `确定花费 ${item.price} 金币购买「${item.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          this.buyItem(item)
        }
      }
    })
  },

  buyItem(item) {
    wx.showToast({
      title: '购买功能待实现',
      icon: 'none'
    })
  }
})
