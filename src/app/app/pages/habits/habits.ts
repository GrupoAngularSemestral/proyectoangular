import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HabitService } from '../../services/habit';
import { ProgressService } from '../../services/progress';
import { AchievementService } from '../../services/achievement';
import { Habit as HabitModel } from '../../../models/habit.model';

@Component({
  selector: 'app-habits',
  imports: [CommonModule, FormsModule],
  templateUrl: './habits.html',
  styleUrl: './habits.css'
})
export class Habits implements OnInit, OnDestroy {
  habits: HabitModel[] = [];
  newHabit: Partial<HabitModel> = {
    name: '',
    type: 'custom',
    goal: 1,
    unit: '',
    frequency: 'daily',
    reminderEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  editingHabitId: string | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Para el registro de progreso
  selectedHabitForProgress: HabitModel | null = null;
  progressValue: number = 0;
  progressNotes: string = '';
  showProgressModal: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private habitService: HabitService,
    private progressService: ProgressService,
    private achievementService: AchievementService
  ) {}

  ngOnInit() {
    this.cargarHabitos();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  cargarHabitos() {
    this.loading = true;
    const sub = this.habitService.habits$.subscribe({
      next: (habits) => {
        this.habits = habits;
        this.loading = false;
      },
      error: (error) => {
        this.mostrarError('Error al cargar hábitos: ' + error.message);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  recargarHabitos() {
    this.habitService.reloadHabits();
  }

  limpiarCache() {
    this.habitService.clearCacheAndReload();
    this.mostrarExito('Caché limpiado. Datos recargados desde el servidor.');
  }

  addHabit() {
    if (!this.validarHabito()) return;

    this.loading = true;
    this.limpiarMensajes();

    if (this.editingHabitId) {
      // Guardar edición
      const sub = this.habitService.updateHabit(this.editingHabitId, {
        ...this.newHabit,
        updatedAt: new Date()
      }).subscribe({
        next: () => {
          this.mostrarExito('Hábito actualizado exitosamente');
          this.resetForm();
          this.verificarNuevosLogros();
        },
        error: (error) => {
          this.mostrarError('Error al actualizar hábito: ' + error.message);
        },
        complete: () => {
          this.loading = false;
        }
      });
      this.subscriptions.push(sub);
    } else {
      // Agregar nuevo hábito
      const habit: HabitModel = {
        ...this.newHabit,
        id: '', // Se asignará en el backend
        createdAt: new Date(),
        updatedAt: new Date()
      } as HabitModel;

      const sub = this.habitService.addHabit(habit).subscribe({
        next: () => {
          this.mostrarExito('Hábito creado exitosamente');
          this.resetForm();
          this.verificarNuevosLogros();
        },
        error: (error) => {
          this.mostrarError('Error al crear hábito: ' + error.message);
        },
        complete: () => {
          this.loading = false;
        }
      });
      this.subscriptions.push(sub);
    }
  }

  editHabit(habit: HabitModel) {
    this.editingHabitId = habit.id;
    this.newHabit = { ...habit };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteHabit(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este hábito?')) return;

    this.loading = true;
    const sub = this.habitService.deleteHabit(id).subscribe({
      next: () => {
        this.mostrarExito('Hábito eliminado exitosamente');
        if (this.editingHabitId === id) {
          this.resetForm();
        }
      },
      error: (error) => {
        this.mostrarError('Error al eliminar hábito: ' + error.message);
      },
      complete: () => {
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // Abrir modal de progreso
  abrirModalProgreso(habit: HabitModel) {
    this.selectedHabitForProgress = habit;
    this.progressValue = 0;
    this.progressNotes = '';
    this.showProgressModal = true;
  }

  // Registrar progreso
  registrarProgreso() {
    if (!this.selectedHabitForProgress) return;

    console.log('🎯 Registrando progreso desde el componente:', {
      habitId: this.selectedHabitForProgress.id,
      habitIdType: typeof this.selectedHabitForProgress.id,
      progressValue: this.progressValue,
      progressValueType: typeof this.progressValue,
      progressNotes: this.progressNotes,
      habitName: this.selectedHabitForProgress.name
    });

    this.loading = true;
    const sub = this.habitService.registrarProgreso(
      this.selectedHabitForProgress.id,
      this.progressValue,
      this.progressNotes
    ).subscribe({
      next: (progreso) => {
        this.mostrarExito(`Progreso registrado: ${progreso.valorCompletado} ${this.selectedHabitForProgress?.unit}`);
        this.cerrarModalProgreso();
        this.verificarNuevosLogros();
        // Recargar datos para reflejar los cambios
        this.cargarHabitos();
      },
      error: (error) => {
        console.error('❌ Error completo al registrar progreso:', error);
        
        // Si es un error HTTP con un cuerpo de respuesta, mostrarlo
        if (error.error && error.error.errores) {
          console.error('📋 Errores de validación específicos:', error.error.errores);
          const errorMessages = error.error.errores.map((err: any) => 
            `${err.path || err.campo}: ${err.msg || err.mensaje}`
          ).join('; ');
          this.mostrarError(`Error de validación: ${errorMessages}`);
        } else if (error.error && error.error.mensaje) {
          this.mostrarError(`Error: ${error.error.mensaje}`);
        } else {
          this.mostrarError('Error al registrar progreso: ' + error.message);
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  cerrarModalProgreso() {
    this.showProgressModal = false;
    this.selectedHabitForProgress = null;
    this.progressValue = 0;
    this.progressNotes = '';
  }

  // Verificar nuevos logros
  private verificarNuevosLogros() {
    const sub = this.achievementService.verificarLogros().subscribe({
      next: (nuevosLogros) => {
        if (nuevosLogros.length > 0) {
          const mensaje = `¡Felicitaciones! Has obtenido ${nuevosLogros.length} nuevo(s) logro(s): ` +
            nuevosLogros.map(l => `${l.icono} ${l.nombre}`).join(', ');
          this.mostrarExito(mensaje);
        }
      },
      error: (error) => {
        console.error('Error al verificar logros:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  private validarHabito(): boolean {
    if (!this.newHabit.name?.trim()) {
      this.mostrarError('El nombre del hábito es requerido');
      return false;
    }
    if (!this.newHabit.goal || this.newHabit.goal <= 0) {
      this.mostrarError('La meta debe ser mayor a 0');
      return false;
    }
    if (!this.newHabit.unit?.trim()) {
      this.mostrarError('La unidad es requerida');
      return false;
    }
    return true;
  }

  private resetForm() {
    this.editingHabitId = null;
    this.newHabit = {
      name: '',
      type: 'custom',
      goal: 1,
      unit: '',
      frequency: 'daily',
      reminderEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mostrarError(mensaje: string) {
    this.errorMessage = mensaje;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private mostrarExito(mensaje: string) {
    this.successMessage = mensaje;
    setTimeout(() => this.successMessage = '', 5000);
  }

  private limpiarMensajes() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Métodos auxiliares para la plantilla
  get isEditing(): boolean {
    return this.editingHabitId !== null;
  }

  get buttonText(): string {
    return this.isEditing ? 'Actualizar Hábito' : 'Agregar Hábito';
  }

  cancelEdit() {
    this.resetForm();
  }

  // Métodos auxiliares para las plantillas
  getHabitIcon(type: string): string {
    const icons: {[key: string]: string} = {
      'water': '💧',
      'exercise': '💪',
      'sleep': '😴',
      'custom': '⭐'
    };
    return icons[type] || '⭐';
  }

  getHabitTypeLabel(type: string): string {
    const labels: {[key: string]: string} = {
      'water': 'Hidratación',
      'exercise': 'Ejercicio',
      'sleep': 'Sueño',
      'custom': 'Personalizado'
    };
    return labels[type] || 'Personalizado';
  }

  getFrequencyLabel(frequency: string): string {
    const labels: {[key: string]: string} = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'custom': 'Personalizado'
    };
    return labels[frequency] || 'Diario';
  }

  // Exponer Math para usar en template
  Math = Math;
}
