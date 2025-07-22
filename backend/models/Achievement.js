const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Achievement extends Model {}

class UserAchievement extends Model {
  // Virtual for completion status
  get isCompleted() {
    return this.progress.current >= this.progress.target;
  }

  // Method to update progress
  async updateProgress(currentValue) {
    const updatedProgress = {
      current: currentValue,
      target: this.progress.target,
      percentage: Math.min(100, Math.round((currentValue / this.progress.target) * 100))
    };
    
    let updateData = { progress: updatedProgress };
    
    if (currentValue >= this.progress.target && !this.isUnlocked) {
      updateData.isUnlocked = true;
      updateData.unlockedAt = new Date();
    }
    
    await this.update(updateData);
    return this.reload();
  }
}

Achievement.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Achievement title is required' },
      len: {
        args: [1, 100],
        msg: 'Title cannot be more than 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Achievement description is required' },
      len: {
        args: [1, 300],
        msg: 'Description cannot be more than 300 characters'
      }
    }
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('streak', 'completion', 'milestone', 'consistency', 'variety'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('exercise', 'nutrition', 'sleep', 'mindfulness', 'productivity', 'health', 'learning', 'social', 'general'),
    allowNull: false
  },
  criteria: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidCriteria(value) {
        if (!value || !value.target || !value.unit) {
          throw new Error('Criteria must have target and unit');
        }
        if (value.target < 1) {
          throw new Error('Target must be at least 1');
        }
        const validUnits = ['days', 'weeks', 'months', 'completions', 'habits', 'points'];
        if (!validUnits.includes(value.unit)) {
          throw new Error('Invalid criteria unit');
        }
        const validConditions = ['streak', 'total', 'consecutive', 'variety'];
        if (value.condition && !validConditions.includes(value.condition)) {
          throw new Error('Invalid criteria condition');
        }
      }
    }
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    defaultValue: 'common'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: { args: 1, msg: 'Points must be at least 1' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Achievement',
  tableName: 'achievements',
  timestamps: true,
  indexes: [
    {
      fields: ['type', 'category', 'isActive']
    }
  ]
});

UserAchievement.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  achievementId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'achievements',
      key: 'id'
    }
  },
  unlockedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  progress: {
    type: DataTypes.JSONB,
    defaultValue: {
      current: 0,
      target: 1,
      percentage: 0
    }
  },
  isUnlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  habitId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'habits',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'UserAchievement',
  tableName: 'user_achievements',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'achievementId']
    },
    {
      fields: ['userId', 'isUnlocked']
    }
  ]
});

// Define associations
Achievement.hasMany(UserAchievement, {
  foreignKey: 'achievementId',
  as: 'userAchievements'
});

UserAchievement.belongsTo(Achievement, {
  foreignKey: 'achievementId',
  as: 'achievement'
});

module.exports = {
  Achievement,
  UserAchievement
};
