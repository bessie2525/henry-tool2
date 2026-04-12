const gameConfig = {
  pet: {
    hungerDecayPerHour: 1.67,
    thirstDecayPerHour: 2.5,
    moodDecayPerInactiveDay: 30,
    sickThreshold: 0,
    missThresholdDays: 3,
    maxHunger: 100,
    maxThirst: 100,
    maxMood: 100,
    species: [
      { id: 'cat', name: '小猫', emoji: '🐱', defaultColor: '#FFA500' },
      { id: 'dog', name: '小狗', emoji: '🐶', defaultColor: '#8B4513' },
      { id: 'dragon', name: '小龙', emoji: '🐉', defaultColor: '#50E3C2' }
    ]
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
    perfectCoinMultiplier: 1.5,
    gameTypes: [
      'drift_bottle',
      'sentence_builder',
      'monster_battle',
      'sentence_fill',
      'listen_hunt'
    ]
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
    maxConsecutiveMultiplier: 2.0,
    expTable: [
      { level: 1, expRequired: 0 },
      { level: 2, expRequired: 100 },
      { level: 3, expRequired: 250 },
      { level: 4, expRequired: 450 },
      { level: 5, expRequired: 700 },
      { level: 6, expRequired: 1000 },
      { level: 7, expRequired: 1350 },
      { level: 8, expRequired: 1750 },
      { level: 9, expRequired: 2200 },
      { level: 10, expRequired: 2700 }
    ]
  },
  shop: {
    categories: [
      { id: 'food', name: '食物', emoji: '🍖' },
      { id: 'drink', name: '饮品', emoji: '💧' },
      { id: 'skin', name: '皮肤', emoji: '👔' },
      { id: 'accessory', name: '装饰', emoji: '🎀' },
      { id: 'scene', name: '场景', emoji: '🏠' },
      { id: 'prop', name: '道具', emoji: '✨' }
    ],
    dailyRecommendationCount: 3,
    dailyDiscount: 0.9
  },
  achievement: {
    categories: [
      { id: 'learning', name: '学习勤勉', emoji: '📚' },
      { id: 'chinese', name: '语文达人', emoji: '📝' },
      { id: 'english', name: '单词大师', emoji: '🔤' },
      { id: 'pet', name: '宠物关爱', emoji: '🐾' },
      { id: 'special', name: '特殊成就', emoji: '⭐' }
    ]
  },
  task: {
    status: {
      pending: 'pending',
      submitted: 'submitted',
      approved: 'approved',
      rejected: 'rejected'
    },
    chinese: {
      minLength: 10,
      maxLength: 200
    }
  }
}

module.exports = gameConfig
