import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { ApiService } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  preferences?: Partial<User['preferences']>;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBackendAvailable = false;

  constructor(private apiService: ApiService) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Check if backend is available
      await this.apiService.checkConnection().toPromise();
      this.isBackendAvailable = true;
      console.log('✅ Backend connection established');
      
      // Try to load user from token
      const token = localStorage.getItem('fittrack_token');
      if (token) {
        this.loadUserFromToken();
      }
    } catch (error) {
      console.log('⚠️ Backend not available, using offline mode');
      this.isBackendAvailable = false;
      this.initializeOfflineMode();
    }
  }

  private initializeOfflineMode(): void {
    // Load user from localStorage if exists (offline mode)
    const savedUser = localStorage.getItem('fittrack_user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    } else {
      // Create a default user for demo purposes
      this.createDefaultUser();
    }
  }

  private loadUserFromToken(): void {
    this.apiService.get<User>('/users/profile').subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        console.error('Failed to load user from token:', error);
        localStorage.removeItem('fittrack_token');
        this.initializeOfflineMode();
      }
    });
  }

  // Authentication methods
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (!this.isBackendAvailable) {
      return throwError(() => new Error('Backend not available'));
    }

    return this.apiService.post<AuthResponse>('/auth-test/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('fittrack_token', response.token);
        this.currentUserSubject.next(response.user);
      }),
      catchError(this.handleAuthError)
    );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    if (!this.isBackendAvailable) {
      return throwError(() => new Error('Backend not available'));
    }

    return this.apiService.post<AuthResponse>('/auth-test/register', userData).pipe(
      tap(response => {
        localStorage.setItem('fittrack_token', response.token);
        this.currentUserSubject.next(response.user);
      }),
      catchError(this.handleAuthError)
    );
  }

  logout(): void {
    localStorage.removeItem('fittrack_token');
    this.currentUserSubject.next(null);
  }

  private handleAuthError(error: any): Observable<never> {
    console.error('Auth error:', error);
    return throwError(() => error);
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

  updateUser(userData: Partial<User>): Observable<User> {
    if (this.isBackendAvailable && this.currentUserSubject.value) {
      return this.apiService.put<User>('/users/profile', userData).pipe(
        tap(updatedUser => {
          this.currentUserSubject.next(updatedUser);
        }),
        catchError(() => {
          // Fallback to local update if backend fails
          this.updateUserLocally(userData);
          return throwError(() => new Error('Backend update failed, updated locally'));
        })
      );
    } else {
      // Offline mode
      this.updateUserLocally(userData);
      return new Observable(subscriber => {
        subscriber.next(this.currentUserSubject.value!);
        subscriber.complete();
      });
    }
  }

  private updateUserLocally(userData: Partial<User>): void {
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
      
      if (this.isBackendAvailable) {
        this.apiService.put('/users/stats', { stats: updatedUser.stats }).subscribe({
          error: (error) => console.warn('Failed to update stats on server:', error)
        });
      } else {
        localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
      }
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
      
      if (this.isBackendAvailable) {
        this.apiService.put('/users/preferences', { preferences: updatedUser.preferences }).subscribe({
          error: (error) => console.warn('Failed to update preferences on server:', error)
        });
      } else {
        localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
      }
    }
  }

  resetData(): void {
    localStorage.removeItem('fittrack_user');
    localStorage.removeItem('fittrack_habits');
    localStorage.removeItem('fittrack_achievements');
    localStorage.removeItem('fittrack_token');
    
    if (this.isBackendAvailable) {
      this.apiService.delete('/users/data').subscribe({
        next: () => console.log('User data reset on server'),
        error: (error) => console.warn('Failed to reset data on server:', error)
      });
    }
    
    this.createDefaultUser();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('fittrack_token');
  }
}
