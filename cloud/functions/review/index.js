const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const REWARD_RULES = {
  chinese: { coinReward: 10, expReward: 30 },
  english: { coinReward: 10, expReward: 30 },
  daily: { coinReward: 5, expReward: 15 },
  allTaskBonus: { coinReward: 10 }
}

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

function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

function getNextExpToLevel(level) {
  return 100 + (level - 1) * 20
}

async function getTrustedReward(submission) {
  if (submission.taskType === 'daily' && submission.taskId) {
    try {
      const taskRes = await db.collection('task_daily_templates').doc(submission.taskId).get()
      if (taskRes.data && taskRes.data.studentId === submission.studentId && taskRes.data.isActive !== false) {
        return {
          coinReward: Number(taskRes.data.coinReward) || REWARD_RULES.daily.coinReward,
          expReward: Number(taskRes.data.expReward) || REWARD_RULES.daily.expReward
        }
      }
    } catch (error) {
      console.warn('读取日常任务奖励失败，使用默认奖励:', submission.taskId, error.message)
    }
  }

  return REWARD_RULES[submission.taskType] || { coinReward: 0, expReward: 0 }
}

async function addPetExp(studentId, expReward) {
  if (expReward <= 0) return null

  const petRes = await db.collection('pets').where({ studentId }).limit(1).get()
  if (petRes.data.length === 0) return null

  const pet = petRes.data[0]
  let level = pet.level || 1
  let exp = (pet.exp || 0) + expReward
  let expToNextLevel = pet.expToNextLevel || getNextExpToLevel(level)

  while (exp >= expToNextLevel && level < 100) {
    exp -= expToNextLevel
    level += 1
    expToNextLevel = getNextExpToLevel(level)
  }

  const mood = Math.min(100, (pet.mood || 0) + 20)

  await db.collection('pets').doc(pet._id).update({
    data: {
      level,
      exp,
      expToNextLevel,
      mood,
      updatedAt: new Date()
    }
  })

  return { level, exp, expToNextLevel, mood }
}

async function getRequiredTaskIds(studentId) {
  const dailyRes = await db.collection('task_daily_templates')
    .where({
      studentId,
      isActive: true,
      enabled: _.neq(false)
    })
    .get()

  const dailyTaskIds = dailyRes.data.length > 0
    ? dailyRes.data.map(task => task._id)
    : ['daily-default-sport', 'daily-default-reading']
  return ['chinese-1', 'english-1', ...dailyTaskIds]
}

async function maybeAwardAllTaskBonus(studentId) {
  const { start, end } = getTodayRange()
  const dateKey = getDateKey(start)
  const requiredTaskIds = await getRequiredTaskIds(studentId)

  if (requiredTaskIds.length === 0) {
    return { awarded: false }
  }

  const approvedRes = await db.collection('task_submissions')
    .where({
      studentId,
      status: 'approved',
      submitTime: _.gte(start).and(_.lt(end))
    })
    .get()

  const approvedTaskIds = new Set(approvedRes.data.map(item => item.taskId || `${item.taskType}-1`))
  const allCompleted = requiredTaskIds.every(taskId => approvedTaskIds.has(taskId))
  if (!allCompleted) {
    return { awarded: false }
  }

  const existingBonusRes = await db.collection('coin_transactions')
    .where({
      studentId,
      type: 'all_task_bonus',
      dateKey
    })
    .limit(1)
    .get()

  if (existingBonusRes.data.length > 0) {
    return { awarded: false }
  }

  const bonus = REWARD_RULES.allTaskBonus.coinReward
  await db.collection('students').doc(studentId).update({
    data: {
      coinBalance: _.inc(bonus),
      totalCoinsEarned: _.inc(bonus)
    }
  })

  await db.collection('coin_transactions').add({
    data: {
      studentId,
      type: 'all_task_bonus',
      amount: bonus,
      description: '今日全部任务完成奖励',
      dateKey,
      createdAt: new Date()
    }
  })

  return { awarded: true, coinReward: bonus }
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
  const { submissionId, comment } = event
  
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
  
  const reward = await getTrustedReward(submission)
  const coinReward = reward.coinReward
  const expReward = reward.expReward
  const petGrowth = await addPetExp(submission.studentId, expReward)

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

  const allTaskBonus = await maybeAwardAllTaskBonus(submission.studentId)
  
  return {
    success: true,
    message: '审核通过',
    coinReward,
    expReward,
    petGrowth,
    allTaskBonus
  }
}

async function rejectTask(event, wxContext) {
  const { submissionId, comment } = event
  
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
