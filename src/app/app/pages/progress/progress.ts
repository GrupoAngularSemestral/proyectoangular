import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressChartComponent } from '../../components/progress-chart/progress-chart';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, ProgressChartComponent],
  templateUrl: './progress.html',
  styleUrls: ['./progress.css']
})
export class ProgressPage {
  weeklyData = [1, 3, 2, 5, 7, 6, 8];
  bestDay = { label: 'Día 7', value: 8 };
  weeklyAverage = 4.57;
  totalProgress = 32;
}
