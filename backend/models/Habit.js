const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Habit extends Model {
  // Virtual for completion rate
  get completionRate() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    if (!this.completions || this.completions.length === 0) return 0;
    
    const completionsThisWeek = this.completions.filter(completion => 
      new Date(completion.date) >= startOfWeek
    );
    
    const targetDays = this.frequency === 'daily' ? 7 : 
                       this.frequency === 'weekly' ? 1 : 
                       this.frequency === 'monthly' ? 1 : 7;
    
    return Math.round((completionsThisWeek.length / targetDays) * 100);
  }

  // Virtual for total completions
  get totalCompletions() {
    return this.completions ? this.completions.length : 0;
  }

  // Method to add completion
  async addCompletion(value, notes = '') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentCompletions = this.completions || [];
    
    // Check if already completed today
    const todayCompletion = currentCompletions.find(completion => {
      const completionDate = new Date(completion.date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });
    
    if (todayCompletion) {
      throw new Error('Habit already completed today');
    }
    
    // Add completion
    const newCompletion = {
      date: today,
      value: value,
      notes: notes
    };
    
    currentCompletions.push(newCompletion);
    
    // Update streak and save
    const updatedStreak = this.calculateStreak(currentCompletions);
    
    await this.update({ 
      completions: currentCompletions,
      streak: updatedStreak
    });
    
    return this.reload();
  }

  // Method to calculate streak
  calculateStreak(completions = null) {
    const completionsList = completions || this.completions || [];
    
    if (completionsList.length === 0) {
      return { current: 0, longest: this.streak?.longest || 0 };
    }
    
    const sortedCompletions = completionsList
      .sort((a, b) => new Date(b.date) - new Date(a.date));
      
    let currentStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if last completion was today or yesterday
    const lastCompletion = new Date(sortedCompletions[0].date);
    lastCompletion.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastCompletion) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) {
      return { 
        current: 0, 
        longest: this.streak?.longest || 0,
        lastCompletedDate: sortedCompletions[0].date
      };
    }
    
    // Calculate streak
    for (let i = 1; i < sortedCompletions.length; i++) {
      const currentDate = new Date(sortedCompletions[i-1].date);
      const prevDate = new Date(sortedCompletions[i].date);
      
      currentDate.setHours(0, 0, 0, 0);
      prevDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    const longestStreak = Math.max(this.streak?.longest || 0, currentStreak);
    
    return {
      current: currentStreak,
      longest: longestStreak,
      lastCompletedDate: sortedCompletions[0].date
    };
  }
}

Habit.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Habit title is required' },
      len: {
        args: [1, 100],
        msg: 'Habit title cannot be more than 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.STRING(500),
    validate: {
      len: {
        args: [0, 500],
        msg: 'Description cannot be more than 500 characters'
      }
    }
  },
  category: {
    type: DataTypes.ENUM('exercise', 'nutrition', 'sleep', 'mindfulness', 'productivity', 'health', 'learning', 'social'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category is required' }
    }
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    defaultValue: 'daily',
    allowNull: false
  },
  target: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidTarget(value) {
        if (!value || !value.value || !value.unit) {
          throw new Error('Target must have value and unit');
        }
        if (value.value < 1) {
          throw new Error('Target value must be at least 1');
        }
        const validUnits = ['times', 'minutes', 'hours', 'glasses', 'pages', 'kilometers', 'steps'];
        if (!validUnits.includes(value.unit)) {
          throw new Error('Invalid target unit');
        }
      }
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  streak: {
    type: DataTypes.JSONB,
    defaultValue: {
      current: 0,
      longest: 0,
      lastCompletedDate: null
    }
  },
  completions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  reminders: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#3B82F6',
    validate: {
      is: {
        args: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        msg: 'Color must be a valid hex color'
      }
    }
  }
}, {
  sequelize,
  modelName: 'Habit',
  tableName: 'habits',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'isActive']
    },
    {
      fields: ['category']
    }
  ]
});

module.exports = Habit;
