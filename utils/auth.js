const app = getApp()

const AUTH_KEYS = {
  USER_INFO: 'user_info',
  STUDENT_INFO: 'student_info',
  PARENT_INFO: 'parent_info',
  CURRENT_ROLE: 'current_role',
  IDENTITIES: 'identities',
  TOKEN: 'auth_token'
}

function setUserInfo(userInfo) {
  try {
    wx.setStorageSync(AUTH_KEYS.USER_INFO, userInfo)
    app.globalData.userInfo = userInfo
  } catch (e) {
    console.error('保存用户信息失败', e)
  }
}

function getUserInfo() {
  try {
    return wx.getStorageSync(AUTH_KEYS.USER_INFO) || null
  } catch (e) {
    return null
  }
}

function setIdentities(identities) {
  try {
    wx.setStorageSync(AUTH_KEYS.IDENTITIES, identities)
    app.globalData.identities = identities
  } catch (e) {
    console.error('保存身份列表失败', e)
  }
}

function getIdentities() {
  try {
    return wx.getStorageSync(AUTH_KEYS.IDENTITIES) || []
  } catch (e) {
    return []
  }
}

function setStudentInfo(studentInfo) {
  try {
    wx.setStorageSync(AUTH_KEYS.STUDENT_INFO, studentInfo)
    app.globalData.studentInfo = studentInfo
  } catch (e) {
    console.error('保存学生信息失败', e)
  }
}

function getStudentInfo() {
  try {
    return wx.getStorageSync(AUTH_KEYS.STUDENT_INFO) || null
  } catch (e) {
    return null
  }
}

function setParentInfo(parentInfo) {
  try {
    wx.setStorageSync(AUTH_KEYS.PARENT_INFO, parentInfo)
    app.globalData.parentInfo = parentInfo
  } catch (e) {
    console.error('保存家长信息失败', e)
  }
}

function getParentInfo() {
  try {
    return wx.getStorageSync(AUTH_KEYS.PARENT_INFO) || null
  } catch (e) {
    return null
  }
}

function setCurrentRole(role) {
  try {
    wx.setStorageSync(AUTH_KEYS.CURRENT_ROLE, role)
    app.globalData.currentRole = role
  } catch (e) {
    console.error('保存角色失败', e)
  }
}

function getCurrentRole() {
  try {
    return wx.getStorageSync(AUTH_KEYS.CURRENT_ROLE) || null
  } catch (e) {
    return null
  }
}

function clearAuth() {
  try {
    wx.removeStorageSync(AUTH_KEYS.USER_INFO)
    wx.removeStorageSync(AUTH_KEYS.STUDENT_INFO)
    wx.removeStorageSync(AUTH_KEYS.PARENT_INFO)
    wx.removeStorageSync(AUTH_KEYS.CURRENT_ROLE)
    wx.removeStorageSync(AUTH_KEYS.IDENTITIES)
    wx.removeStorageSync(AUTH_KEYS.TOKEN)
    
    app.globalData.userInfo = null
    app.globalData.studentInfo = null
    app.globalData.parentInfo = null
    app.globalData.currentRole = null
    app.globalData.identities = []
  } catch (e) {
    console.error('清除认证信息失败', e)
  }
}

function clearCurrentRole() {
  try {
    wx.removeStorageSync(AUTH_KEYS.CURRENT_ROLE)
    wx.removeStorageSync(AUTH_KEYS.STUDENT_INFO)
    wx.removeStorageSync(AUTH_KEYS.PARENT_INFO)
    
    app.globalData.currentRole = null
    app.globalData.studentInfo = null
    app.globalData.parentInfo = null
  } catch (e) {
    console.error('清除当前角色失败', e)
  }
}

function isLoggedIn() {
  return !!getUserInfo()
}

function isStudent() {
  return getCurrentRole() === 'student'
}

function isParent() {
  return getCurrentRole() === 'parent'
}

function hasMultipleRoles() {
  const identities = getIdentities()
  return identities.length > 1
}

async function login() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: { action: 'login' }
    }).then(res => {
      if (res.result.success) {
        const { registered, user, identities, hasMultipleRoles } = res.result
        if (registered) {
          setUserInfo(user)
          if (identities) {
            setIdentities(identities)
          }
        }
        resolve(res.result)
      } else {
        reject(res.result)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

async function selectRole(role) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: { 
        action: 'select_role',
        role: role
      }
    }).then(res => {
      if (res.result.success) {
        const { user, profile, bindings } = res.result
        setCurrentRole(role)
        if (role === 'student' && profile) {
          setStudentInfo(profile)
        } else if (role === 'parent' && profile) {
          setParentInfo(profile)
          app.globalData.bindings = bindings || []
        }
        resolve(res.result)
      } else {
        reject(res.result)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

async function registerStudent(nickname) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'register_student',
        nickname: nickname
      }
    }).then(res => {
      if (res.result.success) {
        resolve(res.result)
      } else {
        reject(res.result)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

async function registerParent(nickname) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'register_parent',
        nickname: nickname
      }
    }).then(res => {
      if (res.result.success) {
        resolve(res.result)
      } else {
        reject(res.result)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

async function bindChild(inviteCode) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'bind_child',
        inviteCode: inviteCode
      }
    }).then(res => {
      if (res.result.success) {
        resolve(res.result)
      } else {
        reject(res.result)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

async function getUserInfoFromServer() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: { action: 'get_user_info' }
    }).then(res => {
      if (res.result.success) {
        const { user, identities } = res.result
        setUserInfo(user)
        if (identities) {
          setIdentities(identities)
        }
        resolve(res.result)
      } else {
        reject(res.result)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

module.exports = {
  setUserInfo,
  getUserInfo,
  setIdentities,
  getIdentities,
  setStudentInfo,
  getStudentInfo,
  setParentInfo,
  getParentInfo,
  setCurrentRole,
  getCurrentRole,
  clearAuth,
  clearCurrentRole,
  isLoggedIn,
  isStudent,
  isParent,
  hasMultipleRoles,
  login,
  selectRole,
  registerStudent,
  registerParent,
  bindChild,
  getUserInfoFromServer
}
