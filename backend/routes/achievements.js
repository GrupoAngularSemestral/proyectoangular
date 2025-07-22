const express = require('express');
const { Achievement, UserAchievement } = require('../models/Achievement');
const Habit = require('../models/Habit');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/achievements
// @desc    Get all achievements with user progress
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true })
      .sort({ rarity: 1, points: 1 });

    const userAchievements = await UserAchievement.find({ 
      user: req.user.userId 
    }).populate('achievement');

    // Create a map for quick lookup
    const userProgressMap = new Map();
    userAchievements.forEach(ua => {
      userProgressMap.set(ua.achievement._id.toString(), ua);
    });

    const achievementsWithProgress = achievements.map(achievement => {
      const userProgress = userProgressMap.get(achievement._id.toString());
      
      return {
        id: achievement._id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        category: achievement.category,
        criteria: achievement.criteria,
        rarity: achievement.rarity,
        points: achievement.points,
        progress: userProgress ? {
          current: userProgress.progress.current,
          target: userProgress.progress.target,
          percentage: userProgress.progress.percentage,
          isUnlocked: userProgress.isUnlocked,
          unlockedAt: userProgress.unlockedAt
        } : {
          current: 0,
          target: achievement.criteria.target,
          percentage: 0,
          isUnlocked: false,
          unlockedAt: null
        }
      };
    });

    // Group by category
    const groupedAchievements = achievementsWithProgress.reduce((groups, achievement) => {
      const category = achievement.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(achievement);
      return groups;
    }, {});

    // Calculate summary stats
    const totalAchievements = achievements.length;
    const unlockedCount = userAchievements.filter(ua => ua.isUnlocked).length;
    const totalPoints = userAchievements
      .filter(ua => ua.isUnlocked)
      .reduce((sum, ua) => sum + ua.achievement.points, 0);

    res.json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        grouped: groupedAchievements,
        summary: {
          total: totalAchievements,
          unlocked: unlockedCount,
          locked: totalAchievements - unlockedCount,
          totalPoints,
          completionRate: Math.round((unlockedCount / totalAchievements) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/achievements/unlocked
// @desc    Get user's unlocked achievements
// @access  Private
router.get('/unlocked', auth, async (req, res) => {
  try {
    const userAchievements = await UserAchievement.find({ 
      user: req.user.userId,
      isUnlocked: true
    })
    .populate('achievement')
    .sort({ unlockedAt: -1 });

    const unlockedAchievements = userAchievements.map(ua => ({
      id: ua.achievement._id,
      title: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      type: ua.achievement.type,
      category: ua.achievement.category,
      rarity: ua.achievement.rarity,
      points: ua.achievement.points,
      unlockedAt: ua.unlockedAt
    }));

    res.json({
      success: true,
      data: {
        achievements: unlockedAchievements,
        total: unlockedAchievements.length,
        totalPoints: unlockedAchievements.reduce((sum, a) => sum + a.points, 0)
      }
    });

  } catch (error) {
    console.error('Get unlocked achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/achievements/check
// @desc    Check and update achievement progress
// @access  Private
router.post('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const habits = await Habit.find({ user: req.user.userId, isActive: true });
    
    const achievements = await Achievement.find({ isActive: true });
    const newlyUnlocked = [];

    for (const achievement of achievements) {
      let userAchievement = await UserAchievement.findOne({
        user: req.user.userId,
        achievement: achievement._id
      });

      // Create user achievement if doesn't exist
      if (!userAchievement) {
        userAchievement = new UserAchievement({
          user: req.user.userId,
          achievement: achievement._id,
          progress: {
            current: 0,
            target: achievement.criteria.target,
            percentage: 0
          }
        });
      }

      // Skip if already unlocked
      if (userAchievement.isUnlocked) continue;

      // Calculate progress based on achievement type
      let currentProgress = 0;

      switch (achievement.type) {
        case 'streak':
          if (achievement.criteria.condition === 'streak') {
            currentProgress = user.stats.currentStreak;
          }
          break;

        case 'completion':
          if (achievement.criteria.condition === 'total') {
            currentProgress = user.stats.completedHabits;
          }
          break;

        case 'milestone':
          if (achievement.criteria.unit === 'habits') {
            currentProgress = user.stats.totalHabits;
          }
          break;

        case 'consistency':
          // Calculate consistency based on habit completions
          const today = new Date();
          const daysBack = achievement.criteria.target;
          const startDate = new Date(today.setDate(today.getDate() - daysBack));
          
          const consistentDays = habits.filter(habit => {
            const recentCompletions = habit.completions.filter(completion => 
              completion.date >= startDate
            );
            return recentCompletions.length >= daysBack;
          }).length;
          
          currentProgress = consistentDays;
          break;

        case 'variety':
          // Count unique categories
          const uniqueCategories = new Set(habits.map(habit => habit.category));
          currentProgress = uniqueCategories.size;
          break;
      }

      // Update progress
      const wasUnlocked = userAchievement.isUnlocked;
      await userAchievement.updateProgress(currentProgress);
      
      // Check if newly unlocked
      if (!wasUnlocked && userAchievement.isUnlocked) {
        await userAchievement.populate('achievement');
        newlyUnlocked.push({
          id: userAchievement.achievement._id,
          title: userAchievement.achievement.title,
          description: userAchievement.achievement.description,
          icon: userAchievement.achievement.icon,
          rarity: userAchievement.achievement.rarity,
          points: userAchievement.achievement.points,
          unlockedAt: userAchievement.unlockedAt
        });
      }
    }

    res.json({
      success: true,
      message: `Checked achievements. ${newlyUnlocked.length} newly unlocked.`,
      data: {
        newlyUnlocked,
        count: newlyUnlocked.length
      }
    });

  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/achievements/:id
// @desc    Get specific achievement with user progress
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    const userAchievement = await UserAchievement.findOne({
      user: req.user.userId,
      achievement: req.params.id
    });

    const achievementData = {
      id: achievement._id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      category: achievement.category,
      criteria: achievement.criteria,
      rarity: achievement.rarity,
      points: achievement.points,
      progress: userAchievement ? {
        current: userAchievement.progress.current,
        target: userAchievement.progress.target,
        percentage: userAchievement.progress.percentage,
        isUnlocked: userAchievement.isUnlocked,
        unlockedAt: userAchievement.unlockedAt
      } : {
        current: 0,
        target: achievement.criteria.target,
        percentage: 0,
        isUnlocked: false,
        unlockedAt: null
      }
    };

    res.json({
      success: true,
      data: { achievement: achievementData }
    });

  } catch (error) {
    console.error('Get achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/achievements/stats/summary
// @desc    Get achievement statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalAchievements = await Achievement.countDocuments({ isActive: true });
    
    const userAchievements = await UserAchievement.find({ 
      user: req.user.userId 
    }).populate('achievement');

    const unlockedAchievements = userAchievements.filter(ua => ua.isUnlocked);
    
    const achievementsByRarity = unlockedAchievements.reduce((counts, ua) => {
      const rarity = ua.achievement.rarity;
      counts[rarity] = (counts[rarity] || 0) + 1;
      return counts;
    }, {});

    const achievementsByCategory = unlockedAchievements.reduce((counts, ua) => {
      const category = ua.achievement.category;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});

    const totalPoints = unlockedAchievements
      .reduce((sum, ua) => sum + ua.achievement.points, 0);

    // Recent achievements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAchievements = unlockedAchievements
      .filter(ua => ua.unlockedAt >= sevenDaysAgo)
      .map(ua => ({
        id: ua.achievement._id,
        title: ua.achievement.title,
        icon: ua.achievement.icon,
        rarity: ua.achievement.rarity,
        points: ua.achievement.points,
        unlockedAt: ua.unlockedAt
      }));

    res.json({
      success: true,
      data: {
        summary: {
          total: totalAchievements,
          unlocked: unlockedAchievements.length,
          locked: totalAchievements - unlockedAchievements.length,
          completionRate: Math.round((unlockedAchievements.length / totalAchievements) * 100),
          totalPoints
        },
        breakdown: {
          byRarity: achievementsByRarity,
          byCategory: achievementsByCategory
        },
        recent: recentAchievements
      }
    });

  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
