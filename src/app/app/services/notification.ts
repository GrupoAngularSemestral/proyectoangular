import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ReminderConfig {
  id: string;
  habitId: string;
  habitName: string;
  time: string; // HH:mm format
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  enabled: boolean;
  message?: string;
}

export interface NotificationPermission {
  granted: boolean;
  requested: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private remindersSubject = new BehaviorSubject<ReminderConfig[]>([]);
  private permissionSubject = new BehaviorSubject<NotificationPermission>({
    granted: false,
    requested: false
  });
  
  private scheduledNotifications = new Map<string, number>(); // timeoutId storage

  constructor() {
    this.loadReminders();
    this.checkPermission();
    this.scheduleAllReminders();
  }

  // Observable para los recordatorios
  get reminders$(): Observable<ReminderConfig[]> {
    return this.remindersSubject.asObservable();
  }

  // Observable para el estado de permisos
  get permission$(): Observable<NotificationPermission> {
    return this.permissionSubject.asObservable();
  }

  // Solicitar permisos de notificación
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      this.permissionSubject.next({
        granted,
        requested: true
      });
      
      return granted;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  }

  // Verificar permisos actuales
  private checkPermission(): void {
    if (!('Notification' in window)) {
      return;
    }

    const granted = Notification.permission === 'granted';
    const requested = Notification.permission !== 'default';

    this.permissionSubject.next({ granted, requested });
  }

  // Cargar recordatorios desde localStorage
  private loadReminders(): void {
    try {
      const stored = localStorage.getItem('habit_reminders');
      if (stored) {
        const reminders = JSON.parse(stored);
        this.remindersSubject.next(reminders);
      }
    } catch (error) {
      console.error('Error al cargar recordatorios:', error);
    }
  }

  // Guardar recordatorios en localStorage
  private saveReminders(): void {
    try {
      const reminders = this.remindersSubject.value;
      localStorage.setItem('habit_reminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Error al guardar recordatorios:', error);
    }
  }

  // Agregar o actualizar recordatorio
  setReminder(reminder: ReminderConfig): void {
    const currentReminders = this.remindersSubject.value;
    const existingIndex = currentReminders.findIndex(r => r.id === reminder.id);

    if (existingIndex >= 0) {
      currentReminders[existingIndex] = reminder;
    } else {
      currentReminders.push(reminder);
    }

    this.remindersSubject.next(currentReminders);
    this.saveReminders();
    this.scheduleReminder(reminder);
  }

  // Eliminar recordatorio
  removeReminder(reminderId: string): void {
    const currentReminders = this.remindersSubject.value;
    const updatedReminders = currentReminders.filter(r => r.id !== reminderId);
    
    this.remindersSubject.next(updatedReminders);
    this.saveReminders();
    this.cancelScheduledNotification(reminderId);
  }

  // Obtener recordatorios por hábito
  getRemindersByHabit(habitId: string): ReminderConfig[] {
    return this.remindersSubject.value.filter(r => r.habitId === habitId);
  }

  // Programar recordatorio específico
  private scheduleReminder(reminder: ReminderConfig): void {
    if (!reminder.enabled) {
      this.cancelScheduledNotification(reminder.id);
      return;
    }

    // Cancelar notificación previa si existe
    this.cancelScheduledNotification(reminder.id);

    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);

    // Programar para cada día de la semana
    reminder.days.forEach(dayOfWeek => {
      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      // Ajustar al próximo día de la semana si es necesario
      const dayDiff = (dayOfWeek + 7 - targetDate.getDay()) % 7;
      if (dayDiff === 0 && targetDate <= now) {
        // Si es hoy pero ya pasó la hora, programar para la próxima semana
        targetDate.setDate(targetDate.getDate() + 7);
      } else if (dayDiff > 0) {
        targetDate.setDate(targetDate.getDate() + dayDiff);
      }

      const delay = targetDate.getTime() - now.getTime();
      
      if (delay > 0) {
        const timeoutId = window.setTimeout(() => {
          this.showNotification(reminder);
          // Reprogramar para la próxima semana
          this.scheduleReminder(reminder);
        }, delay);

        this.scheduledNotifications.set(`${reminder.id}_${dayOfWeek}`, timeoutId);
      }
    });
  }

  // Programar todos los recordatorios
  private scheduleAllReminders(): void {
    this.remindersSubject.value.forEach(reminder => {
      if (reminder.enabled) {
        this.scheduleReminder(reminder);
      }
    });
  }

  // Cancelar notificación programada
  private cancelScheduledNotification(reminderId: string): void {
    for (const [key, timeoutId] of this.scheduledNotifications.entries()) {
      if (key.startsWith(reminderId)) {
        clearTimeout(timeoutId);
        this.scheduledNotifications.delete(key);
      }
    }
  }

  // Mostrar notificación
  private showNotification(reminder: ReminderConfig): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const message = reminder.message || `¡Es hora de: ${reminder.habitName}!`;
    
    const notification = new Notification(`FitTrack - Recordatorio`, {
      body: message,
      icon: '/assets/favicon.ico',
      badge: '/assets/favicon.ico',
      tag: `habit_${reminder.habitId}`, // Previene duplicados
      requireInteraction: true
    });

    // Manejar clicks en la notificación
    notification.onclick = () => {
      window.focus();
      // Opcional: navegar a la página de hábitos
      notification.close();
    };

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  // Crear recordatorio para un hábito
  createHabitReminder(habitId: string, habitName: string, time: string, days: number[], message?: string): ReminderConfig {
    const reminder: ReminderConfig = {
      id: `reminder_${habitId}_${Date.now()}`,
      habitId,
      habitName,
      time,
      days,
      enabled: true,
      message
    };

    this.setReminder(reminder);
    return reminder;
  }

  // Alternar estado de recordatorio
  toggleReminder(reminderId: string): void {
    const reminders = this.remindersSubject.value;
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder) {
      reminder.enabled = !reminder.enabled;
      this.setReminder(reminder);
    }
  }

  // Limpiar todos los recordatorios
  clearAllReminders(): void {
    // Cancelar todas las notificaciones programadas
    this.scheduledNotifications.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();

    // Limpiar recordatorios
    this.remindersSubject.next([]);
    this.saveReminders();
  }

  // Obtener próximos recordatorios (para mostrar en UI)
  getUpcomingReminders(limit: number = 5): Array<{reminder: ReminderConfig, nextTime: Date}> {
    const now = new Date();
    const upcoming: Array<{reminder: ReminderConfig, nextTime: Date}> = [];

    this.remindersSubject.value.forEach(reminder => {
      if (!reminder.enabled) return;

      const [hours, minutes] = reminder.time.split(':').map(Number);

      reminder.days.forEach(dayOfWeek => {
        const nextTime = new Date();
        nextTime.setHours(hours, minutes, 0, 0);

        const dayDiff = (dayOfWeek + 7 - nextTime.getDay()) % 7;
        if (dayDiff === 0 && nextTime <= now) {
          nextTime.setDate(nextTime.getDate() + 7);
        } else if (dayDiff > 0) {
          nextTime.setDate(nextTime.getDate() + dayDiff);
        }

        upcoming.push({ reminder, nextTime });
      });
    });

    return upcoming
      .sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime())
      .slice(0, limit);
  }
}
