const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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
      case 'daily_list':
        return await listDailyTasks(event, wxContext)
      case 'daily_add':
        return await addDailyTask(event, wxContext)
      case 'daily_update':
        return await updateDailyTask(event, wxContext)
      case 'daily_delete':
        return await deleteDailyTask(event, wxContext)
      case 'english_words':
        return await listEnglishWords(event, wxContext)
      case 'english_add':
        return await addEnglishWord(event, wxContext)
      case 'english_delete':
        return await deleteEnglishWord(event, wxContext)
      case 'chinese_theme_get':
        return await getChineseTheme(event, wxContext)
      case 'chinese_theme_set':
        return await setChineseTheme(event, wxContext)
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

async function getManagedStudentId(wxContext, requestedStudentId) {
  const parentData = await getParentProfile(wxContext)
  if (!parentData) {
    return { success: false, message: '家长账号不存在' }
  }

  const bindingRes = await db.collection('bindings').where({
    parentId: parentData.parent._id
  }).get()

  if (bindingRes.data.length === 0) {
    return { success: false, message: '请先绑定孩子' }
  }

  const studentIds = bindingRes.data.map(item => item.studentId)
  const studentId = requestedStudentId || studentIds[0]

  if (!studentIds.includes(studentId)) {
    return { success: false, message: '无权管理该孩子的任务' }
  }

  return {
    success: true,
    parent: parentData.parent,
    studentId
  }
}

function getDefaultDailyTasks(studentId) {
  const now = new Date()

  return [
    {
      id: 'daily-default-sport',
      studentId,
      title: '运动打卡',
      description: '运动30分钟',
      enabled: true,
      isActive: true,
      requirePhoto: false,
      coinReward: 12,
      expReward: 6,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'daily-default-reading',
      studentId,
      title: '阅读打卡',
      description: '阅读15分钟',
      enabled: true,
      isActive: true,
      requirePhoto: false,
      coinReward: 10,
      expReward: 5,
      createdAt: now,
      updatedAt: now
    }
  ]
}

function getDefaultEnglishWords(studentId) {
  const now = new Date()

  return [
    { id: 'english-default-apple', studentId, word: 'apple', meaning: '苹果', phonetic: '/ˈæpl/', example: 'I like apples.', isActive: true, createdAt: now, updatedAt: now },
    { id: 'english-default-banana', studentId, word: 'banana', meaning: '香蕉', phonetic: '/bəˈnænə/', example: 'Monkeys like bananas.', isActive: true, createdAt: now, updatedAt: now },
    { id: 'english-default-cat', studentId, word: 'cat', meaning: '猫', phonetic: '/kæt/', example: 'The cat is cute.', isActive: true, createdAt: now, updatedAt: now }
  ]
}

async function getActiveDailyTasks(studentId) {
  const dailyRes = await db.collection('task_daily_templates')
    .where({
      studentId,
      isActive: true
    })
    .get()

  const tasks = dailyRes.data.length > 0 ? dailyRes.data : getDefaultDailyTasks(studentId)
  return tasks.filter(item => item.enabled !== false)
}

async function getActiveEnglishWords(studentId) {
  const wordsRes = await db.collection('task_english_wordlists')
    .where({
      studentId,
      isActive: true
    })
    .get()

  return wordsRes.data.length > 0 ? wordsRes.data : getDefaultEnglishWords(studentId)
}

function normalizeTaskId(task) {
  return task._id || task.id
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function getChineseThemeByStudent(studentId) {
  const themeRes = await db.collection('task_chinese_topics')
    .where({
      studentId,
      isActive: true
    })
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get()

  return themeRes.data[0] || null
}

async function getTrustedSubmissionReward(studentId, taskType, taskId) {
  if (taskType === 'chinese') {
    return { coinReward: 10, expReward: 30 }
  }

  if (taskType === 'english') {
    return { coinReward: 10, expReward: 30 }
  }

  if (taskType === 'daily') {
    if (taskId) {
      try {
        const taskRes = await db.collection('task_daily_templates').doc(taskId).get()
        if (taskRes.data && taskRes.data.studentId === studentId && taskRes.data.isActive !== false) {
          return {
            coinReward: Number(taskRes.data.coinReward) || 5,
            expReward: Number(taskRes.data.expReward) || 15
          }
        }
      } catch (error) {
        console.warn('读取日常任务奖励失败，使用默认奖励:', taskId, error.message)
      }
    }

    return { coinReward: 5, expReward: 15 }
  }

  return { coinReward: 0, expReward: 0 }
}

async function getTodayTasks(wxContext) {
  const studentData = await getStudentProfile(wxContext)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }

  const { student } = studentData
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [dailyTasks, englishWords, chineseTheme, submissionsRes] = await Promise.all([
    getActiveDailyTasks(student._id),
    getActiveEnglishWords(student._id),
    getChineseThemeByStudent(student._id),
    db.collection('task_submissions').where({
      studentId: student._id,
      submitTime: _.gte(today).and(_.lt(tomorrow))
    }).get()
  ])

  const submissionStatusMap = {}
  submissionsRes.data.forEach(item => {
    submissionStatusMap[item.taskId || `${item.taskType}-1`] = item.status
  })
  
  const tasks = [
    {
      id: 'chinese-1',
      type: 'chinese',
      title: '语文每日一记',
      description: chineseTheme ? `今日主题：${chineseTheme.theme}` : '写一篇30字以上的日记',
      theme: chineseTheme ? chineseTheme.theme : '',
      coinReward: 10,
      expReward: 30
    },
    {
      id: 'english-1',
      type: 'english',
      title: '英语单词学习',
      description: `学习${englishWords.length}个单词`,
      coinReward: 10,
      expReward: 30
    },
    ...dailyTasks.map(task => ({
      id: normalizeTaskId(task),
      type: 'daily',
      title: task.title,
      description: task.description,
      requirePhoto: !!task.requirePhoto,
      coinReward: task.coinReward || 0,
      expReward: task.expReward || 0
    }))
  ]
  
  return {
    success: true,
    tasks: tasks.map(task => ({
      ...task,
      status: submissionStatusMap[task.id] || 'pending'
    }))
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
  const { taskId, taskType, taskTitle, submissionContent } = event
  
  const studentData = await getStudentProfile(wxContext)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const { student } = studentData
  const reward = await getTrustedSubmissionReward(student._id, taskType, taskId)
  
  const submissionData = {
    studentId: student._id,
    taskId: taskId || null,
    taskType: taskType,
    taskTitle: taskTitle,
    submissionContent: normalizeSubmissionContent(taskType, taskTitle, submissionContent),
    submitTime: new Date(),
    status: 'pending',
    reviewTime: null,
    reviewedBy: null,
    reviewComment: '',
    coinReward: reward.coinReward,
    expReward: reward.expReward,
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

function normalizeSubmissionContent(taskType, taskTitle, content = {}) {
  if (taskType === 'daily') {
    return {
      type: 'daily_checkin',
      title: taskTitle,
      description: content.description || content.summary || '',
      taskId: content.taskId || null,
      completedAt: content.completedAt || new Date().toISOString(),
      proofType: content.photo ? 'photo' : 'self_confirm',
      photo: content.photo || ''
    }
  }

  if (taskType === 'english') {
    const words = Array.isArray(content.words) ? content.words : []
    const wordList = Array.isArray(content.wordList)
      ? content.wordList
      : (typeof content.wordList === 'string' ? content.wordList.split(',').map(item => item.trim()).filter(Boolean) : [])

    return {
      type: 'english_learning',
      title: taskTitle,
      words,
      wordList: wordList.length > 0 ? wordList : words.map(item => item.word),
      wordsLearned: Number(content.wordsLearned) || words.length,
      completedAt: content.completedAt || new Date().toISOString()
    }
  }

  if (taskType === 'chinese') {
    return {
      type: 'chinese_diary',
      title: taskTitle,
      theme: content.theme || '',
      content: content.content || content.diaryText || '',
      completedAt: content.completedAt || new Date().toISOString()
    }
  }

  return content
}

async function listDailyTasks(event, wxContext) {
  const { studentId } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  let dailyRes = await db.collection('task_daily_templates')
    .where({
      studentId: manager.studentId,
      isActive: _.neq(false)
    })
    .get()

  if (dailyRes.data.length === 0) {
    const defaultTasks = getDefaultDailyTasks(manager.studentId)
    for (const task of defaultTasks) {
      const { id, ...data } = task
      await db.collection('task_daily_templates').add({
        data: {
          ...data,
          createdBy: manager.parent._id
        }
      })
    }

    dailyRes = await db.collection('task_daily_templates')
      .where({
        studentId: manager.studentId,
        isActive: _.neq(false)
      })
      .get()
  }

  const tasks = dailyRes.data

  return {
    success: true,
    tasks: tasks.map(task => ({
      id: normalizeTaskId(task),
      title: task.title,
      description: task.description,
      enabled: task.enabled !== false,
      requirePhoto: !!task.requirePhoto,
      coinReward: task.coinReward || 0,
      expReward: task.expReward || 0
    }))
  }
}

async function addDailyTask(event, wxContext) {
  const { studentId, title, description, coinReward = 0, expReward = 0, requirePhoto = false } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  if (!title || !description) {
    return { success: false, message: '请输入完整任务信息' }
  }

  const addRes = await db.collection('task_daily_templates').add({
    data: {
      studentId: manager.studentId,
      title,
      description,
      enabled: true,
      isActive: true,
      requirePhoto: !!requirePhoto,
      coinReward: Number(coinReward) || 0,
      expReward: Number(expReward) || 0,
      createdBy: manager.parent._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    id: addRes._id,
    message: '添加成功'
  }
}

async function updateDailyTask(event, wxContext) {
  const { studentId, taskId, enabled, title, description, coinReward, expReward, requirePhoto } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  const taskRes = await db.collection('task_daily_templates').doc(taskId).get()
  if (!taskRes.data || taskRes.data.studentId !== manager.studentId) {
    return { success: false, message: '任务不存在或无权修改' }
  }

  const data = { updatedAt: new Date() }
  if (typeof enabled === 'boolean') data.enabled = enabled
  if (typeof title === 'string') data.title = title
  if (typeof description === 'string') data.description = description
  if (coinReward !== undefined) data.coinReward = Number(coinReward) || 0
  if (expReward !== undefined) data.expReward = Number(expReward) || 0
  if (requirePhoto !== undefined) data.requirePhoto = !!requirePhoto

  await db.collection('task_daily_templates').doc(taskId).update({ data })

  return {
    success: true,
    message: '设置成功'
  }
}

async function deleteDailyTask(event, wxContext) {
  const { studentId, taskId } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  const taskRes = await db.collection('task_daily_templates').doc(taskId).get()
  if (!taskRes.data || taskRes.data.studentId !== manager.studentId) {
    return { success: false, message: '任务不存在或无权删除' }
  }

  await db.collection('task_daily_templates').doc(taskId).update({
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '删除成功'
  }
}

async function listEnglishWords(event, wxContext) {
  const { role } = event
  const studentData = role === 'parent' ? null : await getStudentProfile(wxContext)

  if (studentData) {
    const words = await getActiveEnglishWords(studentData.student._id)
    return {
      success: true,
      words: words.map(formatWord)
    }
  }

  const { studentId } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  let wordsRes = await db.collection('task_english_wordlists')
    .where({
      studentId: manager.studentId,
      isActive: true
    })
    .get()

  if (wordsRes.data.length === 0) {
    const defaultWords = getDefaultEnglishWords(manager.studentId)
    for (const item of defaultWords) {
      const { id, ...data } = item
      await db.collection('task_english_wordlists').add({
        data: {
          ...data,
          createdBy: manager.parent._id
        }
      })
    }

    wordsRes = await db.collection('task_english_wordlists')
      .where({
        studentId: manager.studentId,
        isActive: true
      })
      .get()
  }

  const words = wordsRes.data
  return {
    success: true,
    words: words.map(formatWord)
  }
}

function formatWord(item) {
  return {
    id: normalizeTaskId(item),
    word: item.word,
    meaning: item.meaning,
    phonetic: item.phonetic || '',
    example: item.example || ''
  }
}

async function addEnglishWord(event, wxContext) {
  const { studentId, word, meaning, phonetic = '', example = '' } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  if (!word || !meaning) {
    return { success: false, message: '请输入单词和中文意思' }
  }

  const addRes = await db.collection('task_english_wordlists').add({
    data: {
      studentId: manager.studentId,
      word,
      meaning,
      phonetic,
      example,
      isActive: true,
      createdBy: manager.parent._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    id: addRes._id,
    message: '添加成功'
  }
}

async function deleteEnglishWord(event, wxContext) {
  const { studentId, wordId } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  const wordRes = await db.collection('task_english_wordlists').doc(wordId).get()
  if (!wordRes.data || wordRes.data.studentId !== manager.studentId) {
    return { success: false, message: '单词不存在或无权删除' }
  }

  await db.collection('task_english_wordlists').doc(wordId).update({
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '删除成功'
  }
}

async function getChineseTheme(event, wxContext) {
  const { role } = event
  const studentData = role === 'parent' ? null : await getStudentProfile(wxContext)
  if (studentData) {
    const theme = await getChineseThemeByStudent(studentData.student._id)
    return {
      success: true,
      theme: theme ? theme.theme : '',
      dateKey: theme ? theme.dateKey : getDateKey()
    }
  }

  const { studentId } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  const theme = await getChineseThemeByStudent(manager.studentId)
  return {
    success: true,
    theme: theme ? theme.theme : '',
    dateKey: theme ? theme.dateKey : getDateKey()
  }
}

async function setChineseTheme(event, wxContext) {
  const { studentId, theme } = event
  const manager = await getManagedStudentId(wxContext, studentId)
  if (!manager.success) return manager

  const normalizedTheme = (theme || '').trim()
  if (!normalizedTheme) {
    return { success: false, message: '请输入主题' }
  }

  const existingRes = await db.collection('task_chinese_topics')
    .where({
      studentId: manager.studentId,
      isActive: true
    })
    .limit(1)
    .get()

  if (existingRes.data.length > 0) {
    await db.collection('task_chinese_topics').doc(existingRes.data[0]._id).update({
      data: {
        theme: normalizedTheme,
        dateKey: getDateKey(),
        updatedBy: manager.parent._id,
        updatedAt: new Date()
      }
    })
  } else {
    await db.collection('task_chinese_topics').add({
      data: {
        studentId: manager.studentId,
        theme: normalizedTheme,
        dateKey: getDateKey(),
        isActive: true,
        createdBy: manager.parent._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  return {
    success: true,
    theme: normalizedTheme,
    message: '设置成功'
  }
}
