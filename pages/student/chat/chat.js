Page({
  data: {
    messages: [],
    inputText: '',
    remaining: 20
  },

  onLoad() {
    this.loadMessages()
  },

  loadMessages() {
    
  },

  onInputText(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    const text = this.data.inputText.trim()
    
    if (!text) return
    
    if (this.data.remaining <= 0) {
      wx.showToast({
        title: '今日对话次数已用完',
        icon: 'none'
      })
      return
    }
    
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    
    this.setData({
      messages: [...this.data.messages, newMessage],
      inputText: '',
      remaining: this.data.remaining - 1
    })
    
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1,
        type: 'pet',
        content: '你好呀主人！今天有没有认真学习呀~',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      
      this.setData({
        messages: [...this.data.messages, replyMessage]
      })
    }, 1000)
  }
})
