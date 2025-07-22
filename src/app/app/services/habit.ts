import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Habit as HabitModel, ProgressEntry } from '../../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private apiUrl = 'http://localhost:5000/api';
  private habitsSubject = new BehaviorSubject<HabitModel[]>([]);
  public habits$ = this.habitsSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.loadHabits();
  }

  // Cargar hábitos desde el backend o localStorage
  private loadHabits(): void {
    // Primero, verificar si hay datos guardados localmente
    const storedHabits = localStorage.getItem('demo_habits');
    if (storedHabits) {
      try {
        const habits = JSON.parse(storedHabits);
        // Asegurar que las fechas sean objetos Date
        habits.forEach((habit: any) => {
          if (typeof habit.createdAt === 'string') {
            habit.createdAt = new Date(habit.createdAt);
          }
          if (typeof habit.updatedAt === 'string') {
            habit.updatedAt = new Date(habit.updatedAt);
          }
          // Inicializar arrays si no existen
          if (!habit.completions) habit.completions = [];
          if (!habit.completedDates) habit.completedDates = [];
        });
        this.habitsSubject.next(habits);
        return;
      } catch (error) {
        console.error('Error al cargar hábitos desde localStorage:', error);
      }
    }

    // Si no hay datos locales, intentar cargar desde backend
    this.http.get<any>(`${this.apiUrl}/habitos`).subscribe({
      next: (response) => {
        if (response.exito && response.datos.habitos.length > 0) {
          const habits = response.datos.habitos.map((h: any) => this.mapBackendToFrontend(h));
          this.habitsSubject.next(habits);
        } else {
          // Si no hay hábitos, crear algunos de demostración
          this.createDemoHabits();
        }
      },
      error: (error) => {
        console.error('Error al cargar hábitos:', error);
        // Si hay error, crear hábitos de demo para que la app funcione
        this.createDemoHabits();
      }
    });
  }

  // Crear hábitos de demostración
  private createDemoHabits(): void {
    const demoHabits: HabitModel[] = [
      {
        id: '1',
        name: 'Beber agua',
        type: 'water',
        goal: 8,
        unit: 'vasos',
        frequency: 'daily',
        reminderEnabled: true,
        reminderTime: '09:00',
        repeatDays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        completions: [],
        completedDates: []
      },
      {
        id: '2',
        name: 'Hacer ejercicio',
        type: 'exercise',
        goal: 30,
        unit: 'minutos',
        frequency: 'daily',
        reminderEnabled: false,
        reminderTime: '',
        repeatDays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        completions: [],
        completedDates: []
      },
      {
        id: '3',
        name: 'Leer libros',
        type: 'custom',
        goal: 15,
        unit: 'páginas',
        frequency: 'daily',
        reminderEnabled: false,
        reminderTime: '',
        repeatDays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        completions: [],
        completedDates: []
      }
    ];

    // Guardar en localStorage para persistencia
    localStorage.setItem('demo_habits', JSON.stringify(demoHabits));
    this.habitsSubject.next(demoHabits);
  }

  // Método público para recargar hábitos
  reloadHabits(): void {
    this.loadHabits();
  }

  getHabits(): HabitModel[] {
    return this.habitsSubject.getValue();
  }

  addHabit(habit: HabitModel): Observable<any> {
    const backendHabit = this.mapFrontendToBackend(habit);
    
    return this.http.post<any>(`${this.apiUrl}/habitos`, backendHabit).pipe(
      map(response => {
        if (response.exito) {
          this.loadHabits(); // Recargar la lista
          return response.datos.habito;
        }
        throw new Error(response.mensaje || 'Error al crear hábito');
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
    return this.http.delete<any>(`${this.apiUrl}/habitos/${id}`).pipe(
      map(response => {
        if (response.exito) {
          this.loadHabits(); // Recargar la lista
          return true;
        }
        throw new Error(response.mensaje || 'Error al eliminar hábito');
      })
    );
  }

  // Registrar progreso de un hábito (versión simplificada)
  registrarProgreso(habitId: string, valorCompletado: number, notas: string = ''): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        try {
          // Obtener hábitos actuales
          const currentHabits = this.habitsSubject.value;
          const habitIndex = currentHabits.findIndex(h => h.id === habitId);
          
          if (habitIndex === -1) {
            observer.error(new Error('Hábito no encontrado'));
            return;
          }

          const habit = { ...currentHabits[habitIndex] };
          const today = new Date().toISOString().split('T')[0];
          
          // Inicializar arrays si no existen
          if (!habit.completions) {
            habit.completions = [];
          }
          if (!habit.completedDates) {
            habit.completedDates = [];
          }
          
          // Verificar si ya hay un registro para hoy
          const existingEntryIndex = habit.completions.findIndex(c => c.date === today);
          
          const valor = Math.min(valorCompletado, habit.goal || 10);
          const completed = valor >= (habit.goal || 5);
          
          const progressEntry = {
            id: existingEntryIndex >= 0 ? habit.completions[existingEntryIndex].id : `progress_${Date.now()}`,
            date: today,
            value: valor,
            notes: notas || '',
            completed: completed
          };
          
          // Actualizar o agregar entrada de progreso
          if (existingEntryIndex >= 0) {
            habit.completions[existingEntryIndex] = progressEntry;
          } else {
            habit.completions.push(progressEntry);
          }
          
          // Actualizar fechas completadas
          if (completed && !habit.completedDates.includes(today)) {
            habit.completedDates.push(today);
          } else if (!completed && habit.completedDates.includes(today)) {
            habit.completedDates = habit.completedDates.filter(date => date !== today);
          }
          
          // Actualizar el hábito en el array
          const updatedHabits = [...currentHabits];
          updatedHabits[habitIndex] = habit;
          
          // Guardar en localStorage para persistencia
          localStorage.setItem('demo_habits', JSON.stringify(updatedHabits));
          
          // Actualizar el BehaviorSubject
          this.habitsSubject.next(updatedHabits);
          
          // Simular respuesta del backend
          const mockResponse = {
            exito: true,
            datos: {
              progreso: {
                id: progressEntry.id,
                habitoId: parseInt(habitId),
                valorCompletado: valor,
                notas: notas,
                fecha: today,
                completado: completed
              }
            }
          };
          
          observer.next(mockResponse.datos.progreso);
          observer.complete();
          
        } catch (error) {
          observer.error(error);
        }
      }, 300);
    });
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
    return {
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
      updatedAt: new Date(backendHabit.fechaActualizacion)
    };
  }

  // Mapear datos del frontend al backend
  private mapFrontendToBackend(frontendHabit: any): any {
    return {
      nombre: frontendHabit.name,
      tipo: frontendHabit.type,
      meta: frontendHabit.goal,
      unidad: frontendHabit.unit,
      frecuencia: frontendHabit.frequency || 'daily',
      recordatorioActivo: frontendHabit.reminderEnabled || false,
      horaRecordatorio: frontendHabit.reminderTime || null,
      diasRepeticion: frontendHabit.repeatDays || []
    };
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
