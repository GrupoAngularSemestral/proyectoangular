export interface Habit {
  id: string;
  name: string;
  type: 'exercise' | 'water' | 'sleep' | 'custom';
  goal: number; // e.g., minutes, glasses, hours, etc.
  unit: string; // e.g., 'minutes', 'glasses', 'hours', etc.
  frequency: 'daily' | 'weekly' | 'custom';
  reminderEnabled: boolean;
  reminderTime?: string; // e.g., '08:00'
  repeatDays?: string[]; // e.g., ['Monday', 'Wednesday']
  createdAt: Date;
  updatedAt: Date;
  // Campos para el progreso
  completions?: ProgressEntry[];
  completedDates?: string[];
}

export interface ProgressEntry {
  id?: string;
  date: string;
  value: number;
  notes?: string;
  completed: boolean;
}
