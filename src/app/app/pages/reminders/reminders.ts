import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReminderListComponent } from '../../components/reminder-list/reminder-list';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, ReminderListComponent],
  templateUrl: './reminders.html',
  styleUrls: ['./reminders.css']
})
export class RemindersPage {
  reminders = [
    { time: '07:00', message: 'Tomar agua' },
    { time: '21:00', message: 'Prepararte para dormir' },
    { time: '15:00', message: 'Ejercicio diario' }
  ];
}
