import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ExportService } from '../../services/export';

interface FiltrosExportacion {
  tipoFiltro: string;
  desde: string | null;
  hasta: string | null;
  incluirHabitos: boolean;
  incluirProgreso: boolean;
  incluirLogros: boolean;
  incluirEstadisticas: boolean;
}

interface VistaPrevia {
  totalHabitos: number;
  totalProgreso: number;
  totalLogros: number;
  porcentajeExito: number;
}

@Component({
  selector: 'app-exportar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exportar.html',
  styleUrl: './exportar.css'
})
export class Exportar implements OnInit, OnDestroy {
  loading = true;
  exportando = false;
  error: string | null = null;
  loadingMessage = '';
  mensajeExito: string | null = null;
  tipoExportacion: string | null = null;

  filtros: FiltrosExportacion = {
    tipoFiltro: 'ultimo-mes',
    desde: null,
    hasta: null,
    incluirHabitos: true,
    incluirProgreso: true,
    incluirLogros: true,
    incluirEstadisticas: true
  };

  vistaPrevia: VistaPrevia | null = null;
  private subscription = new Subscription();

  constructor(private exportService: ExportService) {}

  ngOnInit() {
    this.actualizarFiltroFecha();
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarDatos() {
    this.loading = true;
    this.error = null;
    this.loadingMessage = 'Cargando vista previa de datos...';

    const sub = this.exportService.obtenerEstadisticas(30).subscribe({
      next: (estadisticas) => {
        this.vistaPrevia = {
          totalHabitos: estadisticas.resumen.totalHabitos,
          totalProgreso: estadisticas.resumen.totalProgreso,
          totalLogros: estadisticas.resumen.totalLogros,
          porcentajeExito: parseFloat(estadisticas.resumen.porcentajeExito)
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar vista previa:', error);
        this.error = 'Error al cargar los datos. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });

    this.subscription.add(sub);
  }

  actualizarFiltroFecha() {
    const hoy = new Date();
    
    switch (this.filtros.tipoFiltro) {
      case 'ultimo-mes':
        this.filtros.desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate()).toISOString().split('T')[0];
        this.filtros.hasta = hoy.toISOString().split('T')[0];
        break;
      case 'ultimos-3-meses':
        this.filtros.desde = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate()).toISOString().split('T')[0];
        this.filtros.hasta = hoy.toISOString().split('T')[0];
        break;
      case 'ultimo-semestre':
        this.filtros.desde = new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate()).toISOString().split('T')[0];
        this.filtros.hasta = hoy.toISOString().split('T')[0];
        break;
      case 'todo':
        this.filtros.desde = null;
        this.filtros.hasta = null;
        break;
      case 'personalizado':
        // Mantener los valores actuales
        break;
    }
  }

  get puedeExportar(): boolean {
    return this.filtros.incluirHabitos || 
           this.filtros.incluirProgreso || 
           this.filtros.incluirLogros || 
           this.filtros.incluirEstadisticas;
  }

  private obtenerArrayIncluir(): string[] {
    const incluir: string[] = [];
    if (this.filtros.incluirHabitos) incluir.push('habitos');
    if (this.filtros.incluirProgreso) incluir.push('progreso');
    if (this.filtros.incluirLogros) incluir.push('logros');
    return incluir;
  }

  exportarPDF() {
    this.iniciarExportacion('pdf');
    this.loadingMessage = 'Generando reporte PDF profesional...';

    const sub = this.exportService.generarDatosPDF(30).subscribe({
      next: (datosPDF) => {
        this.generarPDFCliente(datosPDF);
        this.finalizarExportacion('Reporte PDF generado exitosamente');
      },
      error: (error) => {
        console.error('Error al generar PDF:', error);
        this.finalizarExportacion(null, 'Error al generar el reporte PDF');
      }
    });

    this.subscription.add(sub);
  }

  exportarCSV() {
    this.iniciarExportacion('csv');
    this.loadingMessage = 'Preparando datos CSV...';

    this.exportService.descargarCSV(
      this.filtros.desde || undefined,
      this.filtros.hasta || undefined,
      this.obtenerArrayIncluir()
    );

    // Simular un pequeño delay para mostrar el loading
    setTimeout(() => {
      this.finalizarExportacion('Archivo CSV descargado exitosamente');
    }, 1000);
  }

  exportarJSON() {
    this.iniciarExportacion('json');
    this.loadingMessage = 'Preparando datos JSON...';

    this.exportService.descargarJSON(
      this.filtros.desde || undefined,
      this.filtros.hasta || undefined,
      this.obtenerArrayIncluir()
    );

    // Simular un pequeño delay para mostrar el loading
    setTimeout(() => {
      this.finalizarExportacion('Archivo JSON descargado exitosamente');
    }, 1000);
  }

  private iniciarExportacion(tipo: string) {
    this.exportando = true;
    this.tipoExportacion = tipo;
    this.mensajeExito = null;
    this.error = null;
  }

  private finalizarExportacion(mensaje?: string | null, error?: string | null) {
    this.exportando = false;
    this.tipoExportacion = null;
    this.loadingMessage = '';
    
    if (mensaje) {
      this.mensajeExito = mensaje;
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        this.mensajeExito = null;
      }, 5000);
    }
    
    if (error) {
      this.error = error;
      setTimeout(() => {
        this.error = null;
      }, 5000);
    }
  }

  private async generarPDFCliente(datos: any) {
    try {
      // Importar jsPDF dinámicamente
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();

      // Configurar el documento
      pdf.setFontSize(20);
      pdf.text('FitTrack - Reporte de Progreso', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Período: ${datos.periodo}`, 20, 45);
      pdf.text(`Fecha de generación: ${datos.fecha}`, 20, 55);

      // Resumen estadísticas
      pdf.setFontSize(16);
      pdf.text('Resumen General', 20, 75);
      
      pdf.setFontSize(12);
      const resumen = datos.resumen;
      pdf.text(`Total de hábitos: ${resumen.totalHabitos}`, 30, 90);
      pdf.text(`Registros de progreso: ${resumen.totalProgreso}`, 30, 100);
      pdf.text(`Metas completadas: ${resumen.metasCompletadas}`, 30, 110);
      pdf.text(`Logros obtenidos: ${resumen.totalLogros}`, 30, 120);
      pdf.text(`Porcentaje de éxito: ${resumen.porcentajeExito}%`, 30, 130);

      // Detalles por tipo
      let yPosition = 150;
      if (datos.detallesPorTipo && datos.detallesPorTipo.length > 0) {
        pdf.setFontSize(16);
        pdf.text('Estadísticas por Tipo de Hábito', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        datos.detallesPorTipo.forEach((tipo: any) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${tipo.tipo}: ${tipo.total} hábitos`, 30, yPosition);
          yPosition += 10;
        });
      }

      // Recomendaciones
      if (datos.recomendaciones && datos.recomendaciones.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        } else {
          yPosition += 20;
        }

        pdf.setFontSize(16);
        pdf.text('Recomendaciones', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        datos.recomendaciones.forEach((recomendacion: string) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          // Dividir texto largo en múltiples líneas
          const lineas = pdf.splitTextToSize(`• ${recomendacion}`, 170);
          lineas.forEach((linea: string) => {
            pdf.text(linea, 30, yPosition);
            yPosition += 7;
          });
          yPosition += 3;
        });
      }

      // Generar nombre de archivo
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const nombreArchivo = `fittrack_reporte_${fechaArchivo}.pdf`;

      // Descargar el PDF
      pdf.save(nombreArchivo);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw new Error('Error al generar el archivo PDF');
    }
  }
}
