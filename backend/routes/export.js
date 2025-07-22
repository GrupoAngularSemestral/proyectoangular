const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Habit = require('../models/Habit');
const { UserAchievement } = require('../models/Achievement');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/export/data
// @desc    Export user data in specified format
// @access  Private
router.get('/data', [auth, [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('type')
    .optional()
    .isIn(['habits', 'achievements', 'profile', 'all'])
    .withMessage('Type must be habits, achievements, profile, or all'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid date')
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      format = 'json', 
      type = 'all',
      dateFrom,
      dateTo 
    } = req.query;

    const user = await User.findById(req.user.userId);
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    };

    // Date filters
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    // Export profile data
    if (type === 'profile' || type === 'all') {
      exportData.profile = {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats,
        completionRate: user.completionRate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }

    // Export habits data
    if (type === 'habits' || type === 'all') {
      const habitFilter = { user: req.user.userId };
      if (Object.keys(dateFilter).length > 0) {
        habitFilter.createdAt = dateFilter;
      }

      const habits = await Habit.find(habitFilter);
      
      exportData.habits = habits.map(habit => {
        const habitData = {
          id: habit._id,
          title: habit.title,
          description: habit.description,
          category: habit.category,
          frequency: habit.frequency,
          target: habit.target,
          streak: habit.streak,
          color: habit.color,
          isActive: habit.isActive,
          createdAt: habit.createdAt,
          updatedAt: habit.updatedAt,
          totalCompletions: habit.totalCompletions,
          completionRate: habit.completionRate
        };

        // Filter completions by date if specified
        if (Object.keys(dateFilter).length > 0) {
          habitData.completions = habit.completions.filter(completion => {
            const compDate = new Date(completion.date);
            if (dateFrom && compDate < new Date(dateFrom)) return false;
            if (dateTo && compDate > new Date(dateTo)) return false;
            return true;
          });
        } else {
          habitData.completions = habit.completions;
        }

        habitData.reminders = habit.reminders;
        return habitData;
      });

      exportData.habitsStats = {
        totalHabits: exportData.habits.length,
        activeHabits: exportData.habits.filter(h => h.isActive).length,
        totalCompletions: exportData.habits.reduce((sum, h) => sum + h.totalCompletions, 0),
        categories: [...new Set(exportData.habits.map(h => h.category))],
        avgCompletionRate: Math.round(
          exportData.habits.reduce((sum, h) => sum + h.completionRate, 0) / exportData.habits.length || 0
        )
      };
    }

    // Export achievements data
    if (type === 'achievements' || type === 'all') {
      const achievementFilter = { user: req.user.userId };
      if (Object.keys(dateFilter).length > 0) {
        achievementFilter.unlockedAt = dateFilter;
      }

      const userAchievements = await UserAchievement.find(achievementFilter)
        .populate('achievement');

      exportData.achievements = userAchievements.map(ua => ({
        id: ua.achievement._id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        type: ua.achievement.type,
        category: ua.achievement.category,
        rarity: ua.achievement.rarity,
        points: ua.achievement.points,
        progress: ua.progress,
        isUnlocked: ua.isUnlocked,
        unlockedAt: ua.unlockedAt
      }));

      const unlockedAchievements = exportData.achievements.filter(a => a.isUnlocked);
      
      exportData.achievementsStats = {
        totalAchievements: exportData.achievements.length,
        unlockedAchievements: unlockedAchievements.length,
        totalPoints: unlockedAchievements.reduce((sum, a) => sum + a.points, 0),
        completionRate: Math.round((unlockedAchievements.length / exportData.achievements.length) * 100) || 0,
        rarityBreakdown: unlockedAchievements.reduce((breakdown, a) => {
          breakdown[a.rarity] = (breakdown[a.rarity] || 0) + 1;
          return breakdown;
        }, {})
      };
    }

    // Handle different formats
    if (format === 'csv') {
      return exportToCsv(res, exportData, type);
    }

    // JSON format (default)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fittrack-export-${type}-${Date.now()}.json"`);
    
    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during export'
    });
  }
});

// @route   GET /api/export/backup
// @desc    Create full backup of user data
// @access  Private
router.get('/backup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const habits = await Habit.find({ user: req.user.userId });
    const achievements = await UserAchievement.find({ user: req.user.userId })
      .populate('achievement');

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      habits: habits.map(habit => ({
        id: habit._id,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        frequency: habit.frequency,
        target: habit.target,
        streak: habit.streak,
        completions: habit.completions,
        reminders: habit.reminders,
        color: habit.color,
        isActive: habit.isActive,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt
      })),
      achievements: achievements.map(ua => ({
        achievementId: ua.achievement._id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        type: ua.achievement.type,
        category: ua.achievement.category,
        rarity: ua.achievement.rarity,
        points: ua.achievement.points,
        progress: ua.progress,
        isUnlocked: ua.isUnlocked,
        unlockedAt: ua.unlockedAt
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fittrack-backup-${Date.now()}.json"`);
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });

  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during backup creation'
    });
  }
});

// @route   GET /api/export/stats
// @desc    Export statistics summary
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const habits = await Habit.find({ user: req.user.userId, isActive: true });
    const achievements = await UserAchievement.find({ 
      user: req.user.userId,
      isUnlocked: true 
    }).populate('achievement');

    // Calculate time-based stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const last30DaysCompletions = habits.reduce((total, habit) => {
      return total + habit.completions.filter(c => c.date >= thirtyDaysAgo).length;
    }, 0);

    const last7DaysCompletions = habits.reduce((total, habit) => {
      return total + habit.completions.filter(c => c.date >= sevenDaysAgo).length;
    }, 0);

    const stats = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        joinDate: user.createdAt,
        daysSinceJoining: Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24))
      },
      overview: {
        totalHabits: habits.length,
        totalCompletions: user.stats.completedHabits,
        currentStreak: user.stats.currentStreak,
        longestStreak: user.stats.longestStreak,
        completionRate: user.completionRate,
        totalAchievements: achievements.length,
        totalPoints: achievements.reduce((sum, a) => sum + a.achievement.points, 0)
      },
      recentActivity: {
        last7Days: last7DaysCompletions,
        last30Days: last30DaysCompletions,
        averageDaily: Math.round(last30DaysCompletions / 30 * 10) / 10
      },
      habitBreakdown: {
        byCategory: habits.reduce((categories, habit) => {
          categories[habit.category] = (categories[habit.category] || 0) + 1;
          return categories;
        }, {}),
        byFrequency: habits.reduce((frequencies, habit) => {
          frequencies[habit.frequency] = (frequencies[habit.frequency] || 0) + 1;
          return frequencies;
        }, {}),
        topPerformers: habits
          .sort((a, b) => b.completionRate - a.completionRate)
          .slice(0, 5)
          .map(habit => ({
            title: habit.title,
            category: habit.category,
            completionRate: habit.completionRate,
            currentStreak: habit.streak.current,
            totalCompletions: habit.totalCompletions
          }))
      },
      achievementBreakdown: {
        byRarity: achievements.reduce((rarities, ua) => {
          const rarity = ua.achievement.rarity;
          rarities[rarity] = (rarities[rarity] || 0) + 1;
          return rarities;
        }, {}),
        byCategory: achievements.reduce((categories, ua) => {
          const category = ua.achievement.category;
          categories[category] = (categories[category] || 0) + 1;
          return categories;
        }, {}),
        recent: achievements
          .filter(ua => ua.unlockedAt >= sevenDaysAgo)
          .map(ua => ({
            title: ua.achievement.title,
            rarity: ua.achievement.rarity,
            points: ua.achievement.points,
            unlockedAt: ua.unlockedAt
          }))
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Export stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during stats export'
    });
  }
});

// Helper function to convert data to CSV
function exportToCsv(res, data, type) {
  let csvContent = '';
  let filename = `fittrack-${type}-${Date.now()}.csv`;

  try {
    if (type === 'habits' && data.habits) {
      // CSV for habits
      csvContent = 'Title,Description,Category,Frequency,Target Value,Target Unit,Current Streak,Longest Streak,Total Completions,Completion Rate,Color,Active,Created At\n';
      
      data.habits.forEach(habit => {
        csvContent += [
          `"${habit.title}"`,
          `"${habit.description || ''}"`,
          habit.category,
          habit.frequency,
          habit.target.value,
          habit.target.unit,
          habit.streak.current,
          habit.streak.longest,
          habit.totalCompletions,
          habit.completionRate,
          habit.color,
          habit.isActive,
          habit.createdAt
        ].join(',') + '\n';
      });

    } else if (type === 'achievements' && data.achievements) {
      // CSV for achievements
      csvContent = 'Title,Description,Type,Category,Rarity,Points,Progress Current,Progress Target,Progress Percentage,Unlocked,Unlocked At\n';
      
      data.achievements.forEach(achievement => {
        csvContent += [
          `"${achievement.title}"`,
          `"${achievement.description}"`,
          achievement.type,
          achievement.category,
          achievement.rarity,
          achievement.points,
          achievement.progress.current,
          achievement.progress.target,
          achievement.progress.percentage,
          achievement.isUnlocked,
          achievement.unlockedAt || ''
        ].join(',') + '\n';
      });

    } else {
      // Default CSV with basic user info
      csvContent = 'Field,Value\n';
      csvContent += `Name,"${data.user.name}"\n`;
      csvContent += `Email,"${data.user.email}"\n`;
      csvContent += `Export Date,"${data.exportedAt}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating CSV export'
    });
  }
}

module.exports = router;
