import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-reminder-list',
  templateUrl: './reminder-list.html',
  styleUrls: ['./reminder-list.css']
})
export class ReminderListComponent {
  @Input() reminders: { time: string, message: string }[] = [];
}
