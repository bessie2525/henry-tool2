App({
  globalData: {
    userInfo: null,
    studentInfo: null,
    parentInfo: null,
    petInfo: null,
    coinBalance: 0,
    currentRole: null,
    cloudInited: false
  },

  onLaunch() {
    console.log('学伴精灵小程序启动')
    
    this.initCloud()
  },

  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'cloud1-0glmgrn010fa125b',
      traceUser: true
    })
    
    this.globalData.cloudInited = true
    console.log('云开发初始化完成')
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  }
})

