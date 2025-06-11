import { Injectable } from '@angular/core';
import { Habit as HabitModel } from '../../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habits: HabitModel[] = [];

  constructor() { }

  getHabits(): HabitModel[] {
    return this.habits;
  }

  addHabit(habit: HabitModel): void {
    this.habits.push(habit);
  }

  updateHabit(id: string, updatedHabit: Partial<HabitModel>): void {
    const index = this.habits.findIndex(h => h.id === id);
    if (index !== -1) {
      this.habits[index] = { ...this.habits[index], ...updatedHabit, updatedAt: new Date() };
    }
  }

  deleteHabit(id: string): void {
    this.habits = this.habits.filter(h => h.id !== id);
  }
}
