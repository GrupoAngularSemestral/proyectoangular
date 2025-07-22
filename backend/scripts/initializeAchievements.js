const { sequelize } = require('../config/database');
const { Achievement } = require('../models/Achievement');
require('dotenv').config();

const defaultAchievements = [
  // Streak Achievements
  {
    title: "First Steps",
    description: "Complete your first habit",
    icon: "🎯",
    type: "completion",
    category: "general",
    criteria: { target: 1, unit: "completions", condition: "total" },
    rarity: "common",
    points: 10
  },
  {
    title: "Getting Started",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    type: "streak",
    category: "general",
    criteria: { target: 3, unit: "days", condition: "streak" },
    rarity: "common",
    points: 25
  },
  {
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    type: "streak",
    category: "general",
    criteria: { target: 7, unit: "days", condition: "streak" },
    rarity: "rare",
    points: 50
  },
  {
    title: "Consistency Champion",
    description: "Maintain a 30-day streak",
    icon: "👑",
    type: "streak",
    category: "general",
    criteria: { target: 30, unit: "days", condition: "streak" },
    rarity: "epic",
    points: 150
  },
  {
    title: "Legendary Streaker",
    description: "Maintain a 100-day streak",
    icon: "🏆",
    type: "streak",
    category: "general",
    criteria: { target: 100, unit: "days", condition: "streak" },
    rarity: "legendary",
    points: 500
  },

  // Exercise Achievements
  {
    title: "Workout Warrior",
    description: "Complete 10 exercise habits",
    icon: "💪",
    type: "completion",
    category: "exercise",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },
  {
    title: "Fitness Enthusiast",
    description: "Complete 50 exercise habits",
    icon: "🏋️",
    type: "completion",
    category: "exercise",
    criteria: { target: 50, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 100
  },
  {
    title: "Athletic Champion",
    description: "Complete 100 exercise habits",
    icon: "🥇",
    type: "completion",
    category: "exercise",
    criteria: { target: 100, unit: "completions", condition: "total" },
    rarity: "epic",
    points: 200
  },

  // Nutrition Achievements
  {
    title: "Healthy Eater",
    description: "Complete 10 nutrition habits",
    icon: "🥗",
    type: "completion",
    category: "nutrition",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },
  {
    title: "Nutrition Expert",
    description: "Complete 50 nutrition habits",
    icon: "🍎",
    type: "completion",
    category: "nutrition",
    criteria: { target: 50, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 100
  },

  // Sleep Achievements
  {
    title: "Good Sleeper",
    description: "Complete 10 sleep habits",
    icon: "😴",
    type: "completion",
    category: "sleep",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },
  {
    title: "Sleep Master",
    description: "Complete 30 sleep habits",
    icon: "🌙",
    type: "completion",
    category: "sleep",
    criteria: { target: 30, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 80
  },

  // Mindfulness Achievements
  {
    title: "Mindful Beginner",
    description: "Complete 5 mindfulness habits",
    icon: "🧘",
    type: "completion",
    category: "mindfulness",
    criteria: { target: 5, unit: "completions", condition: "total" },
    rarity: "common",
    points: 25
  },
  {
    title: "Zen Master",
    description: "Complete 50 mindfulness habits",
    icon: "☯️",
    type: "completion",
    category: "mindfulness",
    criteria: { target: 50, unit: "completions", condition: "total" },
    rarity: "epic",
    points: 150
  },

  // Variety Achievements
  {
    title: "Well Rounded",
    description: "Create habits in 3 different categories",
    icon: "🌈",
    type: "variety",
    category: "general",
    criteria: { target: 3, unit: "habits", condition: "variety" },
    rarity: "common",
    points: 40
  },
  {
    title: "Renaissance Person",
    description: "Create habits in 5 different categories",
    icon: "🎨",
    type: "variety",
    category: "general",
    criteria: { target: 5, unit: "habits", condition: "variety" },
    rarity: "rare",
    points: 75
  },
  {
    title: "Master of All",
    description: "Create habits in all 8 categories",
    icon: "🎭",
    type: "variety",
    category: "general",
    criteria: { target: 8, unit: "habits", condition: "variety" },
    rarity: "legendary",
    points: 300
  },

  // Milestone Achievements
  {
    title: "Habit Creator",
    description: "Create 5 habits",
    icon: "📝",
    type: "milestone",
    category: "general",
    criteria: { target: 5, unit: "habits", condition: "total" },
    rarity: "common",
    points: 20
  },
  {
    title: "Habit Architect",
    description: "Create 15 habits",
    icon: "🏗️",
    type: "milestone",
    category: "general",
    criteria: { target: 15, unit: "habits", condition: "total" },
    rarity: "rare",
    points: 60
  },
  {
    title: "Habit Master",
    description: "Create 30 habits",
    icon: "🎯",
    type: "milestone",
    category: "general",
    criteria: { target: 30, unit: "habits", condition: "total" },
    rarity: "epic",
    points: 120
  },

  // Completion Achievements
  {
    title: "Century Club",
    description: "Complete 100 total habits",
    icon: "💯",
    type: "completion",
    category: "general",
    criteria: { target: 100, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 100
  },
  {
    title: "Half Thousand",
    description: "Complete 500 total habits",
    icon: "🚀",
    type: "completion",
    category: "general",
    criteria: { target: 500, unit: "completions", condition: "total" },
    rarity: "epic",
    points: 250
  },
  {
    title: "Thousand Strong",
    description: "Complete 1000 total habits",
    icon: "⭐",
    type: "completion",
    category: "general",
    criteria: { target: 1000, unit: "completions", condition: "total" },
    rarity: "legendary",
    points: 500
  },

  // Productivity Achievements
  {
    title: "Productive Start",
    description: "Complete 10 productivity habits",
    icon: "⚙️",
    type: "completion",
    category: "productivity",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },
  {
    title: "Efficiency Expert",
    description: "Complete 50 productivity habits",
    icon: "📈",
    type: "completion",
    category: "productivity",
    criteria: { target: 50, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 100
  },

  // Learning Achievements
  {
    title: "Knowledge Seeker",
    description: "Complete 10 learning habits",
    icon: "📚",
    type: "completion",
    category: "learning",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },
  {
    title: "Scholar",
    description: "Complete 50 learning habits",
    icon: "🎓",
    type: "completion",
    category: "learning",
    criteria: { target: 50, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 100
  },

  // Social Achievements
  {
    title: "Social Butterfly",
    description: "Complete 10 social habits",
    icon: "🦋",
    type: "completion",
    category: "social",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },

  // Health Achievements
  {
    title: "Health Conscious",
    description: "Complete 10 health habits",
    icon: "❤️",
    type: "completion",
    category: "health",
    criteria: { target: 10, unit: "completions", condition: "total" },
    rarity: "common",
    points: 30
  },
  {
    title: "Wellness Warrior",
    description: "Complete 50 health habits",
    icon: "🩺",
    type: "completion",
    category: "health",
    criteria: { target: 50, unit: "completions", condition: "total" },
    rarity: "rare",
    points: 100
  }
];

async function initializeAchievements() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');

    // Clear existing achievements
    await Achievement.destroy({ where: {} });
    console.log('🗑️ Cleared existing achievements');

    // Insert default achievements
    const insertedAchievements = await Achievement.bulkCreate(defaultAchievements);
    console.log(`🏆 Inserted ${insertedAchievements.length} achievements`);

    // Display summary
    const achievementsByRarity = insertedAchievements.reduce((counts, achievement) => {
      counts[achievement.rarity] = (counts[achievement.rarity] || 0) + 1;
      return counts;
    }, {});

    console.log('\n📊 Achievement Summary:');
    Object.entries(achievementsByRarity).forEach(([rarity, count]) => {
      console.log(`   ${rarity}: ${count} achievements`);
    });

    console.log('\n🎯 Achievement Categories:');
    const achievementsByCategory = insertedAchievements.reduce((counts, achievement) => {
      counts[achievement.category] = (counts[achievement.category] || 0) + 1;
      return counts;
    }, {});

    Object.entries(achievementsByCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} achievements`);
    });

    console.log('\n✨ PostgreSQL database initialization completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error initializing achievements:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeAchievements();
