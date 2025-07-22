import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  successMessage = '';

  constructor(private router: Router) {}

  goToHabits() {
    this.router.navigate(['/habits']);
  }

  goToProgress() {
    this.router.navigate(['/progress']);
  }

  goToAchievements() {
    this.router.navigate(['/logros']);
  }
}
