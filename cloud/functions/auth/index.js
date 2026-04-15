const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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
      identities.push({
        role: 'student',
        profile: studentRes.data[0]
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
      coinBalance: 0,
      totalCoinsEarned: 0,
      consecutiveDays: 0,
      totalActiveDays: 0,
      lastLoginDate: null,
      createdAt: new Date()
    }
  })
  
  return {
    success: true,
    userId: userId,
    studentId: studentRes._id,
    inviteCode: inviteCode
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
