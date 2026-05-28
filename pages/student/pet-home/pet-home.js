const auth = require('../../../utils/auth.js')
const constants = require('../../../utils/constants.js')

Page({
  data: {
    pet: null,
    hasPet: false,
    loading: true,
    petState: 'idle',
    touchCount: 5,
    inventory: [],
    foodItems: [],
    drinkItems: [],
    foodCount: 0,
    drinkCount: 0,
    hasInventory: false
  },

  onLoad() {
    this.loadPetInfo()
    this.loadInventory()
  },

  onShow() {
    if (this.data.hasPet) {
      this.loadPetInfo()
    }
    this.loadInventory()
  },

  async loadPetInfo() {
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'pet',
        data: { action: 'info' }
      })
      
      if (res.result.success) {
        this.setData({
          pet: this.formatPet(res.result.pet),
          hasPet: res.result.hasPet,
          loading: false
        })
      }
    } catch (err) {
      console.error('加载宠物信息失败', err)
      this.setData({ loading: false })
    }
  },

  async loadInventory() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'shop',
        data: { action: 'inventory' }
      })

      if (res.result.success) {
        this.setData(this.formatInventory(res.result.items || []))
      }
    } catch (err) {
      console.error('加载背包失败', err)
    }
  },

  formatInventory(items) {
    const validItems = items.filter(item => item.quantity > 0)
    const foodItems = validItems.filter(item => item.itemCategory === 'food')
    const drinkItems = validItems.filter(item => item.itemCategory === 'drink')
    const foodCount = foodItems.reduce((total, item) => total + item.quantity, 0)
    const drinkCount = drinkItems.reduce((total, item) => total + item.quantity, 0)

    return {
      inventory: validItems,
      foodItems,
      drinkItems,
      foodCount,
      drinkCount,
      hasInventory: validItems.length > 0
    }
  },

  findUsableItem(category) {
    return this.data.inventory.find(item => item.itemCategory === category && item.quantity > 0)
  },

  getCareItemFromEvent(e, category) {
    const item = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item
    if (item && item.itemCategory === category && item.quantity > 0) {
      return item
    }

    return this.findUsableItem(category)
  },

  formatPet(pet) {
    if (!pet) return null

    const currentHunger = typeof pet.currentHunger === 'number' ? pet.currentHunger : (pet.hunger || 0)
    const currentThirst = typeof pet.currentThirst === 'number' ? pet.currentThirst : (pet.thirst || 0)
    const currentMood = typeof pet.currentMood === 'number' ? pet.currentMood : (pet.mood || 0)
    const hunger = Math.round(Math.min(100, currentHunger))
    const thirst = Math.round(Math.min(100, currentThirst))
    const mood = Math.round(Math.min(100, currentMood))

    return {
      ...pet,
      hungerPercent: hunger,
      thirstPercent: thirst,
      moodPercent: mood
    }
  },

  onPetTap() {
    this.triggerPetAnimation('happy')
  },

  triggerPetAnimation(state) {
    this.setData({ petState: state })
    
    setTimeout(() => {
      this.setData({ petState: 'idle' })
    }, 2000)
  },

  async onFeed(e) {
    const food = this.getCareItemFromEvent(e, 'food')
    if (!food) {
      wx.showToast({
        title: '没有食物，请先去商店购买',
        icon: 'none'
      })
      return
    }

    await this.useInventoryItem('feed', food, '喂食中...')
  },

  async onWater(e) {
    const drink = this.getCareItemFromEvent(e, 'drink')
    if (!drink) {
      wx.showToast({
        title: '没有饮品，请先去商店购买',
        icon: 'none'
      })
      return
    }
    
    await this.useInventoryItem('water', drink, '喂水中...')
  },

  async useInventoryItem(action, item, loadingTitle) {
    wx.showLoading({ title: loadingTitle })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'pet',
        data: { 
          action,
          itemId: item.itemId
        }
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        this.setData({ pet: this.formatPet(res.result.pet) })
        await this.loadInventory()
        this.triggerPetAnimation(action === 'water' ? 'drinking' : 'eating')
        wx.showToast({
          title: res.result.message || '互动成功！',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '互动失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('宠物互动失败', err)
      wx.showToast({
        title: '互动失败',
        icon: 'none'
      })
    }
  },

  async onTouch() {
    if (this.data.touchCount <= 0) {
      wx.showToast({
        title: '今日抚摸次数已用完',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '抚摸中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'pet',
        data: { 
          action: 'touch',
          moodValue: 10
        }
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        this.setData({ 
          pet: this.formatPet(res.result.pet),
          touchCount: this.data.touchCount - 1
        })
        this.triggerPetAnimation('happy')
        wx.showToast({
          title: '心情 +10',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '抚摸失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('抚摸失败', err)
      wx.showToast({
        title: '抚摸失败',
        icon: 'none'
      })
    }
  },

  onChat() {
    wx.navigateTo({
      url: '/pages/student/chat/chat'
    })
  },

  onDressUp() {
    wx.navigateTo({
      url: '/pages/student/dress-up/dress-up'
    })
  },

  goCreate() {
    wx.redirectTo({
      url: '/pages/pet-create/pet-create'
    })
  }
})
