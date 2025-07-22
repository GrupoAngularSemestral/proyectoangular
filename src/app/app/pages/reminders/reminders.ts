import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ReminderListComponent } from '../../components/reminder-list/reminder-list';
import { NotificationService, ReminderConfig, NotificationPermission } from '../../services/notification';
import { HabitService } from '../../services/habit';
import { Habit } from '../../../models/habit.model';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReminderListComponent],
  templateUrl: './reminders.html',
  styleUrls: ['./reminders.css']
})
export class RemindersPage implements OnInit, OnDestroy {
  reminders: ReminderConfig[] = [];
  habits: Habit[] = [];
  permission: NotificationPermission = { granted: false, requested: false };
  upcomingReminders: Array<{reminder: ReminderConfig, nextTime: Date}> = [];
  
  // Modal state
  showModal = false;
  editingReminder: ReminderConfig | null = null;
  
  // Form data
  selectedHabitId = '';
  reminderTime = '';
  selectedDays: number[] = [];
  customMessage = '';
  reminderEnabled = true;
  
  private subscriptions: Subscription[] = [];
  
  // Días de la semana
  weekDays = [
    { id: 1, name: 'Lunes', short: 'L' },
    { id: 2, name: 'Martes', short: 'M' },
    { id: 3, name: 'Miércoles', short: 'X' },
    { id: 4, name: 'Jueves', short: 'J' },
    { id: 5, name: 'Viernes', short: 'V' },
    { id: 6, name: 'Sábado', short: 'S' },
    { id: 0, name: 'Domingo', short: 'D' }
  ];

  constructor(
    private notificationService: NotificationService,
    private habitService: HabitService
  ) {}

  ngOnInit() {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadData() {
    // Cargar hábitos
    this.habits = this.habitService.getHabits();
    
    // Cargar próximos recordatorios
    this.updateUpcomingReminders();
  }

  private setupSubscriptions() {
    // Suscribirse a cambios en recordatorios
    const remindersSub = this.notificationService.reminders$.subscribe(reminders => {
      this.reminders = reminders;
      this.updateUpcomingReminders();
    });
    this.subscriptions.push(remindersSub);

    // Suscribirse a cambios en permisos
    const permissionSub = this.notificationService.permission$.subscribe(permission => {
      this.permission = permission;
    });
    this.subscriptions.push(permissionSub);

    // Suscribirse a cambios en hábitos
    const habitsSub = this.habitService.habits$.subscribe(habits => {
      this.habits = habits;
    });
    this.subscriptions.push(habitsSub);
  }

  private updateUpcomingReminders() {
    this.upcomingReminders = this.notificationService.getUpcomingReminders(5);
  }

  // Solicitar permisos de notificación
  async requestPermission() {
    const granted = await this.notificationService.requestPermission();
    if (granted) {
      this.showSuccess('¡Permisos de notificación concedidos!');
    } else {
      this.showError('No se pudieron obtener permisos de notificación');
    }
  }

  // Abrir modal para crear recordatorio
  openCreateModal() {
    this.resetForm();
    this.editingReminder = null;
    this.showModal = true;
  }

  // Abrir modal para editar recordatorio
  openEditModal(reminder: ReminderConfig) {
    this.editingReminder = reminder;
    this.selectedHabitId = reminder.habitId;
    this.reminderTime = reminder.time;
    this.selectedDays = [...reminder.days];
    this.customMessage = reminder.message || '';
    this.reminderEnabled = reminder.enabled;
    this.showModal = true;
  }

  // Cerrar modal
  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  // Resetear formulario
  private resetForm() {
    this.selectedHabitId = '';
    this.reminderTime = '';
    this.selectedDays = [];
    this.customMessage = '';
    this.reminderEnabled = true;
    this.editingReminder = null;
  }

  // Alternar selección de día
  toggleDay(dayId: number) {
    const index = this.selectedDays.indexOf(dayId);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(dayId);
    }
  }

  // Verificar si un día está seleccionado
  isDaySelected(dayId: number): boolean {
    return this.selectedDays.includes(dayId);
  }

  // Guardar recordatorio
  saveReminder() {
    if (!this.selectedHabitId || !this.reminderTime || this.selectedDays.length === 0) {
      this.showError('Por favor completa todos los campos requeridos');
      return;
    }

    const selectedHabit = this.habits.find(h => h.id === this.selectedHabitId);
    if (!selectedHabit) {
      this.showError('Hábito no encontrado');
      return;
    }

    const reminderData: ReminderConfig = {
      id: this.editingReminder?.id || `reminder_${this.selectedHabitId}_${Date.now()}`,
      habitId: this.selectedHabitId,
      habitName: selectedHabit.name,
      time: this.reminderTime,
      days: this.selectedDays,
      enabled: this.reminderEnabled,
      message: this.customMessage.trim() || undefined
    };

    this.notificationService.setReminder(reminderData);
    
    const action = this.editingReminder ? 'actualizado' : 'creado';
    this.showSuccess(`Recordatorio ${action} exitosamente`);
    this.closeModal();
  }

  // Eliminar recordatorio
  deleteReminder(reminderId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) {
      this.notificationService.removeReminder(reminderId);
      this.showSuccess('Recordatorio eliminado exitosamente');
    }
  }

  // Alternar estado de recordatorio
  toggleReminderStatus(reminderId: string) {
    this.notificationService.toggleReminder(reminderId);
  }

  // Obtener nombre del hábito
  getHabitName(habitId: string): string {
    const habit = this.habits.find(h => h.id === habitId);
    return habit?.name || 'Hábito eliminado';
  }

  // Obtener días como texto
  getDaysText(days: number[]): string {
    if (days.length === 7) return 'Todos los días';
    if (days.length === 0) return 'Ningún día';
    
    return days
      .sort()
      .map(day => this.weekDays.find(wd => wd.id === day)?.short)
      .join(', ');
  }

  // Formatear fecha
  formatTime(dateTime: Date): string {
    return dateTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Formatear fecha para mostrar
  formatDate(dateTime: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateTime.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (dateTime.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return dateTime.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  // Probar notificación
  testNotification() {
    if (!this.permission.granted) {
      this.showError('Primero debes conceder permisos de notificación');
      return;
    }

    // Crear notificación de prueba
    const testNotification = new Notification('FitTrack - Notificación de prueba', {
      body: '¡Las notificaciones funcionan correctamente!',
      icon: '/assets/favicon.ico'
    });

    setTimeout(() => {
      testNotification.close();
    }, 5000);

    this.showSuccess('Notificación de prueba enviada');
  }

  // Métodos para mostrar mensajes
  private showSuccess(message: string) {
    alert(`✅ ${message}`);
  }

  private showError(message: string) {
    alert(`❌ ${message}`);
  }
}
