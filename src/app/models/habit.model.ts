export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: 'exercise' | 'water' | 'sleep' | 'custom';
  goal: number; // e.g., minutes, glasses, hours, etc.
  unit: string; // e.g., 'minutes', 'glasses', 'hours', etc.
  frequency: 'daily' | 'weekly' | 'custom';
  reminderEnabled: boolean;
  reminderTime?: string; // e.g., '08:00'
  repeatDays?: string[]; // e.g., ['Monday', 'Wednesday']
  
  // Progress tracking
  completions?: string[]; // Array of date strings (YYYY-MM-DD format)
  currentStreak?: number;
  longestStreak?: number;
  
  // Categories and tags
  category?: string;
  tags?: string[];
  
  // User association
  userId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
