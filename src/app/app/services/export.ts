import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DatosExportacion {
  fechaExportacion: Date;
  rangoFechas: {
    desde: string | null;
    hasta: string | null;
  };
  habitos?: any[];
  progreso?: any[];
  logros?: any[];
}

export interface EstadisticasGenerales {
  resumen: {
    totalHabitos: number;
    totalProgreso: number;
    metasCompletadas: number;
    totalLogros: number;
    porcentajeExito: string;
  };
  estadisticasPorTipo: any[];
  progresoSemanal: any[];
  periodo: string;
  fechaGeneracion: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private apiUrl = 'http://localhost:5000/api/exportacion';

  constructor(private http: HttpClient) {}

  // Exportar datos en formato JSON
  exportarDatosJSON(desde?: string, hasta?: string, incluir: string[] = ['habitos', 'progreso', 'logros']): Observable<DatosExportacion> {
    let url = `${this.apiUrl}/datos?formato=json`;
    
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    if (incluir.length > 0) {
      incluir.forEach(item => url += `&incluir=${item}`);
    }

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.exito) {
          return response.datos;
        }
        throw new Error(response.mensaje || 'Error al exportar datos');
      })
    );
  }

  // Exportar datos en formato CSV
  exportarDatosCSV(desde?: string, hasta?: string, incluir: string[] = ['habitos', 'progreso', 'logros']): Observable<Blob> {
    let url = `${this.apiUrl}/datos?formato=csv`;
    
    if (desde) url += `&desde=${desde}`;
    if (hasta) url += `&hasta=${hasta}`;
    if (incluir.length > 0) {
      incluir.forEach(item => url += `&incluir=${item}`);
    }

    return this.http.get(url, { 
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
  }

  // Obtener estadísticas generales
  obtenerEstadisticas(periodo: number = 30): Observable<EstadisticasGenerales> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas?periodo=${periodo}`).pipe(
      map(response => {
        if (response.exito) {
          return response.datos;
        }
        throw new Error(response.mensaje || 'Error al obtener estadísticas');
      })
    );
  }

  // Descargar archivo CSV
  descargarCSV(desde?: string, hasta?: string, incluir: string[] = ['habitos', 'progreso', 'logros']): void {
    this.exportarDatosCSV(desde, hasta, incluir).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fittrack_datos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar CSV:', error);
        alert('Error al descargar el archivo CSV');
      }
    });
  }

  // Descargar archivo JSON
  descargarJSON(desde?: string, hasta?: string, incluir: string[] = ['habitos', 'progreso', 'logros']): void {
    this.exportarDatosJSON(desde, hasta, incluir).subscribe({
      next: (datos) => {
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fittrack_datos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar JSON:', error);
        alert('Error al descargar el archivo JSON');
      }
    });
  }

  // Generar reporte PDF (datos preparados para PDF)
  generarDatosPDF(periodo: number = 30): Observable<any> {
    return this.obtenerEstadisticas(periodo).pipe(
      map(estadisticas => {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - periodo);

        return {
          titulo: 'Reporte FitTrack - Progreso de Hábitos',
          periodo: `${fechaInicio.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
          fecha: new Date().toLocaleDateString(),
          resumen: estadisticas.resumen,
          detallesPorTipo: estadisticas.estadisticasPorTipo,
          progresoReciente: estadisticas.progresoSemanal.slice(0, 10),
          recomendaciones: this.generarRecomendaciones(estadisticas)
        };
      })
    );
  }

  // Generar recomendaciones basadas en las estadísticas
  private generarRecomendaciones(estadisticas: EstadisticasGenerales): string[] {
    const recomendaciones: string[] = [];
    const porcentajeExito = parseFloat(estadisticas.resumen.porcentajeExito);

    if (porcentajeExito < 50) {
      recomendaciones.push('Considera reducir las metas para hacer los hábitos más alcanzables');
      recomendaciones.push('Configura recordatorios para mantener la consistencia');
    } else if (porcentajeExito >= 50 && porcentajeExito < 80) {
      recomendaciones.push('¡Buen progreso! Mantén la constancia para mejorar aún más');
      recomendaciones.push('Identifica patrones en los días que más cumples tus metas');
    } else {
      recomendaciones.push('¡Excelente trabajo! Considera agregar nuevos hábitos desafiantes');
      recomendaciones.push('Comparte tu progreso con profesionales de la salud');
    }

    if (estadisticas.resumen.totalHabitos < 3) {
      recomendaciones.push('Considera agregar más hábitos para una rutina más completa');
    }

    return recomendaciones;
  }

  // Obtener datos resumidos para el dashboard
  obtenerResumenDashboard(): Observable<any> {
    return this.obtenerEstadisticas(7).pipe(
      map(estadisticas => ({
        habitosActivos: estadisticas.resumen.totalHabitos,
        metasCompletadas: estadisticas.resumen.metasCompletadas,
        porcentajeExito: estadisticas.resumen.porcentajeExito,
        logrosTotal: estadisticas.resumen.totalLogros,
        tendenciaUltimos7Dias: estadisticas.progresoSemanal.length
      }))
    );
  }
}
