import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-archivements-badge',
  templateUrl: './achievement-badge.html',
  styleUrls: ['./achievement-badge.css']
})
export class ArchivementsBadgeComponent {
  @Input() title: string = 'Achievement';
}
