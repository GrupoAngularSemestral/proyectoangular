import { Injectable } from '@angular/core';
import { UserData } from '../models/user-data.model';

import { jsPDF } from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class ExportDataService {

  constructor() { }

  exportToCSV(data: UserData, filename: string): void {
    const csvContent = this.convertToCSV(data);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  exportToPDF(data: UserData, filename: string): void {
    const doc = new jsPDF();
    doc.text('Información de salud', 10, 10);
    // Añadir datos a PDF (por hacer)
    doc.save(filename);
  }

  private convertToCSV(data: UserData): string {
    const exercisesCSV = data.exercises.map(e => 
      `Ejercicio,${e.name},${e.durationMinutes},${e.caloriesBurned},${e.date.toISOString()}`
    ).join('\n');

    const waterCSV = data.waterConsumptions.map(w => 
      `Agua,${w.amountLiters},${w.date.toISOString()}`
    ).join('\n');

    return [
      'Tipo,Detalles,Valor,Fecha',
      exercisesCSV,
      waterCSV,
    ].join('\n');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}