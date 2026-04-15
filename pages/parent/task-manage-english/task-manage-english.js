Page({
  data: {
    wordList: [
      { id: 1, word: 'apple', meaning: '苹果', category: '水果' },
      { id: 2, word: 'banana', meaning: '香蕉', category: '水果' },
      { id: 3, word: 'cat', meaning: '猫', category: '动物' },
      { id: 4, word: 'dog', meaning: '狗', category: '动物' },
      { id: 5, word: 'red', meaning: '红色', category: '颜色' },
      { id: 6, word: 'blue', meaning: '蓝色', category: '颜色' }
    ],
    newWord: '',
    newMeaning: '',
    newCategory: '水果'
  },

  onLoad() {
    this.loadWords()
  },

  loadWords() {
    
  },

  onWordInput(e) {
    this.setData({ newWord: e.detail.value })
  },

  onMeaningInput(e) {
    this.setData({ newMeaning: e.detail.value })
  },

  onCategoryChange(e) {
    const categories = ['水果', '动物', '颜色', '数字', '身体']
    this.setData({ newCategory: categories[e.detail.value] })
  },

  onAddWord() {
    const { newWord, newMeaning, newCategory, wordList } = this.data
    
    if (!newWord.trim() || !newMeaning.trim()) {
      wx.showToast({
        title: '请输入完整信息',
        icon: 'none'
      })
      return
    }
    
    const newWordItem = {
      id: Date.now(),
      word: newWord.trim(),
      meaning: newMeaning.trim(),
      category: newCategory
    }
    
    this.setData({
      wordList: [...wordList, newWordItem],
      newWord: '',
      newMeaning: ''
    })
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
  },

  onDeleteWord(e) {
    const id = e.currentTarget.dataset.id
    const { wordList } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个单词吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            wordList: wordList.filter(w => w.id !== id)
          })
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  }
})
