Page({
  data: {
    currentIndex: 0,
    words: [
      { word: 'apple', phonetic: '/ˈæpl/', meaning: '苹果', example: 'I like apples.' },
      { word: 'banana', phonetic: '/bəˈnænə/', meaning: '香蕉', example: 'Monkeys like bananas.' },
      { word: 'cat', phonetic: '/kæt/', meaning: '猫', example: 'The cat is cute.' }
    ],
    unlocked: false
  },

  onLoad() {
    this.loadWords()
  },

  loadWords() {
    
  },

  onPrev() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 })
    }
  },

  onNext() {
    if (this.data.currentIndex < this.data.words.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 })
    }
    
    if (this.data.currentIndex === this.data.words.length - 1) {
      this.setData({ unlocked: true })
    }
  },

  onPlayAudio() {
    wx.showToast({
      title: '发音功能待实现',
      icon: 'none'
    })
  },

  onStartGame() {
    if (!this.data.unlocked) {
      wx.showToast({
        title: '请先浏览完所有单词',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/student/task-english-game/task-english-game'
    })
  }
})
