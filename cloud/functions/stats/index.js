const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

async function getParentByOpenId(openId) {
  const userRes = await db.collection('users').where({ openId }).get()
  if (userRes.data.length === 0) return null
  
  const user = userRes.data[0]
  const parentRes = await db.collection('parents').where({ userId: user._id }).get()
  if (parentRes.data.length === 0) return null
  
  return { user, parent: parentRes.data[0] }
}

async function getStudentById(studentId) {
  const studentRes = await db.collection('students').doc(studentId).get()
  if (!studentRes.data) return null
  return studentRes.data
}

async function getStudentPet(studentId) {
  const petRes = await db.collection('pets').where({ studentId }).get()
  if (petRes.data.length === 0) return null
  return petRes.data[0]
}

async function resolveAuthorizedStudent(wxContext, requestedStudentId) {
  const { OPENID } = wxContext

  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }

  const parentData = await getParentByOpenId(OPENID)
  if (!parentData) {
    return { success: false, message: '家长账号不存在' }
  }

  const bindingsRes = await db.collection('bindings')
    .where({ parentId: parentData.parent._id })
    .get()

  if (bindingsRes.data.length === 0) {
    return { success: false, message: '请先绑定孩子' }
  }

  const boundStudentIds = bindingsRes.data.map(item => item.studentId)
  const targetStudentId = requestedStudentId || boundStudentIds[0]

  if (!boundStudentIds.includes(targetStudentId)) {
    return { success: false, message: '无权查看该孩子的数据' }
  }

  return {
    success: true,
    parentData,
    studentId: targetStudentId,
    boundStudentIds
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'dashboard':
        return await getDashboardStats(event, wxContext)
      case 'weekly':
        return await getWeeklyStats(event, wxContext)
      case 'daily':
        return await getDailyStats(event, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('stats云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function getDashboardStats(event, wxContext) {
  const { studentId } = event
  
  const authResult = await resolveAuthorizedStudent(wxContext, studentId)
  if (!authResult.success) return authResult
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const targetStudentId = authResult.studentId
  
  let pendingCount = 0
  let todayProgress = 0
  let todayTotal = 4
  let studentInfo = null
  let petInfo = null
  
  if (targetStudentId) {
    const pendingRes = await db.collection('task_submissions')
      .where({
        studentId: targetStudentId,
        status: 'pending'
      })
      .get()
    pendingCount = pendingRes.data.length
    
    const todaySubmissionsRes = await db.collection('task_submissions')
      .where({
        studentId: targetStudentId,
        submitTime: _.gte(today).and(_.lt(tomorrow))
      })
      .get()
    todayProgress = todaySubmissionsRes.data.length
    
    studentInfo = await getStudentById(targetStudentId)
    if (studentInfo) {
      petInfo = await getStudentPet(targetStudentId)
    }
  }
  
  return {
    success: true,
    studentId: targetStudentId,
    pendingCount,
    todayProgress,
    todayTotal,
    studentName: studentInfo?.nickname || '我的孩子',
    petName: petInfo?.name || '宠物',
    petLevel: petInfo?.level || 1,
    petCoins: studentInfo ? (typeof studentInfo.coinBalance === 'number' ? studentInfo.coinBalance : (studentInfo.coins || 0)) : 0,
    weeklyData: {
      chineseDays: 0,
      englishAccuracy: 0,
      checkinRate: 0
    }
  }
}

async function getWeeklyStats(event, wxContext) {
  const { studentId } = event
  
  const authResult = await resolveAuthorizedStudent(wxContext, studentId)
  if (!authResult.success) return authResult
  
  return {
    success: true,
    studentId: authResult.studentId,
    weeklyData: {
      chineseDays: 0,
      englishAccuracy: 0,
      checkinRate: 0
    }
  }
}

async function getDailyStats(event, wxContext) {
  const { studentId } = event
  
  const authResult = await resolveAuthorizedStudent(wxContext, studentId)
  if (!authResult.success) return authResult
  
  return {
    success: true,
    studentId: authResult.studentId,
    dailyData: []
  }
}
