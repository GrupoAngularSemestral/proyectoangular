import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-habit-card',
  templateUrl: './habit-card.html',
  styleUrls: ['./habit-card.css']
})
export class HabitCardComponent {
  @Input() habitName: string = '';
  @Input() streak: number = 0;
  @Input() completedToday: boolean = false;

  toggleComplete() {
    this.completedToday = !this.completedToday;
  }
}
