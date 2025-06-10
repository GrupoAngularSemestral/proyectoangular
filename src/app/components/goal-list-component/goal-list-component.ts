import { Component, OnInit } from '@angular/core';
import { GoalService } from '../../services/goal-service';
import { Goal } from '../../models/user-data.model';

@Component({
  selector: 'app-goal-list',
  templateUrl: './goal-list.component.html',
  styleUrls: ['./goal-list.component.css']
})
export class GoalListComponent implements OnInit {
  goals: Goal[] = [];

  constructor(private goalService: GoalService) {}

  ngOnInit(): void {
    this.goals = this.goalService.getGoals();
  }

  deleteGoal(goalId: string): void {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.goalService.deleteGoal(goalId);
      this.goals = this.goalService.getGoals();
    }
  }
}