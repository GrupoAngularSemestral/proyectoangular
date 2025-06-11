import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit';
import { Habit as HabitModel } from '../../../models/habit.model';

@Component({
  selector: 'app-habits',
  imports: [CommonModule, FormsModule],
  templateUrl: './habits.html',
  styleUrl: './habits.css'
})
export class Habits implements OnInit {
  habits: HabitModel[] = [];
  newHabit: Partial<HabitModel> = {
    name: '',
    type: 'custom',
    goal: 1,
    unit: '',
    frequency: 'daily',
    reminderEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  constructor(private habitService: HabitService) {}

  ngOnInit() {
    this.habits = this.habitService.getHabits();
  }

  addHabit() {
    const habit: HabitModel = {
      ...this.newHabit,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as HabitModel;
    this.habitService.addHabit(habit);
    this.habits = this.habitService.getHabits();
    this.newHabit = {
      name: '',
      type: 'custom',
      goal: 1,
      unit: '',
      frequency: 'daily',
      reminderEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
