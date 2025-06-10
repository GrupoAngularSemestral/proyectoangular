import { Injectable } from '@angular/core';
import { UserData, Goal } from '../models/user-data.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private userData: UserData = {
    exercises: [],
    waterConsumptions: [],
    sleepRecords: [],
    reminders: [],
    achievements: [],
    goals: []
  };

  constructor() { }

  // Create a new goal
  addGoal(goal: Omit<Goal, 'id' | 'isCompleted' | 'currentValue'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      currentValue: 0,
      isCompleted: false
    };
    this.userData.goals.push(newGoal);
    return newGoal;
  }

  // Get all goals
  getGoals(): Goal[] {
    return [...this.userData.goals];
  }

  // Update goal progress
  updateGoalProgress(goalId: string, increment: number): Goal | null {
    const goal = this.userData.goals.find(g => g.id === goalId);
    if (!goal) return null;

    goal.currentValue += increment;
    goal.isCompleted = goal.currentValue >= goal.targetValue;
    return {...goal};
  }

  // Delete a goal
  deleteGoal(goalId: string): boolean {
    const index = this.userData.goals.findIndex(g => g.id === goalId);
    if (index === -1) return false;
    
    this.userData.goals.splice(index, 1);
    return true;
  }

  // Helper to generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}