import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HabitService } from '../../services/habit';
import { Habit as HabitModel } from '../../../models/habit.model';

@Component({
  selector: 'app-habits',
  imports: [CommonModule, FormsModule],
  templateUrl: './habits.html',
  styleUrl: './habits.css'
})
export class Habits implements OnInit, OnDestroy {
  habits: HabitModel[] = [];
  private subscription = new Subscription();
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
    console.log('🚀 Habits component initialized');
    this.loadHabits();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadHabits() {
    console.log('🔄 Loading habits...');
    this.subscription.add(
      this.habitService.getHabits().subscribe({
        next: (habits: HabitModel[]) => {
          console.log('✅ Habits loaded:', habits);
          this.habits = habits;
        },
        error: (error: any) => {
          console.error('❌ Error loading habits:', error);
        }
      })
    );
  }

  addHabit() {
    if (!this.newHabit.name?.trim()) return;

    console.log('➕ Adding new habit:', this.newHabit);
    
    // Create a complete habit object
    const habitToAdd = {
      name: this.newHabit.name!,
      type: this.newHabit.type || 'custom',
      goal: this.newHabit.goal || 1,
      unit: this.newHabit.unit || '',
      frequency: this.newHabit.frequency || 'daily',
      reminderEnabled: this.newHabit.reminderEnabled || false,
      reminderTime: this.newHabit.reminderTime || ''
    };
    
    this.subscription.add(
      this.habitService.addHabit(habitToAdd).subscribe({
        next: (habit: HabitModel) => {
          console.log('✅ Habit added successfully:', habit);
          this.resetForm();
          this.loadHabits(); // Reload to get fresh data
        },
        error: (error: any) => {
          console.error('❌ Error adding habit:', error);
        }
      })
    );
  }

  editHabit(habit: HabitModel) {
    this.editingHabitId = habit.id;
    this.newHabit = { ...habit };
  }

  updateHabit() {
    if (!this.editingHabitId || !this.newHabit.name?.trim()) return;

    console.log('📝 Updating habit:', this.editingHabitId, this.newHabit);
    
    // Create a complete habit object for update
    const habitToUpdate = {
      name: this.newHabit.name!,
      type: this.newHabit.type || 'custom',
      goal: this.newHabit.goal || 1,
      unit: this.newHabit.unit || '',
      frequency: this.newHabit.frequency || 'daily',
      reminderEnabled: this.newHabit.reminderEnabled || false,
      reminderTime: this.newHabit.reminderTime || ''
    };
    
    this.subscription.add(
      this.habitService.updateHabit(this.editingHabitId, habitToUpdate).subscribe({
        next: (habit: HabitModel) => {
          console.log('✅ Habit updated successfully:', habit);
          this.resetForm();
          this.loadHabits(); // Reload to get fresh data
        },
        error: (error: any) => {
          console.error('❌ Error updating habit:', error);
        }
      })
    );
  }

  deleteHabit(habitId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este hábito?')) return;

    console.log('🗑️ Deleting habit:', habitId);
    
    this.subscription.add(
      this.habitService.deleteHabit(habitId).subscribe({
        next: () => {
          console.log('✅ Habit deleted successfully');
          this.loadHabits(); // Reload to get fresh data
        },
        error: (error: any) => {
          console.error('❌ Error deleting habit:', error);
        }
      })
    );
  }

  resetForm() {
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
    this.editingHabitId = null;
  }
}
