const cloud = require('wx-server-sdk')
const db = cloud.database()
const _ = db.command

async function getStudentByOpenId(openId) {
  const userRes = await db.collection('users').where({ openId }).get()
  if (userRes.data.length === 0) return null
  
  const user = userRes.data[0]
  if (user.role !== 'student') return null
  
  const studentRes = await db.collection('students').where({ userId: user._id }).get()
  if (studentRes.data.length === 0) return null
  
  return { user, student: studentRes.data[0] }
}

async function getParentByOpenId(openId) {
  const userRes = await db.collection('users').where({ openId }).get()
  if (userRes.data.length === 0) return null
  
  const user = userRes.data[0]
  if (user.role !== 'parent') return null
  
  const parentRes = await db.collection('parents').where({ userId: user._id }).get()
  if (parentRes.data.length === 0) return null
  
  return { user, parent: parentRes.data[0] }
}

async function checkParentAccess(parentId, studentId) {
  const bindingRes = await db.collection('bindings').where({
    parentId: parentId,
    studentId: studentId
  }).get()
  
  return bindingRes.data.length > 0
}

async function getBoundStudents(parentId) {
  const bindingRes = await db.collection('bindings').where({
    parentId: parentId
  }).get()
  
  if (bindingRes.data.length === 0) return []
  
  const studentIds = bindingRes.data.map(b => b.studentId)
  const studentsRes = await db.collection('students').where({
    _id: _.in(studentIds)
  }).get()
  
  return studentsRes.data
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function getStudentByInviteCode(inviteCode) {
  const studentRes = await db.collection('students').where({
    inviteCode: inviteCode
  }).get()
  
  if (studentRes.data.length === 0) return null
  return studentRes.data[0]
}

module.exports = {
  db,
  _,
  getStudentByOpenId,
  getParentByOpenId,
  checkParentAccess,
  getBoundStudents,
  generateInviteCode,
  getStudentByInviteCode
}
