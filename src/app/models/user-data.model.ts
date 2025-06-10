export interface Exercise {
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  date: Date;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  category: 'exercise' | 'water' | 'sleep' | 'reminder' | 'achievement' | 'custom';
  isCompleted: boolean;
  icon?: string;
}
  
export interface WaterConsumption {
  amountLiters: number;
  date: Date;
}

export interface SleepRecord {
  hoursSlept: number;
  date: Date;
}

export interface Reminder {
  title: string;
  dueDate: Date;
  completed: boolean;
}

export interface Achievement {
  name: string;
  description: string;
  earnedOn: Date;
  icon?: string;
}

export interface UserData {
  exercises: Exercise[];
  waterConsumptions: WaterConsumption[];
  sleepRecords: SleepRecord[];
  reminders: Reminder[];
  achievements: Achievement[];
  goals: Goal[];
}