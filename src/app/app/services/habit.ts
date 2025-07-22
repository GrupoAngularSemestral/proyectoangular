import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Habit as HabitModel } from '../../models/habit.model';
import { ApiService } from './api';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habitsSubject = new BehaviorSubject<HabitModel[]>([]);
  public habits$ = this.habitsSubject.asObservable();
  private isBackendAvailable = false;

  constructor(private apiService: ApiService) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Check if backend is available
      await this.apiService.checkConnection().toPromise();
      this.isBackendAvailable = true;
      this.loadHabitsFromBackend();
    } catch (error) {
      console.log('⚠️ Backend not available for habits, using offline mode');
      this.isBackendAvailable = false;
      this.loadHabitsFromLocal();
    }
  }

  private loadHabitsFromBackend(): void {
    this.apiService.get<HabitModel[]>('/habits').subscribe({
      next: (habits) => {
        this.habitsSubject.next(habits);
        // Cache in localStorage for offline access
        localStorage.setItem('fittrack_habits', JSON.stringify(habits));
      },
      error: (error) => {
        console.warn('Failed to load habits from backend:', error);
        this.loadHabitsFromLocal();
      }
    });
  }

  private loadHabitsFromLocal(): void {
    const savedHabits = localStorage.getItem('fittrack_habits');
    if (savedHabits) {
      this.habitsSubject.next(JSON.parse(savedHabits));
    }
  }

  private updateLocalCache(habits: HabitModel[]): void {
    localStorage.setItem('fittrack_habits', JSON.stringify(habits));
  }

  getHabits(): Observable<HabitModel[]> {
    if (this.isBackendAvailable) {
      return this.apiService.get<HabitModel[]>('/habits').pipe(
        tap(habits => {
          this.habitsSubject.next(habits);
          this.updateLocalCache(habits);
        }),
        catchError(() => {
          // Return cached data if backend fails
          return of(this.habitsSubject.value);
        })
      );
    } else {
      return of(this.habitsSubject.value);
    }
  }

  getHabitById(id: string): Observable<HabitModel | undefined> {
    if (this.isBackendAvailable) {
      return this.apiService.get<HabitModel>(`/habits/${id}`).pipe(
        catchError(() => {
          // Fallback to local search
          const habit = this.habitsSubject.value.find(h => h.id === id);
          return of(habit);
        })
      );
    } else {
      const habit = this.habitsSubject.value.find(h => h.id === id);
      return of(habit);
    }
  }

  addHabit(habitData: Omit<HabitModel, 'id' | 'createdAt' | 'updatedAt'>): Observable<HabitModel> {
    if (this.isBackendAvailable) {
      return this.apiService.post<HabitModel>('/habits', habitData).pipe(
        tap(newHabit => {
          const currentHabits = this.habitsSubject.value;
          const updatedHabits = [...currentHabits, newHabit];
          this.habitsSubject.next(updatedHabits);
          this.updateLocalCache(updatedHabits);
        }),
        catchError(error => {
          console.warn('Failed to add habit to backend, adding locally:', error);
          return this.addHabitLocally(habitData);
        })
      );
    } else {
      return this.addHabitLocally(habitData);
    }
  }

  private addHabitLocally(habitData: Omit<HabitModel, 'id' | 'createdAt' | 'updatedAt'>): Observable<HabitModel> {
    const newHabit: HabitModel = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentHabits = this.habitsSubject.value;
    const updatedHabits = [...currentHabits, newHabit];
    this.habitsSubject.next(updatedHabits);
    this.updateLocalCache(updatedHabits);

    return of(newHabit);
  }

  updateHabit(id: string, updatedHabit: Partial<HabitModel>): Observable<HabitModel> {
    if (this.isBackendAvailable) {
      return this.apiService.put<HabitModel>(`/habits/${id}`, updatedHabit).pipe(
        tap(habit => {
          this.updateHabitInList(habit);
        }),
        catchError(error => {
          console.warn('Failed to update habit on backend, updating locally:', error);
          return this.updateHabitLocally(id, updatedHabit);
        })
      );
    } else {
      return this.updateHabitLocally(id, updatedHabit);
    }
  }

  private updateHabitLocally(id: string, updatedHabit: Partial<HabitModel>): Observable<HabitModel> {
    const currentHabits = this.habitsSubject.value;
    const index = currentHabits.findIndex(h => h.id === id);
    
    if (index !== -1) {
      const updated = {
        ...currentHabits[index],
        ...updatedHabit,
        updatedAt: new Date()
      };
      
      currentHabits[index] = updated;
      this.habitsSubject.next([...currentHabits]);
      this.updateLocalCache(currentHabits);
      
      return of(updated);
    }
    
    return throwError(() => new Error('Habit not found'));
  }

  private updateHabitInList(updatedHabit: HabitModel): void {
    const currentHabits = this.habitsSubject.value;
    const index = currentHabits.findIndex(h => h.id === updatedHabit.id);
    
    if (index !== -1) {
      currentHabits[index] = updatedHabit;
      this.habitsSubject.next([...currentHabits]);
      this.updateLocalCache(currentHabits);
    }
  }

  deleteHabit(id: string): Observable<void> {
    if (this.isBackendAvailable) {
      return this.apiService.delete<void>(`/habits/${id}`).pipe(
        tap(() => {
          this.removeHabitFromList(id);
        }),
        catchError(error => {
          console.warn('Failed to delete habit from backend, deleting locally:', error);
          this.removeHabitFromList(id);
          return of(undefined);
        })
      );
    } else {
      this.removeHabitFromList(id);
      return of(undefined);
    }
  }

  private removeHabitFromList(id: string): void {
    const currentHabits = this.habitsSubject.value;
    const updatedHabits = currentHabits.filter(h => h.id !== id);
    this.habitsSubject.next(updatedHabits);
    this.updateLocalCache(updatedHabits);
  }

  // Mark habit as completed for a specific date
  completeHabit(habitId: string, date?: Date): Observable<HabitModel> {
    const completionDate = date || new Date();
    
    if (this.isBackendAvailable) {
      return this.apiService.post<HabitModel>(`/habits/${habitId}/complete`, {
        date: completionDate
      }).pipe(
        tap(habit => {
          this.updateHabitInList(habit);
        }),
        catchError(error => {
          console.warn('Failed to complete habit on backend:', error);
          return this.completeHabitLocally(habitId, completionDate);
        })
      );
    } else {
      return this.completeHabitLocally(habitId, completionDate);
    }
  }

  private completeHabitLocally(habitId: string, date: Date): Observable<HabitModel> {
    const currentHabits = this.habitsSubject.value;
    const habit = currentHabits.find(h => h.id === habitId);
    
    if (habit) {
      const dateStr = date.toISOString().split('T')[0];
      const updatedCompletions = habit.completions ? [...habit.completions] : [];
      
      if (!updatedCompletions.includes(dateStr)) {
        updatedCompletions.push(dateStr);
      }
      
      const updatedHabit = {
        ...habit,
        completions: updatedCompletions,
        currentStreak: this.calculateStreak(updatedCompletions),
        updatedAt: new Date()
      };
      
      this.updateHabitInList(updatedHabit);
      return of(updatedHabit);
    }
    
    return throwError(() => new Error('Habit not found'));
  }

  private calculateStreak(completions: string[]): number {
    if (!completions.length) return 0;
    
    const sortedDates = completions.sort();
    let streak = 1;
    
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const current = new Date(sortedDates[i]);
      const previous = new Date(sortedDates[i - 1]);
      const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Get habits statistics
  getHabitStats(): Observable<any> {
    if (this.isBackendAvailable) {
      return this.apiService.get('/habits/stats').pipe(
        catchError(() => {
          // Calculate stats locally
          return of(this.calculateLocalStats());
        })
      );
    } else {
      return of(this.calculateLocalStats());
    }
  }

  private calculateLocalStats(): any {
    const habits = this.habitsSubject.value;
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalHabits: habits.length,
      completedToday: habits.filter(h => h.completions?.includes(today)).length,
      averageStreak: habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0) / habits.length || 0,
      longestStreak: Math.max(...habits.map(h => h.longestStreak || 0), 0)
    };
  }
}
