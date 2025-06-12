import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-modal',
  imports: [CommonModule],
  templateUrl: './export-modal.html',
  styleUrls: ['./export-modal.css']
})
export class ExportModalComponent {
  @Input() show: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  exportData() {
    // Lógica para exportar datos
    console.log("Exportando...");
  }

  close() {
    this.closeModal.emit();
  }
}
