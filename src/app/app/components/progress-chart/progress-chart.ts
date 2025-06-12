import { Component, Input, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-progress-chart',
  templateUrl: './progress-chart.html',
  styleUrls: ['./progress-chart.css']
})
export class ProgressChartComponent implements AfterViewInit {
  @Input() data: number[] = [];

  ngAfterViewInit() {
    new Chart('progressChart', {
      type: 'line',
      data: {
        labels: this.data.map((_, i) => `Día ${i + 1}`),
        datasets: [{
          label: 'Progreso',
          data: this.data,
          borderColor: '#3f51b5',
          fill: false,
        }]
      }
    });
  }
}
