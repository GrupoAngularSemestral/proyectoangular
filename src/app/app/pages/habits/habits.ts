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
  editingHabitId: string | null = null;

  constructor(private habitService: HabitService) {}

  ngOnInit() {
    this.habits = this.habitService.getHabits();
  }

  addHabit() {
    if (this.editingHabitId) {
      // Guardar edición
      this.habitService.updateHabit(this.editingHabitId, {
        ...this.newHabit,
        updatedAt: new Date()
      });
      this.editingHabitId = null;
    } else {
      // Agregar nuevo hábito
      const habit: HabitModel = {
        ...this.newHabit,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as HabitModel;
      this.habitService.addHabit(habit);
    }
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

  editHabit(habit: HabitModel) {
    this.editingHabitId = habit.id;
    this.newHabit = { ...habit };
  }

  deleteHabit(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este hábito?')) {
      this.habitService.deleteHabit(id);
      this.habits = this.habitService.getHabits();
      if (this.editingHabitId === id) {
        this.editingHabitId = null;
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
  }
}
