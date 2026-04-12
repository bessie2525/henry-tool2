const app = getApp()

const AUTH_KEYS = {
  USER_INFO: 'user_info',
  STUDENT_INFO: 'student_info',
  PARENT_INFO: 'parent_info',
  CURRENT_ROLE: 'current_role',
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
    wx.removeStorageSync(AUTH_KEYS.TOKEN)
    
    app.globalData.userInfo = null
    app.globalData.studentInfo = null
    app.globalData.parentInfo = null
    app.globalData.currentRole = null
  } catch (e) {
    console.error('清除认证信息失败', e)
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

async function login() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'auth',
      data: { action: 'login' }
    }).then(res => {
      if (res.result.success) {
        const { registered, role, user, profile } = res.result
        if (registered) {
          setUserInfo(user)
          setCurrentRole(role)
          if (role === 'student' && profile) {
            setStudentInfo(profile)
          } else if (role === 'parent' && profile) {
            setParentInfo(profile)
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
        const { user, profile, bindings } = res.result
        setUserInfo(user)
        setCurrentRole(user.role)
        if (user.role === 'student' && profile) {
          setStudentInfo(profile)
        } else if (user.role === 'parent' && profile) {
          setParentInfo(profile)
        }
        resolve({ user, profile, bindings })
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
  setStudentInfo,
  getStudentInfo,
  setParentInfo,
  getParentInfo,
  setCurrentRole,
  getCurrentRole,
  clearAuth,
  isLoggedIn,
  isStudent,
  isParent,
  login,
  registerStudent,
  registerParent,
  bindChild,
  getUserInfoFromServer
}
