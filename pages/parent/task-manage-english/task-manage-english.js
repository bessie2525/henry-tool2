const { callCloudFunction } = require('../../../utils/api')

Page({
  data: {
    wordList: [],
    loading: false,
    newWord: '',
    newMeaning: ''
  },

  onLoad() {
    this.loadWords()
  },

  async loadWords() {
    try {
      this.setData({ loading: true })
      const res = await callCloudFunction('task', {
        action: 'english_words',
        role: 'parent'
      })

      this.setData({ wordList: res.words || [] })
    } catch (err) {
      console.error('加载单词失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onWordInput(e) {
    this.setData({ newWord: e.detail.value })
  },

  onMeaningInput(e) {
    this.setData({ newMeaning: e.detail.value })
  },

  async onAddWord() {
    const { newWord, newMeaning } = this.data
    
    if (!newWord.trim() || !newMeaning.trim()) {
      wx.showToast({
        title: '请输入完整信息',
        icon: 'none'
      })
      return
    }

    try {
      await callCloudFunction('task', {
        action: 'english_add',
        word: newWord.trim(),
        meaning: newMeaning.trim()
      })

      this.setData({
        newWord: '',
        newMeaning: ''
      })
      await this.loadWords()
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('添加单词失败', err)
    }
  },

  onDeleteWord(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个单词吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteWord(id)
        }
      }
    })
  },

  async deleteWord(id) {
    try {
      await callCloudFunction('task', {
        action: 'english_delete',
        wordId: id
      })
      await this.loadWords()

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('删除单词失败', err)
    }
  }
})
