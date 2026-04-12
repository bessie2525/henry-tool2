const auth = require('../../../utils/auth.js')
const constants = require('../../../utils/constants.js')

Page({
  data: {
    pet: null,
    hasPet: false,
    loading: true,
    petState: 'idle',
    freeWaterCount: 3,
    touchCount: 5
  },

  onLoad() {
    this.loadPetInfo()
  },

  onShow() {
    if (this.data.hasPet) {
      this.loadPetInfo()
    }
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
          pet: res.result.pet,
          hasPet: res.result.hasPet,
          loading: false
        })
      }
    } catch (err) {
      console.error('加载宠物信息失败', err)
      this.setData({ loading: false })
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

  onFeed() {
    wx.showToast({
      title: '喂食功能待实现',
      icon: 'none'
    })
  },

  onWater() {
    if (this.data.freeWaterCount <= 0) {
      wx.showToast({
        title: '今日免费次数已用完',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      freeWaterCount: this.data.freeWaterCount - 1
    })
    
    this.triggerPetAnimation('eating')
    
    wx.showToast({
      title: '喂水成功！',
      icon: 'success'
    })
  },

  onTouch() {
    if (this.data.touchCount <= 0) {
      wx.showToast({
        title: '今日抚摸次数已用完',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      touchCount: this.data.touchCount - 1
    })
    
    this.triggerPetAnimation('happy')
    
    wx.showToast({
      title: '心情 +5',
      icon: 'none'
    })
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
