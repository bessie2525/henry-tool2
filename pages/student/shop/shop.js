const auth = require('../../../utils/auth.js')

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
    items: [],
    loading: true,
    coins: 0
  },

  onLoad() {
    this.loadShopItems()
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    const studentInfo = auth.getStudentInfo()
    if (studentInfo) {
      this.setData({ coins: typeof studentInfo.coinBalance === 'number' ? studentInfo.coinBalance : 0 })
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'coin',
        data: { action: 'balance' }
      })

      if (res.result.success) {
        const coinBalance = typeof res.result.coinBalance === 'number' ? res.result.coinBalance : (res.result.balance || 0)
        this.setData({ coins: coinBalance })
        auth.setStudentInfo({
          ...(studentInfo || {}),
          coinBalance
        })
      }
    } catch (err) {
      console.error('加载金币余额失败', err)
    }
  },

  async loadShopItems() {
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'shop',
        data: { 
          action: 'list',
          category: this.data.selectedCategory
        }
      })
      
      if (res.result.success) {
        const items = (res.result.items || []).map(item => ({
          ...item,
          discountPrice: Math.floor((item.price || 0) * 0.9)
        }))

        this.setData({ 
          items,
          loading: false
        })
      }
    } catch (err) {
      console.error('加载商店失败', err)
      this.setData({ loading: false })
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category.id })
    this.loadShopItems()
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

  async buyItem(item) {
    wx.showLoading({ title: '购买中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'shop',
        data: { 
          action: 'buy',
          itemId: item._id
        }
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        const coinBalance = typeof res.result.coinBalance === 'number' ? res.result.coinBalance : (res.result.coins || 0)
        const studentInfo = auth.getStudentInfo() || {}
        auth.setStudentInfo({
          ...studentInfo,
          coinBalance
        })
        this.setData({ coins: coinBalance })
        wx.showToast({
          title: '购买成功！',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '购买失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('购买失败', err)
      wx.showToast({
        title: '购买失败',
        icon: 'none'
      })
    }
  }
})
