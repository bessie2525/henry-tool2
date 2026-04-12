Page({
  data: {
    reportType: 'daily',
    reportTypes: [
      { id: 'daily', name: '每日' },
      { id: 'weekly', name: '每周' },
      { id: 'monthly', name: '每月' }
    ]
  },

  onLoad() {
    this.loadReport()
  },

  loadReport() {
    
  },

  onTypeChange(e) {
    const type = e.detail.value
    this.setData({ reportType: type })
  }
})
