const gameConfig = {
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

module.exports = gameConfig
