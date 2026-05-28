function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data
    }).then(res => {
      if (res.result.success) {
        resolve(res.result)
      } else {
        wx.showToast({
          title: res.result.message || '操作失败',
          icon: 'none'
        })
        reject(res.result)
      }
    }).catch(err => {
      console.error('云函数调用失败', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      reject(err)
    })
  })
}

module.exports = {
  callFunction,
  callCloudFunction: callFunction
}
