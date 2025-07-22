const User = require('./User');
const Habit = require('./Habit');
const { Achievement, UserAchievement } = require('./Achievement');

// Define associations between models

// User - Habit associations
User.hasMany(Habit, {
  foreignKey: 'userId',
  as: 'habits',
  onDelete: 'CASCADE'
});

Habit.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User - UserAchievement associations
User.hasMany(UserAchievement, {
  foreignKey: 'userId',
  as: 'userAchievements',
  onDelete: 'CASCADE'
});

UserAchievement.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Achievement - UserAchievement associations (already defined in Achievement.js, removing duplicate)
// Habit - UserAchievement associations (optional, for habit-specific achievements)
Habit.hasMany(UserAchievement, {
  foreignKey: 'habitId',
  as: 'achievements'
});

UserAchievement.belongsTo(Habit, {
  foreignKey: 'habitId',
  as: 'habit'
});

module.exports = {
  User,
  Habit,
  Achievement,
  UserAchievement
};
