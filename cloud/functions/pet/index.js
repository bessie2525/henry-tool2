const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const constants = {
  pet: {
    hungerDecayPerHour: 1.67,
    thirstDecayPerHour: 2.5,
    moodDecayPerInactiveDay: 30,
    sickThreshold: 0,
    missThresholdDays: 3,
    maxHunger: 100,
    maxThirst: 100,
    maxMood: 100
  },
  coin: {
    chineseTaskReward: 10,
    englishTaskReward: 10,
    dailyCheckInReward: 5,
    allTaskBonusReward: 10,
    loginReward: 2,
    consecutiveBonus: {
      7: 50,
      30: 200,
      100: 500
    }
  },
  english: {
    wordsPerDay: 10,
    passAccuracy: 0.7,
    perfectAccuracy: 0.95,
    maxAttemptsPerDay: 3,
    perfectCoinMultiplier: 1.5
  },
  chat: {
    freeMessagesPerDay: 20,
    extraMessagesCost: 10,
    extraMessagesCount: 5
  },
  exp: {
    chineseTask: 30,
    englishTask: 30,
    dailyCheckIn: 15,
    consecutiveBonus: 0.05,
    maxConsecutiveMultiplier: 2.0
  },
  task: {
    status: {
      pending: 'pending',
      submitted: 'submitted',
      approved: 'approved',
      rejected: 'rejected'
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'create':
        return await createPet(event, wxContext)
      case 'info':
        return await getPetInfo(wxContext)
      case 'feed':
        return await feedPet(event, wxContext)
      case 'water':
        return await waterPet(event, wxContext)
      case 'touch':
        return await touchPet(wxContext)
      case 'dress':
        return await dressPet(event, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('pet云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function getStudentByOpenId(openId) {
  const userRes = await db.collection('users').where({ openId }).get()
  if (userRes.data.length === 0) return null
  
  const user = userRes.data[0]
  if (user.role !== 'student') return null
  
  const studentRes = await db.collection('students').where({ userId: user._id }).get()
  if (studentRes.data.length === 0) return null
  
  return { user, student: studentRes.data[0] }
}

async function createPet(event, wxContext) {
  const { OPENID } = wxContext
  const { name, species, color } = event
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const { student } = studentData
  
  const existingPet = await db.collection('pets').where({
    studentId: student._id
  }).get()
  
  if (existingPet.data.length > 0) {
    return { success: false, message: '已经有宠物了' }
  }
  
  const petRes = await db.collection('pets').add({
    data: {
      studentId: student._id,
      name: name,
      species: species,
      level: 1,
      exp: 0,
      expToNextLevel: 100,
      hunger: 80,
      thirst: 80,
      mood: 80,
      skinId: `skin_default_${species}`,
      accessoryIds: [],
      sceneId: 'scene_default',
      color: color,
      lastFedAt: new Date(),
      lastWateredAt: new Date(),
      createdAt: new Date()
    }
  })
  
  return {
    success: true,
    petId: petRes._id
  }
}

async function getPetInfo(wxContext) {
  const { OPENID } = wxContext
  
  if (!OPENID) {
    return { success: true, pet: null, hasPet: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const { student } = studentData
  
  const petRes = await db.collection('pets').where({
    studentId: student._id
  }).get()
  
  if (petRes.data.length === 0) {
    return { success: true, pet: null, hasPet: false }
  }
  
  let pet = petRes.data[0]
  
  pet = calculateCurrentPetState(pet)
  
  return {
    success: true,
    pet: pet,
    hasPet: true
  }
}

function calculateCurrentPetState(pet) {
  const now = new Date()
  
  const hoursSinceFed = (now - new Date(pet.lastFedAt)) / (1000 * 60 * 60)
  const hoursSinceWatered = (now - new Date(pet.lastWateredAt)) / (1000 * 60 * 60)
  
  const hungerDecay = hoursSinceFed * constants.pet.hungerDecayPerHour
  const thirstDecay = hoursSinceWatered * constants.pet.thirstDecayPerHour
  
  pet.currentHunger = Math.max(0, pet.hunger - hungerDecay)
  pet.currentThirst = Math.max(0, pet.thirst - thirstDecay)
  pet.currentMood = pet.mood
  
  if (pet.currentHunger === 0 || pet.currentThirst === 0) {
    pet.currentMood = Math.max(0, pet.currentMood - 30)
  }
  
  return pet
}

async function feedPet(event, wxContext) {
  const { OPENID } = wxContext
  const { itemId } = event
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  return {
    success: true,
    message: '喂食功能待实现'
  }
}

async function waterPet(event, wxContext) {
  const { OPENID } = wxContext
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  return {
    success: true,
    message: '喂水功能待实现'
  }
}

async function touchPet(wxContext) {
  const { OPENID } = wxContext
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  return {
    success: true,
    message: '抚摸功能待实现'
  }
}

async function dressPet(event, wxContext) {
  const { OPENID } = wxContext
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  return {
    success: true,
    message: '换装功能待实现'
  }
}
