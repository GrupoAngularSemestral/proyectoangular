import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user from localStorage if exists
    const savedUser = localStorage.getItem('fittrack_user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    } else {
      // Create a default user for demo purposes
      this.createDefaultUser();
    }
  }

  private createDefaultUser(): void {
    const defaultUser: User = {
      id: 'user-1',
      name: 'Usuario Demo',
      email: 'demo@fittrack.com',
      preferences: {
        waterGoal: 2, // 2 liters
        sleepGoal: 8, // 8 hours
        exerciseGoal: 30, // 30 minutes
        notifications: true,
        theme: 'light'
      },
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalHabits: 0,
        completedHabits: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.currentUserSubject.next(defaultUser);
    localStorage.setItem('fittrack_user', JSON.stringify(defaultUser));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateUser(userData: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        ...userData,
        updatedAt: new Date()
      };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
    }
  }

  updateUserStats(stats: Partial<User['stats']>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        stats: {
          ...currentUser.stats,
          ...stats
        },
        updatedAt: new Date()
      };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
    }
  }

  updateUserPreferences(preferences: Partial<User['preferences']>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          ...preferences
        },
        updatedAt: new Date()
      };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
    }
  }

  resetData(): void {
    localStorage.removeItem('fittrack_user');
    localStorage.removeItem('fittrack_habits');
    localStorage.removeItem('fittrack_achievements');
    this.createDefaultUser();
  }
}
