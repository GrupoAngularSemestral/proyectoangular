const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          stats: user.stats,
          completionRate: user.completionRate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
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

    const { name, email } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          stats: user.stats,
          completionRate: user.completionRate,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [auth, [
  body('waterGoal')
    .optional()
    .isFloat({ min: 0.5, max: 10 })
    .withMessage('Water goal must be between 0.5 and 10 liters'),
  body('sleepGoal')
    .optional()
    .isInt({ min: 4, max: 12 })
    .withMessage('Sleep goal must be between 4 and 12 hours'),
  body('exerciseGoal')
    .optional()
    .isInt({ min: 5, max: 300 })
    .withMessage('Exercise goal must be between 5 and 300 minutes'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark')
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

    const user = await User.findById(req.user.userId);
    
    // Update preferences
    Object.assign(user.preferences, req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/stats
// @desc    Update user stats
// @access  Private
router.put('/stats', [auth, [
  body('currentStreak')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current streak must be a non-negative integer'),
  body('longestStreak')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Longest streak must be a non-negative integer'),
  body('totalHabits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total habits must be a non-negative integer'),
  body('completedHabits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Completed habits must be a non-negative integer')
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

    const user = await User.findById(req.user.userId);
    
    // Update stats
    await user.updateStats(req.body);

    res.json({
      success: true,
      message: 'Stats updated successfully',
      data: {
        stats: user.stats,
        completionRate: user.completionRate
      }
    });

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const habits = await Habit.find({ user: req.user.userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate today's completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCompletions = habits.filter(habit => {
      return habit.completions.some(completion => {
        const completionDate = new Date(completion.date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === today.getTime();
      });
    }).length;

    // Calculate this week's progress
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weeklyCompletions = habits.reduce((total, habit) => {
      const weekCompletions = habit.completions.filter(completion =>
        completion.date >= startOfWeek
      );
      return total + weekCompletions.length;
    }, 0);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          stats: user.stats,
          completionRate: user.completionRate
        },
        habits: habits.map(habit => ({
          id: habit._id,
          title: habit.title,
          category: habit.category,
          streak: habit.streak,
          completionRate: habit.completionRate,
          color: habit.color
        })),
        summary: {
          totalHabits: habits.length,
          todayCompletions,
          weeklyCompletions,
          activeStreak: user.stats.currentStreak
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    // Soft delete - mark as inactive
    await User.findByIdAndUpdate(req.user.userId, { isActive: false });
    
    // Also mark user's habits as inactive
    await Habit.updateMany(
      { user: req.user.userId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
