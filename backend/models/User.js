const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Instance method to update stats
  async updateStats(statsUpdate) {
    const currentStats = this.stats || {};
    const updatedStats = { ...currentStats, ...statsUpdate };
    await this.update({ stats: updatedStats });
    return this.reload();
  }

  // Virtual for completion rate
  get completionRate() {
    if (!this.stats || this.stats.totalHabits === 0) return 0;
    return Math.round((this.stats.completedHabits / this.stats.totalHabits) * 100);
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: {
        args: [1, 50],
        msg: 'Name cannot be more than 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Email is required' },
      isEmail: { msg: 'Please enter a valid email' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: {
        args: [6, 100],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      waterGoal: 2,
      sleepGoal: 8,
      exerciseGoal: 30,
      notifications: true,
      theme: 'light'
    },
    validate: {
      isValidPreferences(value) {
        if (value.waterGoal && (value.waterGoal < 0.5 || value.waterGoal > 10)) {
          throw new Error('Water goal must be between 0.5 and 10 liters');
        }
        if (value.sleepGoal && (value.sleepGoal < 4 || value.sleepGoal > 12)) {
          throw new Error('Sleep goal must be between 4 and 12 hours');
        }
        if (value.exerciseGoal && (value.exerciseGoal < 5 || value.exerciseGoal > 300)) {
          throw new Error('Exercise goal must be between 5 and 300 minutes');
        }
        if (value.theme && !['light', 'dark'].includes(value.theme)) {
          throw new Error('Theme must be light or dark');
        }
      }
    }
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      currentStreak: 0,
      longestStreak: 0,
      totalHabits: 0,
      completedHabits: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

module.exports = User;
