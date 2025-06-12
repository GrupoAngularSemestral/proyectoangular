import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-export-modal',
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
