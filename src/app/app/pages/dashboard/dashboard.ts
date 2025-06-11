import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habits } from '../habits/habits';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Habits],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  showHabitForm = false;
}
