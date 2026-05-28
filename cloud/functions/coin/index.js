const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

async function getStudentByOpenId(openId) {
  const userRes = await db.collection('users').where({ openId }).get()
  if (userRes.data.length === 0) return null

  const user = userRes.data[0]
  const studentRes = await db.collection('students').where({ userId: user._id }).get()
  if (studentRes.data.length === 0) return null

  return { user, student: studentRes.data[0] }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'balance':
        return await getBalance(wxContext)
      case 'transactions':
        return await getTransactions(event, wxContext)
      case 'settings':
        return await getCoinSettings(wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('coin云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function getBalance(wxContext) {
  const { OPENID } = wxContext

  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }

  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }

  const coinBalance = typeof studentData.student.coinBalance === 'number'
    ? studentData.student.coinBalance
    : (studentData.student.coins || 0)

  return {
    success: true,
    coinBalance,
    balance: coinBalance
  }
}

async function getTransactions(event, wxContext) {
  const { OPENID } = wxContext
  const { page = 1, pageSize = 20 } = event

  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }

  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }

  const transactionsRes = await db.collection('coin_transactions')
    .where({ studentId: studentData.student._id })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return {
    success: true,
    transactions: transactionsRes.data
  }
}

async function getCoinSettings(wxContext) {
  return {
    success: true,
    message: '获取金币规则功能待实现',
    settings: {}
  }
}
