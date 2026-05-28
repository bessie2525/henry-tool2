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
        return await touchPet(event, wxContext)
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
  pet.coinBalance = typeof student.coinBalance === 'number' ? student.coinBalance : (student.coins || 0)
  
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

async function getShopItem(itemId) {
  try {
    const itemRes = await db.collection('shop_items').doc(itemId).get()
    if (itemRes.data) return itemRes.data
  } catch (error) {
    console.warn('按_id查询商品失败，尝试按业务id查询:', itemId, error.message)
  }

  const itemRes = await db.collection('shop_items').where({ id: itemId }).get()
  return itemRes.data[0] || null
}

async function findAvailableInventoryItem(studentId, category, itemId) {
  let query = db.collection('inventory').where({
    studentId,
    itemCategory: category,
    quantity: _.gt(0)
  })

  if (itemId) {
    query = db.collection('inventory').where({
      studentId,
      itemId,
      itemCategory: category,
      quantity: _.gt(0)
    })
  }

  const inventoryRes = await query.limit(1).get()
  return inventoryRes.data[0] || null
}

async function consumeInventoryItem(studentId, category, itemId) {
  const inventory = await findAvailableInventoryItem(studentId, category, itemId)
  if (!inventory) {
    return {
      success: false,
      message: category === 'food' ? '没有可用食物，请先去商店购买' : '没有可用饮品，请先去商店购买'
    }
  }

  const item = await getShopItem(inventory.itemId)
  if (!item || item.category !== category) {
    return { success: false, message: '物品不存在或类型不正确' }
  }

  await db.collection('inventory').doc(inventory._id).update({
    data: {
      quantity: _.inc(-1),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    item,
    inventory
  }
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
  
  const { student } = studentData
  
  const petRes = await db.collection('pets').where({
    studentId: student._id
  }).get()
  
  if (petRes.data.length === 0) {
    return { success: false, message: '还没有宠物' }
  }
  
  const pet = calculateCurrentPetState(petRes.data[0])
  const consumeRes = await consumeInventoryItem(student._id, 'food', itemId)
  if (!consumeRes.success) {
    return consumeRes
  }

  const effect = consumeRes.item.effect || {}
  const hungerValue = effect.hunger || 0
  const moodValue = effect.mood || 0
  
  const newHunger = Math.min(constants.pet.maxHunger, pet.currentHunger + hungerValue)
  const newMood = Math.min(constants.pet.maxMood, pet.currentMood + moodValue)
  
  await db.collection('pets').doc(pet._id).update({
    data: {
      hunger: newHunger,
      mood: newMood,
      lastFedAt: new Date()
    }
  })
  
  const updatedPetRes = await db.collection('pets').doc(pet._id).get()
  let updatedPet = calculateCurrentPetState(updatedPetRes.data[0])
  
  return {
    success: true,
    pet: updatedPet,
    consumedItem: {
      itemId: consumeRes.inventory.itemId,
      name: consumeRes.inventory.itemName,
      category: consumeRes.inventory.itemCategory
    },
    message: `喂食成功！消耗 ${consumeRes.inventory.itemName}`
  }
}

async function waterPet(event, wxContext) {
  const { OPENID } = wxContext
  const { itemId } = event
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
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
    return { success: false, message: '还没有宠物' }
  }
  
  const pet = calculateCurrentPetState(petRes.data[0])
  const consumeRes = await consumeInventoryItem(student._id, 'drink', itemId)
  if (!consumeRes.success) {
    return consumeRes
  }

  const effect = consumeRes.item.effect || {}
  const thirstValue = effect.thirst || 0
  const moodValue = effect.mood || 0
  
  const newThirst = Math.min(constants.pet.maxThirst, pet.currentThirst + thirstValue)
  const newMood = Math.min(constants.pet.maxMood, pet.currentMood + moodValue)
  
  await db.collection('pets').doc(pet._id).update({
    data: {
      thirst: newThirst,
      mood: newMood,
      lastWateredAt: new Date()
    }
  })
  
  const updatedPetRes = await db.collection('pets').doc(pet._id).get()
  let updatedPet = calculateCurrentPetState(updatedPetRes.data[0])
  
  return {
    success: true,
    pet: updatedPet,
    consumedItem: {
      itemId: consumeRes.inventory.itemId,
      name: consumeRes.inventory.itemName,
      category: consumeRes.inventory.itemCategory
    },
    message: `喂水成功！消耗 ${consumeRes.inventory.itemName}`
  }
}

async function touchPet(event, wxContext) {
  const { OPENID } = wxContext
  const { moodValue = 10 } = event
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
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
    return { success: false, message: '还没有宠物' }
  }
  
  const pet = petRes.data[0]
  
  const newMood = Math.min(constants.pet.maxMood, pet.mood + moodValue)
  
  await db.collection('pets').doc(pet._id).update({
    data: {
      mood: newMood
    }
  })
  
  const updatedPetRes = await db.collection('pets').doc(pet._id).get()
  let updatedPet = calculateCurrentPetState(updatedPetRes.data[0])
  
  return {
    success: true,
    pet: updatedPet,
    message: '抚摸成功！'
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
