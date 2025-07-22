import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Habit as HabitModel, ProgressEntry } from '../../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private apiUrl = 'http://localhost:5000/api';
  private habitsSubject = new BehaviorSubject<HabitModel[]>([]);
  public habits$ = this.habitsSubject.asObservable();
  private needsStats = false; // Flag para saber si necesitamos estadísticas

  constructor(private http: HttpClient) { 
    // Limpiar localStorage para asegurar que solo se use la base de datos
    localStorage.removeItem('demo_habits');
    this.loadHabits();
  }

  // Cargar hábitos desde el backend únicamente
  private loadHabits(includeStats: boolean = false): void {
    console.log('🔄 Cargando hábitos desde el backend...', includeStats ? 'con estadísticas' : '');
    console.log('🔄 needsStats flag:', this.needsStats);
    const url = includeStats ? `${this.apiUrl}/habitos?includeStats=true` : `${this.apiUrl}/habitos`;
    console.log('🔗 URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('📥 === RESPUESTA DEL BACKEND ===');
        console.log('📥 Response completo:', response);
        if (response.exito && response.datos.habitos) {
          const habits = response.datos.habitos.map((h: any) => this.mapBackendToFrontend(h));
          console.log('✅ === HÁBITOS MAPEADOS ===');
          console.log('✅ Cantidad:', habits.length);
          habits.forEach((habit: HabitModel, index: number) => {
            console.log(`✅ Hábito ${index + 1}:`, {
              name: habit.name,
              goal: habit.goal,
              completions: habit.completions,
              completedDates: habit.completedDates,
              stats: (habit as any).stats
            });
          });
          this.habitsSubject.next(habits);
        } else {
          console.log('⚠️ No hay hábitos en la base de datos');
          this.habitsSubject.next([]);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar hábitos desde backend:', error);
        this.habitsSubject.next([]);
      }
    });
  }

  // Método público para recargar hábitos
  reloadHabits(): void {
    this.loadHabits(this.needsStats);
  }

  // Método para cargar hábitos con estadísticas (para página de progreso)
  loadHabitsWithStats(): void {
    console.log('📊 Solicitando hábitos con estadísticas...');
    this.needsStats = true; // Marcar que necesitamos estadísticas
    this.loadHabits(true);
  }

  // Método para desactivar estadísticas (cuando se sale de la página de progreso)
  disableStats(): void {
    console.log('📊 Desactivando estadísticas...');
    this.needsStats = false;
  }

  // Método para recargar desde backend
  clearCacheAndReload(): void {
    localStorage.removeItem('demo_habits');
    console.log('🧹 Caché limpiado, recargando desde base de datos...');
    this.loadHabits();
  }

  getHabits(): HabitModel[] {
    return this.habitsSubject.getValue();
  }

  addHabit(habit: HabitModel): Observable<any> {
    const backendHabit = this.mapFrontendToBackend(habit);
    
    console.log('🚀 Enviando hábito al backend:', JSON.stringify(backendHabit, null, 2));
    console.log('🔍 Datos originales del frontend:', JSON.stringify(habit, null, 2));
    
    return this.http.post<any>(`${this.apiUrl}/habitos`, backendHabit).pipe(
      map(response => {
        if (response.exito) {
          console.log('✅ Hábito creado exitosamente:', response);
          this.loadHabits(); // Recargar la lista
          return response.datos.habito;
        }
        console.error('❌ Error en respuesta del servidor:', response);
        throw new Error(response.mensaje || 'Error al crear hábito');
      }),
      catchError((error: any) => {
        console.error('❌ Error HTTP al crear hábito:', error);
        if (error.status === 400 && error.error && error.error.errores) {
          const errores = error.error.errores.map((e: any) => `${e.path || e.campo}: ${e.msg || e.mensaje}`).join(', ');
          return throwError(() => new Error(`Errores de validación: ${errores}`));
        }
        return throwError(() => new Error(error.error?.mensaje || error.message || 'Error al crear hábito'));
      })
    );
  }

  updateHabit(id: string, updatedHabit: Partial<HabitModel>): Observable<any> {
    const backendHabit = this.mapFrontendToBackend(updatedHabit);
    
    return this.http.put<any>(`${this.apiUrl}/habitos/${id}`, backendHabit).pipe(
      map(response => {
        if (response.exito) {
          this.loadHabits(); // Recargar la lista
          return response.datos.habito;
        }
        throw new Error(response.mensaje || 'Error al actualizar hábito');
      })
    );
  }

  deleteHabit(id: string): Observable<any> {
    console.log('🗑️ Eliminando hábito con ID:', id, 'Tipo:', typeof id);
    
    return this.http.delete<any>(`${this.apiUrl}/habitos/${id}`).pipe(
      map(response => {
        console.log('✅ Respuesta del servidor al eliminar:', response);
        if (response.exito) {
          this.loadHabits(); // Recargar la lista
          return true;
        }
        throw new Error(response.mensaje || 'Error al eliminar hábito');
      }),
      catchError((error: any) => {
        console.error('❌ Error al eliminar hábito:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        return throwError(() => new Error(error.error?.mensaje || error.message || 'Error al eliminar hábito'));
      })
    );
  }

  // Registrar progreso de un hábito usando la API backend
  registrarProgreso(habitId: string, valorCompletado: number, notas: string = ''): Observable<any> {
    console.log('📊 Registrando progreso:', { habitId, valorCompletado, notas });
    
    // Asegurar que los tipos sean correctos
    const habitoIdNum = parseInt(habitId);
    const valorNum = parseFloat(valorCompletado.toString());
    
    if (isNaN(habitoIdNum) || habitoIdNum <= 0) {
      return throwError(() => new Error('ID de hábito inválido'));
    }
    
    if (isNaN(valorNum) || valorNum < 0) {
      return throwError(() => new Error('Valor completado inválido'));
    }
    
    const data = {
      habitoId: habitoIdNum,
      valorCompletado: valorNum,
      fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      notas: notas || ''
    };

    console.log('📤 Datos a enviar al backend:', JSON.stringify(data, null, 2));
    console.log('📤 Tipos de datos:', {
      habitoId: typeof data.habitoId,
      valorCompletado: typeof data.valorCompletado,
      fecha: typeof data.fecha,
      notas: typeof data.notas
    });

    return this.http.post<any>(`${this.apiUrl}/progreso`, data).pipe(
      map(response => {
        console.log('📨 Respuesta del backend:', response);
        if (response.exito) {
          // Recargar hábitos con el nivel de detalle apropiado
          console.log(`🔄 Recargando hábitos ${this.needsStats ? 'con estadísticas' : 'normalmente'}...`);
          this.loadHabits(this.needsStats);
          
          return response.datos.progreso;
        }
        throw new Error(response.mensaje || 'Error al registrar progreso');
      }),
      catchError((error: any) => {
        console.error('❌ Error al registrar progreso:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        console.error('❌ Message:', error.message);
        
        let errorMessage = 'Error al registrar progreso';
        
        if (error.error && error.error.errores) {
          const errores = error.error.errores.map((e: any) => `${e.path || e.param}: ${e.msg || e.message}`).join(', ');
          errorMessage = `Errores de validación: ${errores}`;
        } else if (error.error && error.error.mensaje) {
          errorMessage = error.error.mensaje;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Obtener estadísticas de un hábito
  obtenerEstadisticas(habitId: string, periodo: number = 30): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/progreso/estadisticas/${habitId}?periodo=${periodo}`).pipe(
      map(response => {
        if (response.exito) {
          return response.datos.estadisticas;
        }
        throw new Error(response.mensaje || 'Error al obtener estadísticas');
      })
    );
  }

  // Mapear datos del backend al frontend
  private mapBackendToFrontend(backendHabit: any): HabitModel {
    const habit: HabitModel = {
      id: backendHabit.id.toString(),
      name: backendHabit.nombre,
      type: backendHabit.tipo,
      goal: backendHabit.meta,
      unit: backendHabit.unidad,
      frequency: backendHabit.frecuencia,
      reminderEnabled: backendHabit.recordatorioActivo || false,
      reminderTime: backendHabit.horaRecordatorio || '',
      repeatDays: backendHabit.diasRepeticion || [],
      createdAt: new Date(backendHabit.fechaCreacion),
      updatedAt: new Date(backendHabit.fechaActualizacion),
      completions: [],
      completedDates: []
    };

    // Si hay registros de progreso, procesarlos
    if (backendHabit.registrosProgreso && Array.isArray(backendHabit.registrosProgreso)) {
      console.log(`📊 Procesando ${backendHabit.registrosProgreso.length} registros de progreso para ${backendHabit.nombre}`);
      
      habit.completions = backendHabit.registrosProgreso.map((progreso: any) => ({
        date: progreso.fecha,
        value: progreso.valorCompletado,
        completed: progreso.valorCompletado >= backendHabit.meta,
        notes: progreso.notas || ''
      }));

      // Crear array de fechas completadas
      habit.completedDates = backendHabit.registrosProgreso
        .filter((progreso: any) => progreso.valorCompletado >= backendHabit.meta)
        .map((progreso: any) => progreso.fecha);
        
      console.log(`✅ Fechas completadas para ${backendHabit.nombre}:`, habit.completedDates);
    }

    // Si hay estadísticas del backend, agregarlas
    if (backendHabit.estadisticas) {
      (habit as any).stats = {
        rachaActual: backendHabit.estadisticas.rachaActual || 0,
        totalRegistros: backendHabit.estadisticas.totalRegistros || 0,
        progresoHoy: backendHabit.estadisticas.progresoHoy || 0,
        completadoHoy: backendHabit.estadisticas.completadoHoy || false
      };
    }

    return habit;
  }

  // Mapear datos del frontend al backend
  private mapFrontendToBackend(frontendHabit: any): any {
    const mapped: any = {
      nombre: frontendHabit.name,
      tipo: frontendHabit.type,
      meta: parseInt(frontendHabit.goal) || 1,
      unidad: frontendHabit.unit,
      frecuencia: frontendHabit.frequency || 'daily',
      recordatorioActivo: Boolean(frontendHabit.reminderEnabled),
      diasRepeticion: frontendHabit.repeatDays || []
    };

    // Solo agregar horaRecordatorio si hay una hora válida
    if (frontendHabit.reminderEnabled && frontendHabit.reminderTime && frontendHabit.reminderTime.trim() !== '') {
      mapped.horaRecordatorio = frontendHabit.reminderTime;
    }

    return mapped;
  }

  // Obtener datos del dashboard
  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/dashboard`);
  }

  // Obtener estadísticas de un hábito específico
  getHabitStats(habitId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/habits/${habitId}/stats`);
  }
}
