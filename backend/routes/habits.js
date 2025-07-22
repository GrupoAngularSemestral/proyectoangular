const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Habit = require('../models/Habit');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/habits
// @desc    Get all user habits
// @access  Public (temporarily for demo)
router.get('/', [
  query('category')
    .optional()
    .isIn(['exercise', 'nutrition', 'sleep', 'mindfulness', 'productivity', 'health', 'learning', 'social'])
    .withMessage('Invalid category'),
  query('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid frequency'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category, frequency, active = true } = req.query;
    
    // Get demo user for now
    const demoUser = await User.findOne({ email: 'demo@fittrack.com' });
    if (!demoUser) {
      return res.status(404).json({
        success: false,
        message: 'Demo user not found'
      });
    }
    
    // Build filter
    const filter = { 
      user: demoUser._id,
      isActive: active === 'true'
    };
    
    if (category) filter.category = category;
    if (frequency) filter.frequency = frequency;

    const habits = await Habit.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        habits: habits.map(habit => ({
          id: habit._id,
          title: habit.title,
          description: habit.description,
          category: habit.category,
          frequency: habit.frequency,
          target: habit.target,
          streak: habit.streak,
          completionRate: habit.completionRate,
          totalCompletions: habit.totalCompletions,
          reminders: habit.reminders,
          color: habit.color,
          isActive: habit.isActive,
          createdAt: habit.createdAt,
          updatedAt: habit.updatedAt
        })),
        total: habits.length
      }
    });

  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/habits/:id
// @desc    Get single habit
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    res.json({
      success: true,
      data: {
        habit: {
          id: habit._id,
          title: habit.title,
          description: habit.description,
          category: habit.category,
          frequency: habit.frequency,
          target: habit.target,
          streak: habit.streak,
          completionRate: habit.completionRate,
          totalCompletions: habit.totalCompletions,
          completions: habit.completions,
          reminders: habit.reminders,
          color: habit.color,
          isActive: habit.isActive,
          createdAt: habit.createdAt,
          updatedAt: habit.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/habits
// @desc    Create new habit
// @access  Public (demo)
router.post('/', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['exercise', 'nutrition', 'sleep', 'mindfulness', 'productivity', 'health', 'learning', 'social'])
    .withMessage('Invalid category'),
  body('type')
    .optional()
    .isIn(['exercise', 'nutrition', 'sleep', 'mindfulness', 'productivity', 'health', 'learning', 'social', 'custom', 'water'])
    .withMessage('Invalid type'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid frequency'),
  body('goal')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Goal must be a positive integer'),
  body('target.value')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Target value must be a positive integer'),
  body('target.unit')
    .optional()
    .isIn(['times', 'minutes', 'hours', 'glasses', 'pages', 'kilometers', 'steps'])
    .withMessage('Invalid target unit'),
  body('unit')
    .optional()
    .isString()
    .withMessage('Unit must be a string'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get or create demo user
    let demoUser = await User.findOne({ email: 'demo@fittrack.com' });
    if (!demoUser) {
      demoUser = new User({
        name: 'Usuario Demo',
        email: 'demo@fittrack.com',
        password: 'demo123' // No real password needed
      });
      await demoUser.save();
    }

    // Create habit data - support both frontend formats
    const habitData = {
      title: req.body.title || req.body.name,
      description: req.body.description || '',
      category: req.body.category || req.body.type || 'custom',
      frequency: req.body.frequency || 'daily',
      target: req.body.target || {
        value: req.body.goal || 1,
        unit: req.body.unit || 'times'
      },
      color: req.body.color || '#3B82F6',
      user: demoUser._id
    };

    const habit = new Habit(habitData);
    await habit.save();

    // Update user stats
    const user = await User.findById(demoUser._id);
    await user.updateStats({ 
      totalHabits: user.stats.totalHabits + 1 
    });

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: {
        habit: {
          id: habit._id,
          title: habit.title,
          description: habit.description,
          category: habit.category,
          frequency: habit.frequency,
          target: habit.target,
          streak: habit.streak,
          color: habit.color,
          createdAt: habit.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/habits/:id
// @desc    Update habit
// @access  Private
router.put('/:id', [auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['exercise', 'nutrition', 'sleep', 'mindfulness', 'productivity', 'health', 'learning', 'social'])
    .withMessage('Invalid category'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid frequency'),
  body('target.value')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Target value must be a positive integer'),
  body('target.unit')
    .optional()
    .isIn(['times', 'minutes', 'hours', 'glasses', 'pages', 'kilometers', 'steps'])
    .withMessage('Invalid target unit'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color')
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

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    res.json({
      success: true,
      message: 'Habit updated successfully',
      data: {
        habit: {
          id: habit._id,
          title: habit.title,
          description: habit.description,
          category: habit.category,
          frequency: habit.frequency,
          target: habit.target,
          streak: habit.streak,
          color: habit.color,
          updatedAt: habit.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/habits/:id/complete
// @desc    Mark habit as completed for today
// @access  Private
router.post('/:id/complete', [auth, [
  body('value')
    .isInt({ min: 1 })
    .withMessage('Value must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
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

    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const { value, notes = '' } = req.body;

    try {
      await habit.addCompletion(value, notes);
      
      // Update user stats
      const user = await User.findById(req.user.userId);
      await user.updateStats({ 
        completedHabits: user.stats.completedHabits + 1 
      });

      res.json({
        success: true,
        message: 'Habit completed successfully',
        data: {
          habit: {
            id: habit._id,
            streak: habit.streak,
            completionRate: habit.completionRate,
            totalCompletions: habit.totalCompletions
          }
        }
      });

    } catch (completionError) {
      res.status(400).json({
        success: false,
        message: completionError.message
      });
    }

  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete habit (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { isActive: false },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Update user stats
    const user = await User.findById(req.user.userId);
    await user.updateStats({ 
      totalHabits: Math.max(0, user.stats.totalHabits - 1) 
    });

    res.json({
      success: true,
      message: 'Habit deleted successfully'
    });

  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/habits/:id/stats
// @desc    Get habit statistics
// @access  Private
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Calculate weekly progress
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const weeklyCompletions = habit.completions.filter(completion => 
      completion.date >= startOfWeek
    );

    // Calculate monthly progress
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyCompletions = habit.completions.filter(completion => 
      completion.date >= startOfMonth
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalCompletions: habit.totalCompletions,
          currentStreak: habit.streak.current,
          longestStreak: habit.streak.longest,
          completionRate: habit.completionRate,
          weeklyCompletions: weeklyCompletions.length,
          monthlyCompletions: monthlyCompletions.length,
          lastCompleted: habit.streak.lastCompletedDate,
          recentCompletions: habit.completions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7)
        }
      }
    });

  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
