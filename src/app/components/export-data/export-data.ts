import { Component } from '@angular/core';
import { ExportDataService } from '../../services/export-data';
import { UserData } from '../../models/user-data.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-export-data',
  templateUrl: './export-data.html',
  imports: [MatIconModule]
})
export class ExportData {
  // Data de ejemplo (para rellenar por ahora)
  mockUserData: UserData = {
    exercises: [
      { name: 'Trote', durationMinutes: 30, caloriesBurned: 250, date: new Date() }
    ],
    waterConsumptions: [
      { amountLiters: 2, date: new Date() }
    ],
    sleepRecords: [],
    reminders: [],
    achievements: [],
    goals: []
  };

  constructor(private exportService: ExportDataService) {}

  exportCSV(): void {
    this.exportService.exportToCSV(this.mockUserData, 'fitness-data.csv');
  }

  exportPDF(): void {
    // TODO: Implement PDF export
    console.log('¡Exportar a PDF bajo desarrollo!');
    this.exportService.exportToPDF(this.mockUserData, 'fitness-data.pdf')
  }
}