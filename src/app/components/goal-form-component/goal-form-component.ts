import { Component, EventEmitter, Output } from '@angular/core';
import { Goal } from '../../models/user-data.model';
import { GoalService } from '../../services/goal-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-goal-form',
  templateUrl: './goal-form-component.html',
  styleUrls: ['./goal-form-component.css'],
  imports: [ CommonModule, FormsModule ]
})
export class GoalFormComponent {
  categories: Goal['category'][] = [
    'exercise', 'water', 'sleep', 'reminder', 'achievement', 'custom'
  ];
  
  newGoal: Omit<Goal, 'id' | 'isCompleted' | 'currentValue'> = {
    title: '',
    description: '',
    targetValue: 0,
    startDate: new Date(),
    endDate: new Date(),
    category: 'custom'
  };

  @Output() goalAdded = new EventEmitter<Goal>();

  constructor(private goalService: GoalService) {}

  onSubmit(): void {
    const addedGoal = this.goalService.addGoal(this.newGoal);
    this.goalAdded.emit(addedGoal);
    this.resetForm();
  }

  private resetForm(): void {
    this.newGoal = {
      title: '',
      description: '',
      targetValue: 0,
      startDate: new Date(),
      endDate: new Date(),
      category: 'custom'
    };
  }
}