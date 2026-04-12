const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'pending':
        return await getPendingReviews(wxContext)
      case 'approve':
        return await approveTask(event, wxContext)
      case 'reject':
        return await rejectTask(event, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('review云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function getPendingReviews(wxContext) {
  return {
    success: true,
    message: '获取待审核列表功能待实现',
    reviews: []
  }
}

async function approveTask(event, wxContext) {
  return {
    success: true,
    message: '审核通过功能待实现'
  }
}

async function rejectTask(event, wxContext) {
  return {
    success: true,
    message: '审核驳回功能待实现'
  }
}
