const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  console.log('review云函数被调用，event:', event)
  
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'pending':
        return await getPendingReviews(event, wxContext)
      case 'approve':
        return await approveTask(event, wxContext)
      case 'reject':
        return await rejectTask(event, wxContext)
      case 'detail':
        return await getReviewDetail(event, wxContext)
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

async function getParentProfile(wxContext) {
  const { OPENID } = wxContext
  
  const userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  if (userRes.data.length === 0) {
    return null
  }
  
  const user = userRes.data[0]
  
  const parentRes = await db.collection('parents').where({
    userId: user._id
  }).get()
  
  if (parentRes.data.length === 0) {
    return null
  }
  
  return { user, parent: parentRes.data[0] }
}

async function getBoundStudentIds(parentId) {
  const bindingRes = await db.collection('bindings').where({
    parentId: parentId
  }).get()
  
  return bindingRes.data.map(b => b.studentId)
}

async function getPendingReviews(event, wxContext) {
  const { status = 'pending' } = event
  
  const parentData = await getParentProfile(wxContext)
  if (!parentData) {
    return { success: false, message: '家长账号不存在' }
  }
  
  const { parent } = parentData
  const studentIds = await getBoundStudentIds(parent._id)
  
  if (studentIds.length === 0) {
    return { success: true, reviews: [] }
  }
  
  let query = db.collection('task_submissions').where({
    studentId: _.in(studentIds)
  })
  
  if (status) {
    query = query.where({
      status: status
    })
  }
  
  const submissionsRes = await query.orderBy('submitTime', 'desc').get()
  
  const submissions = submissionsRes.data

  if (submissions.length === 0) {
    return {
      success: true,
      reviews: []
    }
  }
  
  const studentIdSet = new Set(submissions.map(s => s.studentId))
  const studentsRes = await db.collection('students').where({
    _id: _.in([...studentIdSet])
  }).get()
  
  const studentMap = {}
  studentsRes.data.forEach(s => {
    studentMap[s._id] = s
  })
  
  const userRes = await db.collection('users').where({
    _id: _.in(studentsRes.data.map(s => s.userId))
  }).get()
  
  const userMap = {}
  userRes.data.forEach(u => {
    userMap[u._id] = u
  })
  
  const reviews = submissions.map(sub => {
    const student = studentMap[sub.studentId]
    const user = student ? userMap[student.userId] : null
    
    return {
      id: sub._id,
      studentId: sub.studentId,
      studentName: user ? user.nickname : '未知',
      taskType: sub.taskType,
      taskTitle: sub.taskTitle,
      submissionContent: sub.submissionContent,
      submitTime: sub.submitTime,
      status: sub.status,
      coinReward: sub.coinReward,
      expReward: sub.expReward
    }
  })
  
  return {
    success: true,
    reviews: reviews
  }
}

async function getReviewDetail(event, wxContext) {
  const { submissionId } = event
  
  const parentData = await getParentProfile(wxContext)
  if (!parentData) {
    return { success: false, message: '家长账号不存在' }
  }
  
  const { parent } = parentData
  const studentIds = await getBoundStudentIds(parent._id)
  
  const submissionRes = await db.collection('task_submissions').doc(submissionId).get()
  
  if (!submissionRes.data) {
    return { success: false, message: '任务提交不存在' }
  }
  
  const submission = submissionRes.data
  
  if (!studentIds.includes(submission.studentId)) {
    return { success: false, message: '无权审核此任务' }
  }
  
  const studentRes = await db.collection('students').doc(submission.studentId).get()
  const student = studentRes.data
  
  const userRes = await db.collection('users').doc(student.userId).get()
  const user = userRes.data
  
  return {
    success: true,
    submission: submission,
    student: {
      id: student._id,
      name: user.nickname
    }
  }
}

async function approveTask(event, wxContext) {
  const { submissionId, comment, coinReward, expReward } = event
  const { OPENID } = wxContext
  
  const parentData = await getParentProfile(wxContext)
  if (!parentData) {
    return { success: false, message: '家长账号不存在' }
  }
  
  const { parent, user } = parentData
  const studentIds = await getBoundStudentIds(parent._id)
  
  const submissionRes = await db.collection('task_submissions').doc(submissionId).get()
  
  if (!submissionRes.data) {
    return { success: false, message: '任务提交不存在' }
  }
  
  const submission = submissionRes.data
  
  if (!studentIds.includes(submission.studentId)) {
    return { success: false, message: '无权审核此任务' }
  }
  
  if (submission.status !== 'pending') {
    return { success: false, message: '任务已审核过' }
  }
  
  await db.collection('task_submissions').doc(submissionId).update({
    data: {
      status: 'approved',
      reviewTime: new Date(),
      reviewedBy: parent._id,
      reviewComment: comment || '',
      coinReward: coinReward || 0,
      expReward: expReward || 0
    }
  })
  
  if (coinReward > 0) {
    await db.collection('students').doc(submission.studentId).update({
      data: {
        coinBalance: _.inc(coinReward),
        totalCoinsEarned: _.inc(coinReward)
      }
    })
    
    await db.collection('coin_transactions').add({
      data: {
        studentId: submission.studentId,
        type: 'task_reward',
        amount: coinReward,
        description: `任务奖励：${submission.taskTitle}`,
        relatedId: submissionId,
        createdAt: new Date()
      }
    })
  }
  
  return {
    success: true,
    message: '审核通过'
  }
}

async function rejectTask(event, wxContext) {
  const { submissionId, comment } = event
  const { OPENID } = wxContext
  
  const parentData = await getParentProfile(wxContext)
  if (!parentData) {
    return { success: false, message: '家长账号不存在' }
  }
  
  const { parent } = parentData
  const studentIds = await getBoundStudentIds(parent._id)
  
  const submissionRes = await db.collection('task_submissions').doc(submissionId).get()
  
  if (!submissionRes.data) {
    return { success: false, message: '任务提交不存在' }
  }
  
  const submission = submissionRes.data
  
  if (!studentIds.includes(submission.studentId)) {
    return { success: false, message: '无权审核此任务' }
  }
  
  if (submission.status !== 'pending') {
    return { success: false, message: '任务已审核过' }
  }
  
  await db.collection('task_submissions').doc(submissionId).update({
    data: {
      status: 'rejected',
      reviewTime: new Date(),
      reviewedBy: parent._id,
      reviewComment: comment || ''
    }
  })
  
  return {
    success: true,
    message: '已驳回'
  }
}
