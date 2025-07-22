import { Component, Input, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-progress-chart',
  templateUrl: './progress-chart.html',
  styleUrls: ['./progress-chart.css']
})
export class ProgressChartComponent implements AfterViewInit {
  @Input() data: number[] = [];
  @Input() labels: string[] = [];

  ngAfterViewInit() {
    new Chart('progressChart', {
      type: 'line',
      data: {
        labels: this.labels.length > 0 ? this.labels : this.data.map((_, i) => `Día ${i + 1}`),
        datasets: [{
          label: 'Progreso',
          data: this.data,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}
