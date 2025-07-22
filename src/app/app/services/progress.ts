import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RegistroProgreso {
  id: number;
  habitoId: number;
  fecha: string;
  valorCompletado: number;
  metaDelDia: number;
  porcentajeCompletado: number;
  completado: boolean;
  notas: string;
  habito?: {
    id: number;
    nombre: string;
    tipo: string;
    unidad: string;
  };
}

export interface EstadisticasHabito {
  totalDias: number;
  diasCompletados: number;
  porcentajeExito: number;
  promedioCompletado: number;
  rachaActual: number;
  habito?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private apiUrl = 'http://localhost:5000/api/progreso';

  constructor(private http: HttpClient) {}

  // Registrar progreso diario
  registrarProgreso(habitoId: number, valorCompletado: number, fecha?: string, notas?: string): Observable<RegistroProgreso> {
    const data = {
      habitoId,
      valorCompletado,
      fecha: fecha || new Date().toISOString().split('T')[0],
      notas: notas || ''
    };

    return this.http.post<any>(this.apiUrl, data).pipe(
      map(response => {
        if (response.exito) {
          return response.datos.progreso;
        }
        throw new Error(response.mensaje || 'Error al registrar progreso');
      })
    );
  }

  // Obtener progreso de un hábito específico
  obtenerProgreso(habitoId: number, desde?: string, hasta?: string, limite?: number): Observable<RegistroProgreso[]> {
    let url = `${this.apiUrl}/${habitoId}`;
    const params = new URLSearchParams();
    
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (limite) params.append('limite', limite.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.exito) {
          return response.datos.progreso;
        }
        throw new Error(response.mensaje || 'Error al obtener progreso');
      })
    );
  }

  // Obtener estadísticas de un hábito
  obtenerEstadisticas(habitoId: number, periodo: number = 30): Observable<{estadisticas: EstadisticasHabito, registros: RegistroProgreso[]}> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/${habitoId}?periodo=${periodo}`).pipe(
      map(response => {
        if (response.exito) {
          return response.datos;
        }
        throw new Error(response.mensaje || 'Error al obtener estadísticas');
      })
    );
  }

  // Obtener progreso de la última semana para un hábito
  obtenerProgresoSemanal(habitoId: number): Observable<RegistroProgreso[]> {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const desde = hace7Dias.toISOString().split('T')[0];

    return this.obtenerProgreso(habitoId, desde, undefined, 7);
  }

  // Obtener progreso del mes actual para un hábito
  obtenerProgresoMensual(habitoId: number): Observable<RegistroProgreso[]> {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const desde = inicioMes.toISOString().split('T')[0];

    return this.obtenerProgreso(habitoId, desde);
  }

  // Calcular racha actual basada en los registros
  calcularRachaActual(registros: RegistroProgreso[]): number {
    if (!registros || registros.length === 0) return 0;

    // Ordenar por fecha descendente (más reciente primero)
    const registrosOrdenados = [...registros].sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    let racha = 0;
    for (const registro of registrosOrdenados) {
      if (registro.completado) {
        racha++;
      } else {
        break;
      }
    }

    return racha;
  }

  // Obtener datos para gráficos semanales
  obtenerDatosGraficoSemanal(habitoId: number): Observable<any> {
    return this.obtenerProgresoSemanal(habitoId).pipe(
      map(registros => {
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 6);

        const datosGrafico = [];
        for (let i = 0; i < 7; i++) {
          const fecha = new Date(hace7Dias);
          fecha.setDate(hace7Dias.getDate() + i);
          const fechaStr = fecha.toISOString().split('T')[0];
          
          const registro = registros.find(r => r.fecha === fechaStr);
          datosGrafico.push({
            dia: dias[fecha.getDay()],
            fecha: fechaStr,
            valor: registro?.valorCompletado || 0,
            meta: registro?.metaDelDia || 0,
            porcentaje: registro?.porcentajeCompletado || 0,
            completado: registro?.completado || false
          });
        }

        return datosGrafico;
      })
    );
  }

  // Obtener datos para gráficos mensuales  
  obtenerDatosGraficoMensual(habitoId: number): Observable<any> {
    return this.obtenerProgresoMensual(habitoId).pipe(
      map(registros => {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        
        const datosGrafico = [];
        for (let d = new Date(inicioMes); d <= finMes; d.setDate(d.getDate() + 1)) {
          const fechaStr = d.toISOString().split('T')[0];
          const registro = registros.find(r => r.fecha === fechaStr);
          
          datosGrafico.push({
            fecha: fechaStr,
            dia: d.getDate(),
            valor: registro?.valorCompletado || 0,
            meta: registro?.metaDelDia || 0,
            porcentaje: registro?.porcentajeCompletado || 0,
            completado: registro?.completado || false
          });
        }

        return datosGrafico;
      })
    );
  }
}
