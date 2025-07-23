import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  templateUrl: './progress-chart.html',
  styleUrls: ['./progress-chart.css']
})
export class ProgressChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: number[] = [];
  @Input() labels: string[] = [];
  
  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart && (changes['data'] || changes['labels'])) {
      console.log('📈 Actualizando gráfico con nuevos datos:', {
        data: this.data,
        labels: this.labels
      });
      // Usar setTimeout para asegurar que el DOM se actualice primero
      setTimeout(() => this.updateChart(), 0);
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart() {
    const canvas = document.getElementById('progressChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('❌ No se encontró el canvas del gráfico');
      return;
    }

    this.chart = new Chart(canvas, {
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

  private updateChart() {
    if (!this.chart) return;
    
    // Actualizar datos y etiquetas
    this.chart.data.labels = this.labels.length > 0 ? this.labels : this.data.map((_, i) => `Día ${i + 1}`);
    this.chart.data.datasets[0].data = this.data;
    
    // Re-renderizar el gráfico
    this.chart.update('active');
  }
}
