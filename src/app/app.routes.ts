import { Routes } from '@angular/router';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Habits } from './app/pages/habits/habits';
import { ProgressPage } from './app/pages/progress/progress';
import { RemindersPage } from './app/pages/reminders/reminders';
import { ProfilePage } from './app/pages/profile/profile';
import { ArchivementsPage } from './app/pages/achievements/achievements';
import { Exportar } from './app/pages/exportar/exportar';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'habits', component: Habits },
  { path: 'progress', component: ProgressPage },
  { path: 'reminders', component: RemindersPage },
  { path: 'logros', component: ArchivementsPage },
  { path: 'exportar', component: Exportar },
  { path: 'profile', component: ProfilePage },
  { path: '**', redirectTo: 'dashboard' }
];
