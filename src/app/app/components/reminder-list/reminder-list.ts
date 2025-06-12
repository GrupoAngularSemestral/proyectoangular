import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reminder-list',
  imports: [CommonModule],
  templateUrl: './reminder-list.html',
  styleUrls: ['./reminder-list.css']
})
export class ReminderListComponent {
  @Input() reminders: { time: string, message: string }[] = [];
}
