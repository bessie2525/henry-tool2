const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('task云函数被调用，event:', event)
  
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'today':
        return await getTodayTasks(wxContext)
      case 'history':
        return await getTaskHistory(event, wxContext)
      case 'submit':
        return await submitTask(event, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('task云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function getStudentProfile(wxContext) {
  const { OPENID } = wxContext
  
  const userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  if (userRes.data.length === 0) {
    return null
  }
  
  const user = userRes.data[0]
  
  const studentRes = await db.collection('students').where({
    userId: user._id
  }).get()
  
  if (studentRes.data.length === 0) {
    return null
  }
  
  return { user, student: studentRes.data[0] }
}

async function getTodayTasks(wxContext) {
  const studentData = await getStudentProfile(wxContext)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const defaultTasks = [
    { id: 'chinese-1', type: 'chinese', title: '语文每日一记', description: '写一篇30字以上的日记', coinReward: 10, expReward: 5 },
    { id: 'english-1', type: 'english', title: '英语单词学习', description: '学习5个新单词', coinReward: 8, expReward: 4 },
    { id: 'daily-1', type: 'daily', title: '运动打卡', description: '运动30分钟', coinReward: 12, expReward: 6 },
    { id: 'daily-2', type: 'daily', title: '阅读打卡', description: '阅读15分钟', coinReward: 10, expReward: 5 }
  ]
  
  return {
    success: true,
    tasks: defaultTasks
  }
}

async function getTaskHistory(event, wxContext) {
  const { page = 1, pageSize = 20 } = event
  
  const studentData = await getStudentProfile(wxContext)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const { student } = studentData
  
  const submissionsRes = await db.collection('task_submissions').where({
    studentId: student._id
  })
  .orderBy('submitTime', 'desc')
  .skip((page - 1) * pageSize)
  .limit(pageSize)
  .get()
  
  return {
    success: true,
    history: submissionsRes.data
  }
}

async function submitTask(event, wxContext) {
  const { taskType, taskTitle, submissionContent } = event
  
  const studentData = await getStudentProfile(wxContext)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const { student } = studentData
  
  const submissionData = {
    studentId: student._id,
    taskId: null,
    taskType: taskType,
    taskTitle: taskTitle,
    submissionContent: submissionContent,
    submitTime: new Date(),
    status: 'pending',
    reviewTime: null,
    reviewedBy: null,
    reviewComment: '',
    coinReward: 0,
    expReward: 0,
    createdAt: new Date()
  }
  
  const addRes = await db.collection('task_submissions').add({
    data: submissionData
  })
  
  return {
    success: true,
    message: '提交成功，等待家长审核',
    submissionId: addRes._id
  }
}
