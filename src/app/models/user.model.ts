export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  waterGoal: number; // liters
  sleepGoal: number; // hours
  exerciseGoal: number; // minutes
  notifications: boolean;
  theme: 'light' | 'dark';
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalHabits: number;
  completedHabits: number;
}