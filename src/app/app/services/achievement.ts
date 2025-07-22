import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Logro {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  icono: string;
  puntos: number;
  rareza: string;
  fechaObtenido?: Date;
  visto?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private apiUrl = 'http://localhost:5000/api';
  private logrosSubject = new BehaviorSubject<{disponibles: Logro[], obtenidos: Logro[]}>({
    disponibles: [],
    obtenidos: []
  });
  public logros$ = this.logrosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarLogros();
  }

  // Cargar todos los logros desde el backend
  cargarLogros(): void {
    this.http.get<any>(`${this.apiUrl}/logros`).subscribe({
      next: (response) => {
        if (response.exito) {
          const disponibles = response.datos.logrosDisponibles.map((l: any) => ({
            id: l.id,
            nombre: l.nombre,
            descripcion: l.descripcion,
            tipo: l.tipo,
            icono: l.icono,
            puntos: l.puntos,
            rareza: l.rareza
          }));

          const obtenidos = response.datos.logrosObtenidos.map((lo: any) => ({
            id: lo.logro.id,
            nombre: lo.logro.nombre,
            descripcion: lo.logro.descripcion,
            tipo: lo.logro.tipo,
            icono: lo.logro.icono,
            puntos: lo.logro.puntos,
            rareza: lo.logro.rareza,
            fechaObtenido: new Date(lo.fechaObtenido),
            visto: lo.visto
          }));

          this.logrosSubject.next({ disponibles, obtenidos });
        }
      },
      error: (error) => {
        console.error('Error al cargar logros:', error);
      }
    });
  }

  // Verificar y obtener nuevos logros
  verificarLogros(): Observable<Logro[]> {
    return this.http.post<any>(`${this.apiUrl}/logros/verificar`, {}).pipe(
      map(response => {
        if (response.exito) {
          this.cargarLogros(); // Recargar logros después de verificar
          return response.datos.nuevosLogros.map((nl: any) => ({
            id: nl.logro.id,
            nombre: nl.logro.nombre,
            descripcion: nl.logro.descripcion,
            tipo: nl.logro.tipo,
            icono: nl.logro.icono,
            puntos: nl.logro.puntos,
            rareza: nl.logro.rareza,
            fechaObtenido: new Date(nl.fechaObtenido)
          }));
        }
        return [];
      })
    );
  }

  // Marcar logro como visto
  marcarComoVisto(logroObtenidoId: number): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/logros/marcar-visto/${logroObtenidoId}`, {}).pipe(
      map(response => {
        if (response.exito) {
          this.cargarLogros(); // Recargar para actualizar estado
          return true;
        }
        return false;
      })
    );
  }

  // Obtener logros no vistos
  getLogrosNoVistos(): Observable<Logro[]> {
    return this.logros$.pipe(
      map(data => data.obtenidos.filter(logro => !logro.visto))
    );
  }

  // Obtener total de puntos
  getTotalPuntos(): Observable<number> {
    return this.logros$.pipe(
      map(data => data.obtenidos.reduce((total, logro) => total + logro.puntos, 0))
    );
  }

  // Obtener estadísticas de logros
  getEstadisticasLogros(): Observable<any> {
    return this.logros$.pipe(
      map(data => {
        const total = data.disponibles.length;
        const obtenidos = data.obtenidos.length;
        const porcentaje = total > 0 ? (obtenidos / total) * 100 : 0;
        
        const porRareza = {
          comun: data.obtenidos.filter(l => l.rareza === 'comun').length,
          raro: data.obtenidos.filter(l => l.rareza === 'raro').length,
          epico: data.obtenidos.filter(l => l.rareza === 'epico').length,
          legendario: data.obtenidos.filter(l => l.rareza === 'legendario').length
        };

        return {
          total,
          obtenidos,
          porcentaje: Math.round(porcentaje),
          porRareza,
          totalPuntos: data.obtenidos.reduce((sum, l) => sum + l.puntos, 0)
        };
      })
    );
  }
}
