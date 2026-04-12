Component({
  properties: {
    amount: {
      type: Number,
      value: 0
    },
    showAnimation: {
      type: Boolean,
      value: false
    }
  },

  data: {
    displayAmount: 0,
    animating: false
  },

  observers: {
    'amount': function(amount) {
      if (this.data.showAnimation && amount !== this.data.displayAmount) {
        this.animateCoin(amount)
      } else {
        this.setData({ displayAmount: amount })
      }
    }
  },

  methods: {
    animateCoin(targetAmount) {
      const startAmount = this.data.displayAmount
      const diff = targetAmount - startAmount
      const duration = 500
      const startTime = Date.now()
      
      this.setData({ animating: true })
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentAmount = Math.round(startAmount + diff * easeOut)
        
        this.setData({ displayAmount: currentAmount })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this.setData({ animating: false })
        }
      }
      
      animate()
    }
  }
})
