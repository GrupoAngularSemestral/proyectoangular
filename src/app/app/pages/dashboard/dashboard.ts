import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit';
import { Habit as HabitModel } from '../../../models/habit.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  showHabitForm = false;
  successMessage = '';
  newHabit: Partial<HabitModel> = {
    name: '',
    type: 'custom',
    goal: 1,
    unit: '',
    frequency: 'daily',
    reminderEnabled: false,
    reminderTime: ''
  };

  constructor(private habitService: HabitService) {}

  addHabit() {
    // Agregar el hábito usando el servicio compartido
    const habit: HabitModel = {
      ...this.newHabit,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as HabitModel;
    this.habitService.addHabit(habit);
    // Mostrar mensaje de éxito
    this.successMessage = '¡Hábito agregado con éxito!';
    setTimeout(() => {
      this.successMessage = '';
    }, 2500);
    // Resetear el formulario
    this.newHabit = {
      name: '',
      type: 'custom',
      goal: 1,
      unit: '',
      frequency: 'daily',
      reminderEnabled: false,
      reminderTime: ''
    };
    this.showHabitForm = false;
  }
}
