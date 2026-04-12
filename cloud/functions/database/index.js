const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('开始初始化数据库...')
    
    const results = {}
    
    results.shopItems = await initShopItems()
    results.achievements = await initAchievements()
    
    console.log('数据库初始化完成')
    
    return {
      success: true,
      results: results
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function initShopItems() {
  console.log('初始化商店商品...')
  
  const shopItems = [
    {
      id: 'food_fish',
      name: '小鱼干',
      category: 'food',
      price: 5,
      description: '恢复饱食度 +20',
      effect: { hunger: 20 },
      emoji: '🐟',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'food_steak',
      name: '牛排',
      category: 'food',
      price: 20,
      description: '恢复饱食度 +40，心情 +10',
      effect: { hunger: 40, mood: 10 },
      emoji: '🥩',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'food_cake',
      name: '蛋糕',
      category: 'food',
      price: 30,
      description: '恢复饱食度 +50，心情 +15',
      effect: { hunger: 50, mood: 15 },
      emoji: '🍰',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'drink_milk',
      name: '牛奶',
      category: 'drink',
      price: 5,
      description: '恢复口渴度 +30',
      effect: { thirst: 30 },
      emoji: '🥛',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'drink_juice',
      name: '果汁',
      category: 'drink',
      price: 10,
      description: '恢复口渴度 +50',
      effect: { thirst: 50 },
      emoji: '🧃',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'skin_rainbow',
      name: '彩虹皮肤',
      category: 'skin',
      price: 200,
      description: '七彩光芒的宠物皮肤',
      emoji: '🌈',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'skin_golden',
      name: '金色闪光',
      category: 'skin',
      price: 500,
      description: '稀有的金色皮肤',
      emoji: '✨',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'accessory_hat_red',
      name: '红色帽子',
      category: 'accessory',
      price: 50,
      description: '可爱的红色小帽子',
      emoji: '🎩',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'accessory_glasses',
      name: '眼镜',
      category: 'accessory',
      price: 80,
      description: '学者风格的眼镜',
      emoji: '👓',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'scene_garden',
      name: '花园场景',
      category: 'scene',
      price: 300,
      description: '美丽的花园背景',
      emoji: '🌸',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'scene_space',
      name: '太空站',
      category: 'scene',
      price: 500,
      description: '神秘的太空背景',
      emoji: '🚀',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'prop_exp_double',
      name: '经验加倍卡',
      category: 'prop',
      price: 100,
      description: '下次任务经验翻倍',
      emoji: '💎',
      isActive: true,
      createdAt: new Date()
    }
  ]
  
  const existing = await db.collection('shop_items').count()
  if (existing.total > 0) {
    console.log('商店商品已存在，跳过初始化')
    return { skipped: true, count: existing.total }
  }
  
  for (const item of shopItems) {
    await db.collection('shop_items').add({ data: item })
  }
  
  return { created: shopItems.length }
}

async function initAchievements() {
  console.log('初始化成就系统...')
  
  const achievements = [
    {
      id: 'first_pet',
      name: '初次见面',
      category: 'pet',
      description: '首次创建宠物',
      condition: { type: 'create_pet' },
      reward: { coins: 10 },
      icon: '🐾',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'chinese_30',
      name: '小作家',
      category: 'chinese',
      description: '累计写满30篇每日一记',
      condition: { type: 'chinese_count', value: 30 },
      reward: { coins: 100, badge: '小作家' },
      icon: '📝',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'english_500',
      name: '词汇达人',
      category: 'english',
      description: '累计掌握500个单词',
      condition: { type: 'english_mastered', value: 500 },
      reward: { coins: 200, badge: '词汇达人' },
      icon: '🔤',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'learning_7_days',
      name: '勤劳小蜜蜂',
      category: 'learning',
      description: '连续7天完成所有任务',
      condition: { type: 'consecutive_all_tasks', value: 7 },
      reward: { coins: 50, badge: '勤劳小蜜蜂' },
      icon: '🐝',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'pet_care_30',
      name: '宠物关爱达人',
      category: 'pet',
      description: '连续30天喂养宠物',
      condition: { type: 'consecutive_pet_care', value: 30 },
      reward: { skin: 'skin_golden' },
      icon: '❤️',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'login_100',
      name: '百日约定',
      category: 'special',
      description: '累计登录100天',
      condition: { type: 'login_days', value: 100 },
      reward: { coins: 500, scene: 'scene_space' },
      icon: '⭐',
      isActive: true,
      createdAt: new Date()
    }
  ]
  
  const existing = await db.collection('achievements').count()
  if (existing.total > 0) {
    console.log('成就数据已存在，跳过初始化')
    return { skipped: true, count: existing.total }
  }
  
  for (const achievement of achievements) {
    await db.collection('achievements').add({ data: achievement })
  }
  
  return { created: achievements.length }
}
