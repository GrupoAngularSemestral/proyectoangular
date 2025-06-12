import { Component } from '@angular/core';

@Component({
  selector: 'app-reminders',
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
