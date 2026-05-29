const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const LOGIN_REWARD = 2
const CONSECUTIVE_BONUS = {
  7: 50,
  30: 200,
  100: 500
}

exports.main = async (event, context) => {
  console.log('auth云函数被调用，event:', event)
  
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'login':
        return await login(wxContext)
      case 'register_student':
        return await registerStudent(event, wxContext)
      case 'register_parent':
        return await registerParent(event, wxContext)
      case 'bind_child':
        return await bindChild(event, wxContext)
      case 'get_user_info':
        return await getUserInfo(wxContext)
      case 'select_role':
        return await selectRole(event, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('auth云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function login(wxContext) {
  const { OPENID } = wxContext
  console.log('login, openid:', OPENID)
  
  if (!OPENID) {
    return {
      success: true,
      registered: false,
      message: '测试模式：请在小程序中实际登录'
    }
  }
  
  const userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  if (userRes.data.length > 0) {
    const user = userRes.data[0]
    
    await db.collection('users').doc(user._id).update({
      data: { lastLoginAt: new Date() }
    })
    
    const identities = []
    
    const studentRes = await db.collection('students').where({
      userId: user._id
    }).get()
    
    if (studentRes.data.length > 0) {
      const loginReward = await awardDailyLoginReward(studentRes.data[0])
      const studentProfile = loginReward.student || studentRes.data[0]
      identities.push({
        role: 'student',
        profile: studentProfile,
        loginReward: loginReward.reward
      })
    }
    
    const parentRes = await db.collection('parents').where({
      userId: user._id
    }).get()
    
    if (parentRes.data.length > 0) {
      identities.push({
        role: 'parent',
        profile: parentRes.data[0]
      })
    }
    
    return {
      success: true,
      registered: true,
      hasMultipleRoles: identities.length > 1,
      identities: identities,
      user: user
    }
  } else {
    return {
      success: true,
      registered: false
    }
  }
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYesterdayKey() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return getDateKey(yesterday)
}

async function awardDailyLoginReward(student) {
  const todayKey = getDateKey()
  const lastLoginDate = student.lastLoginDate || null

  if (lastLoginDate === todayKey) {
    return { reward: null, student }
  }

  const yesterdayKey = getYesterdayKey()
  const nextConsecutiveDays = lastLoginDate === yesterdayKey ? (student.consecutiveDays || 0) + 1 : 1
  const nextTotalActiveDays = (student.totalActiveDays || 0) + 1
  const bonus = CONSECUTIVE_BONUS[nextConsecutiveDays] || 0
  const totalReward = LOGIN_REWARD + bonus

  await db.collection('students').doc(student._id).update({
    data: {
      coinBalance: _.inc(totalReward),
      totalCoinsEarned: _.inc(totalReward),
      consecutiveDays: nextConsecutiveDays,
      totalActiveDays: nextTotalActiveDays,
      lastLoginDate: todayKey,
      lastLoginAt: new Date()
    }
  })

  await db.collection('coin_transactions').add({
    data: {
      studentId: student._id,
      type: 'login_reward',
      amount: totalReward,
      description: bonus > 0 ? `每日登录奖励 + 连续${nextConsecutiveDays}天奖励` : '每日登录奖励',
      dateKey: todayKey,
      createdAt: new Date()
    }
  })

  const updatedStudentRes = await db.collection('students').doc(student._id).get()

  return {
    reward: {
      amount: totalReward,
      loginReward: LOGIN_REWARD,
      consecutiveBonus: bonus,
      consecutiveDays: nextConsecutiveDays
    },
    student: updatedStudentRes.data
  }
}

async function registerStudent(event, wxContext) {
  const { OPENID } = wxContext
  const { nickname } = event
  
  let userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  let userId
  if (userRes.data.length === 0) {
    const newUser = await db.collection('users').add({
      data: {
        openId: OPENID,
        nickname: nickname,
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
    })
    userId = newUser._id
  } else {
    userId = userRes.data[0]._id
    await db.collection('users').doc(userId).update({
      data: { lastLoginAt: new Date() }
    })
  }
  
  const existingStudent = await db.collection('students').where({
    userId: userId
  }).get()
  
  if (existingStudent.data.length > 0) {
    return {
      success: false,
      message: '该账号已注册学生身份'
    }
  }
  
  let inviteCode
  let codeExists = true
  while (codeExists) {
    inviteCode = generateInviteCode()
    const checkRes = await db.collection('students').where({
      inviteCode: inviteCode
    }).get()
    codeExists = checkRes.data.length > 0
  }
  
  const studentRes = await db.collection('students').add({
    data: {
      userId: userId,
      inviteCode: inviteCode,
      coinBalance: 50 + LOGIN_REWARD,
      totalCoinsEarned: LOGIN_REWARD,
      consecutiveDays: 1,
      totalActiveDays: 1,
      lastLoginDate: getDateKey(),
      createdAt: new Date()
    }
  })

  await db.collection('coin_transactions').add({
    data: {
      studentId: studentRes._id,
      type: 'login_reward',
      amount: LOGIN_REWARD,
      description: '每日登录奖励',
      dateKey: getDateKey(),
      createdAt: new Date()
    }
  })
  
  return {
    success: true,
    userId: userId,
    studentId: studentRes._id,
    inviteCode: inviteCode,
    coinBalance: 50 + LOGIN_REWARD
  }
}

async function registerParent(event, wxContext) {
  const { OPENID } = wxContext
  const { nickname } = event
  
  let userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  let userId
  if (userRes.data.length === 0) {
    const newUser = await db.collection('users').add({
      data: {
        openId: OPENID,
        nickname: nickname,
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
    })
    userId = newUser._id
  } else {
    userId = userRes.data[0]._id
    await db.collection('users').doc(userId).update({
      data: { lastLoginAt: new Date() }
    })
  }
  
  const existingParent = await db.collection('parents').where({
    userId: userId
  }).get()
  
  if (existingParent.data.length > 0) {
    return {
      success: false,
      message: '该账号已注册家长身份'
    }
  }
  
  const parentRes = await db.collection('parents').add({
    data: {
      userId: userId,
      createdAt: new Date()
    }
  })
  
  return {
    success: true,
    userId: userId,
    parentId: parentRes._id
  }
}

async function bindChild(event, wxContext) {
  const { OPENID } = wxContext
  const { inviteCode, userId } = event
  
  const parentUserRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  if (parentUserRes.data.length === 0) {
    return { success: false, message: '家长账号不存在' }
  }
  
  const parentUser = parentUserRes.data[0]
  
  const parentRes = await db.collection('parents').where({
    userId: userId || parentUser._id
  }).get()
  
  if (parentRes.data.length === 0) {
    return { success: false, message: '家长档案不存在' }
  }
  
  const parent = parentRes.data[0]
  
  const studentRes = await db.collection('students').where({
    inviteCode: inviteCode
  }).get()
  
  if (studentRes.data.length === 0) {
    return { success: false, message: '邀请码无效' }
  }
  
  const student = studentRes.data[0]
  
  const existingBinding = await db.collection('bindings').where({
    parentId: parent._id,
    studentId: student._id
  }).get()
  
  if (existingBinding.data.length > 0) {
    return { success: false, message: '已经绑定过该孩子' }
  }
  
  await db.collection('bindings').add({
    data: {
      parentId: parent._id,
      studentId: student._id,
      role: 'secondary',
      permissions: ['manage_tasks', 'review_tasks', 'view_reports'],
      createdAt: new Date()
    }
  })
  
  return {
    success: true,
    studentId: student._id
  }
}

async function getUserInfo(wxContext) {
  const { OPENID } = wxContext
  
  const userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }
  
  const user = userRes.data[0]
  
  const identities = []
  
  const studentRes = await db.collection('students').where({
    userId: user._id
  }).get()
  
  if (studentRes.data.length > 0) {
    identities.push({
      role: 'student',
      profile: studentRes.data[0]
    })
  }
  
  const parentRes = await db.collection('parents').where({
    userId: user._id
  }).get()
  
  if (parentRes.data.length > 0) {
    const parent = parentRes.data[0]
    const bindingRes = await db.collection('bindings').where({
      parentId: parent._id
    }).get()
    
    identities.push({
      role: 'parent',
      profile: parent,
      bindings: bindingRes.data
    })
  }
  
  return {
    success: true,
    user: user,
    identities: identities
  }
}

async function selectRole(event, wxContext) {
  const { OPENID } = wxContext
  const { role } = event
  
  const userRes = await db.collection('users').where({
    openId: OPENID
  }).get()
  
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }
  
  const user = userRes.data[0]
  
  let profile = null
  let bindings = []
  
  if (role === 'student') {
    const studentRes = await db.collection('students').where({
      userId: user._id
    }).get()
    profile = studentRes.data[0] || null
    if (profile) {
      const loginReward = await awardDailyLoginReward(profile)
      profile = loginReward.student || profile
    }
  } else if (role === 'parent') {
    const parentRes = await db.collection('parents').where({
      userId: user._id
    }).get()
    profile = parentRes.data[0] || null
    
    if (profile) {
      const bindingRes = await db.collection('bindings').where({
        parentId: profile._id
      }).get()
      bindings = bindingRes.data
    }
  }

  if (!profile) {
    return {
      success: false,
      message: role === 'parent' ? '家长账号不存在' : '学生账号不存在'
    }
  }
  
  return {
    success: true,
    role: role,
    user: user,
    profile: profile,
    bindings: bindings
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
