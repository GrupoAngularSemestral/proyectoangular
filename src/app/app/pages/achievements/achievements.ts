import { Component } from '@angular/core';

@Component({
  selector: 'app-archivements',
  templateUrl: './achievements.html',
  styleUrls: ['./achievements.css']
})
export class ArchivementsPage {
  badges = [
    { title: '7 días seguidos', icon: 'calendar_today', unlocked: true },
    { title: 'Primer mes', icon: 'star', unlocked: false },
    { title: 'Sin saltos', icon: 'check_circle', unlocked: true }
  ];
}
