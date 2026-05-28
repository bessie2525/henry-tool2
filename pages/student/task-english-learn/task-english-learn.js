Page({
  data: {
    currentIndex: 0,
    words: [],
    currentWord: null,
    progressPercent: 0,
    unlocked: false,
    loading: false,
    taskId: 'english-1',
    taskTitle: '英语单词学习'
  },

  onLoad(options = {}) {
    this.setData({
      taskId: options.taskId || 'english-1',
      taskTitle: options.taskTitle || '英语单词学习'
    })
    this.loadWords()
  },

  async loadWords() {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: { action: 'english_words' }
      })

      if (res.result.success) {
        const words = res.result.words || []
        this.setData({
          words,
          currentIndex: 0,
          unlocked: words.length <= 1,
          loading: false
        })
        this.updateCurrentWord()
      }
    } catch (err) {
      console.error('加载英语单词失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  updateCurrentWord() {
    const { words, currentIndex } = this.data
    const currentWord = words[currentIndex] || null
    const progressPercent = words.length > 0 ? Math.round(((currentIndex + 1) / words.length) * 100) : 0

    this.setData({
      currentWord,
      progressPercent
    })
  },

  onPrev() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 })
      this.updateCurrentWord()
    }
  },

  onNext() {
    if (this.data.currentIndex < this.data.words.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 })
      this.updateCurrentWord()
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
    if (this.data.words.length === 0) {
      wx.showToast({
        title: '暂无单词',
        icon: 'none'
      })
      return
    }

    if (!this.data.unlocked) {
      wx.showToast({
        title: '请先浏览完所有单词',
        icon: 'none'
      })
      return
    }
    
    this.submitTask()
  },

  async submitTask() {
    wx.showLoading({ title: '提交中...' })
    this.setData({ loading: true })
    
    try {
      const words = this.data.words.map(item => ({
        word: item.word,
        meaning: item.meaning
      }))
      
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'submit',
          taskId: this.data.taskId,
          taskType: 'english',
          taskTitle: this.data.taskTitle,
          coinReward: 8,
          expReward: 4,
          submissionContent: {
            words,
            wordsLearned: this.data.words.length,
            wordList: words.map(item => item.word),
            completedAt: new Date().toISOString()
          }
        }
      })
      
      wx.hideLoading()
      this.setData({ loading: false })
      
      if (res.result.success) {
        wx.showToast({
          title: '提交成功！',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '提交失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ loading: false })
      console.error('提交失败', err)
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    }
  }
})
