const auth = require('../../utils/auth.js')
const constants = require('../../utils/constants.js')

Page({
  data: {
    step: 1,
    speciesList: constants.pet.species,
    selectedSpecies: null,
    petName: '',
    selectedColor: '#FFA500',
    colors: [
      '#FFA500',
      '#8B4513',
      '#50E3C2',
      '#FF69B4',
      '#9B59B6',
      '#3498DB'
    ],
    loading: false
  },

  onLoad() {
    console.log('宠物创建页面加载')
  },

  onSelectSpecies(e) {
    const species = e.currentTarget.dataset.species
    this.setData({ 
      selectedSpecies: species,
      selectedColor: species.defaultColor
    })
  },

  onPetNameInput(e) {
    this.setData({ petName: e.detail.value })
  },

  onSelectColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({ selectedColor: color })
  },

  goNext() {
    if (this.data.step === 1) {
      if (!this.data.selectedSpecies) {
        wx.showToast({
          title: '请选择宠物',
          icon: 'none'
        })
        return
      }
      this.setData({ step: 2 })
    } else if (this.data.step === 2) {
      const name = this.data.petName.trim()
      if (!name) {
        wx.showToast({
          title: '请给宠物起名字',
          icon: 'none'
        })
        return
      }
      if (name.length < 2 || name.length > 6) {
        wx.showToast({
          title: '名字2-6个字符',
          icon: 'none'
        })
        return
      }
      this.setData({ step: 3 })
    }
  },

  goPrev() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 })
    }
  },

  onSubmit() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    wx.showLoading({ title: '创建中...' })
    
    wx.cloud.callFunction({
      name: 'pet',
      data: {
        action: 'create',
        name: this.data.petName.trim(),
        species: this.data.selectedSpecies.id,
        color: this.data.selectedColor
      }
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: '创建成功！',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/student/pet-home/pet-home'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '创建失败',
          icon: 'none'
        })
      }
      
      this.setData({ loading: false })
    }).catch(err => {
      wx.hideLoading()
      console.error('创建宠物失败', err)
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  }
})
