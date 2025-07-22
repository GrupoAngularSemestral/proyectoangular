import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReminderConfig } from '../../services/notification';

@Component({
  selector: 'app-reminder-list',
  imports: [CommonModule],
  templateUrl: './reminder-list.html',
  styleUrls: ['./reminder-list.css']
})
export class ReminderListComponent {
  @Input() reminders: ReminderConfig[] = [];
  @Output() editReminder = new EventEmitter<ReminderConfig>();
  @Output() deleteReminder = new EventEmitter<string>();
  @Output() toggleReminder = new EventEmitter<string>();

  onEditReminder(reminder: ReminderConfig) {
    this.editReminder.emit(reminder);
  }

  onDeleteReminder(reminderId: string) {
    this.deleteReminder.emit(reminderId);
  }

  onToggleReminder(reminderId: string) {
    this.toggleReminder.emit(reminderId);
  }

  getDaysText(days: number[]): string {
    if (days.length === 7) return 'Todos los días';
    if (days.length === 0) return 'Ningún día';
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days
      .sort()
      .map(day => dayNames[day])
      .join(', ');
  }
}
