const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

async function getStudentByOpenId(openId) {
  const userRes = await db.collection('users').where({ openId }).get()
  if (userRes.data.length === 0) return null
  
  const user = userRes.data[0]
  const studentRes = await db.collection('students').where({ userId: user._id }).get()
  if (studentRes.data.length === 0) return null
  
  return { user, student: studentRes.data[0] }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event
  
  try {
    switch (action) {
      case 'list':
        return await getShopList(event)
      case 'daily':
        return await getDailyRecommendations()
      case 'buy':
        return await buyItem(event, wxContext)
      case 'inventory':
        return await getInventory(wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('shop云函数错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

async function getShopList(event) {
  const { category } = event
  
  const conditions = {
    isActive: _.neq(false)
  }

  if (category) {
    conditions.category = category
  }
  
  const res = await db.collection('shop_items').where(conditions).get()
  
  return {
    success: true,
    items: res.data
  }
}

async function getDailyRecommendations() {
  const itemsRes = await db.collection('shop_items')
    .where({ isRecommendation: true })
    .limit(5)
    .get()
  
  return {
    success: true,
    recommendations: itemsRes.data
  }
}

async function getShopItem(itemId) {
  if (!itemId) return null

  try {
    const itemRes = await db.collection('shop_items').doc(itemId).get()
    if (itemRes.data) return itemRes.data
  } catch (error) {
    console.warn('按_id查询商品失败，尝试按业务id查询:', itemId, error.message)
  }

  const itemRes = await db.collection('shop_items').where({ id: itemId }).limit(1).get()
  return itemRes.data[0] || null
}

async function buyItem(event, wxContext) {
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
  
  const item = await getShopItem(itemId)
  if (!item) {
    return { success: false, message: '商品不存在' }
  }

  if (item.isActive === false) {
    return { success: false, message: '商品已下架' }
  }
  
  const currentBalance = typeof student.coinBalance === 'number' ? student.coinBalance : (student.coins || 0)
  if (currentBalance < item.price) {
    return { success: false, message: '金币不足' }
  }
  
  const newBalance = currentBalance - item.price
  const inventoryItemId = item._id || item.id || itemId
  
  await db.collection('students').doc(student._id).update({
    data: { coinBalance: newBalance }
  })
  
  const existingInventoryRes = await db.collection('inventory').where({
    studentId: student._id,
    itemId: inventoryItemId
  }).get()
  
  if (existingInventoryRes.data.length > 0) {
    const inventory = existingInventoryRes.data[0]
    await db.collection('inventory').doc(inventory._id).update({
      data: {
        quantity: _.inc(1),
        updatedAt: new Date()
      }
    })
  } else {
    await db.collection('inventory').add({
      data: {
        studentId: student._id,
        itemId: inventoryItemId,
        itemBizId: item.id || '',
        itemName: item.name,
        itemCategory: item.category,
        itemEmoji: item.emoji || '',
        itemEffect: item.effect || {},
        quantity: 1,
        createdAt: new Date()
      }
    })
  }
  
  await db.collection('coin_transactions').add({
    data: {
      studentId: student._id,
      type: 'spend',
      amount: item.price,
      description: `购买 ${item.name}`,
      relatedItemId: inventoryItemId,
      createdAt: new Date()
    }
  })
  
  const updatedStudentRes = await db.collection('students').doc(student._id).get()
  
  return {
    success: true,
    message: '购买成功！',
    coinBalance: typeof updatedStudentRes.data.coinBalance === 'number' ? updatedStudentRes.data.coinBalance : 0,
    coins: typeof updatedStudentRes.data.coinBalance === 'number' ? updatedStudentRes.data.coinBalance : 0
  }
}

async function getInventory(wxContext) {
  const { OPENID } = wxContext
  
  if (!OPENID) {
    return { success: false, message: '请在小程序中操作' }
  }
  
  const studentData = await getStudentByOpenId(OPENID)
  if (!studentData) {
    return { success: false, message: '学生账号不存在' }
  }
  
  const { student } = studentData
  
  const inventoryRes = await db.collection('inventory')
    .where({
      studentId: student._id,
      quantity: _.gt(0)
    })
    .get()
  
  return {
    success: true,
    items: inventoryRes.data
  }
}
