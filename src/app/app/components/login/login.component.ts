import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>FitTrack Login</h2>
        
        <div class="connection-status">
          <div [ngClass]="{'status-indicator': true, 'online': isBackendOnline, 'offline': !isBackendOnline}">
            {{ isBackendOnline ? '🟢 Backend Connected' : '🔴 Backend Offline' }}
          </div>
          <div class="status-indicator">
            {{ isDatabaseConnected ? '🟢 Database Connected' : '🔴 Database Disconnected' }}
          </div>
        </div>

        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="credentials.email" 
              required 
              #email="ngModel">
            <div *ngIf="email.invalid && email.touched" class="error">
              Email is required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="credentials.password" 
              required 
              minlength="6"
              #password="ngModel">
            <div *ngIf="password.invalid && password.touched" class="error">
              Password must be at least 6 characters
            </div>
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading" class="login-btn">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="demo-section">
          <h3>Demo Mode</h3>
          <button (click)="enterDemoMode()" class="demo-btn">
            Enter Demo Mode (Offline)
          </button>
        </div>

        <div *ngIf="error" class="error-message">
          {{ error }}
        </div>

        <div class="register-link">
          <p>Don't have an account? <a href="#" (click)="switchToRegister()">Register</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }

    h2 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: #333;
    }

    .connection-status {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .status-indicator {
      margin: 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .status-indicator.online {
      color: #28a745;
    }

    .status-indicator.offline {
      color: #dc3545;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
    }

    .login-btn, .demo-btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s;
      margin-bottom: 1rem;
    }

    .login-btn {
      background: #007bff;
      color: white;
    }

    .login-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .login-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .demo-btn {
      background: #28a745;
      color: white;
    }

    .demo-btn:hover {
      background: #1e7e34;
    }

    .demo-section {
      text-align: center;
      margin: 1.5rem 0;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .demo-section h3 {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 1.1rem;
    }

    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 1rem;
      border: 1px solid #f5c6cb;
    }

    .register-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .register-link a {
      color: #007bff;
      text-decoration: none;
    }

    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  credentials = {
    email: 'demo@fittrack.com',
    password: 'demo123456'
  };

  isLoading = false;
  error = '';
  isBackendOnline = false;
  isDatabaseConnected = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.checkBackendConnection();
  }

  async checkBackendConnection(): Promise<void> {
    try {
      const response = await this.apiService.checkConnection().toPromise();
      this.isBackendOnline = true;
      this.isDatabaseConnected = response?.database === 'PostgreSQL';
      console.log('✅ Backend Health Check:', response);
    } catch (error) {
      this.isBackendOnline = false;
      this.isDatabaseConnected = false;
      console.log('⚠️ Backend offline:', error);
    }
  }

  onLogin(): void {
    if (!this.isBackendOnline) {
      this.error = 'Backend is not available. Please use Demo Mode.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.credentials).subscribe({
      next: (response: any) => {
        console.log('✅ Login successful:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        console.error('❌ Login failed:', error);
        this.error = error.error?.message || 'Login failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  enterDemoMode(): void {
    console.log('🎮 Entering demo mode...');
    this.router.navigate(['/dashboard']);
  }

  switchToRegister(): void {
    // Navigate to register component when it's created
    console.log('Switching to register...');
  }
}
