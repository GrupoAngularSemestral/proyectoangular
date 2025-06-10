import { Routes } from '@angular/router';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Habits } from './app/pages/habits/habits';
import { Progress } from './app/pages/progress/progress';
import { Reminders } from './app/pages/reminders/reminders';
import { Profile } from './app/pages/profile/profile';
import { Achievements } from './app/pages/achievements/achievements';
import { Exportar } from './app/pages/exportar/exportar';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'habits', component: Habits },
  { path: 'progress', component: Progress },
  { path: 'reminders', component: Reminders },
  { path: 'logros', component: Achievements },
  { path: 'exportar', component: Exportar },
  { path: 'profile', component: Profile },
  { path: '**', redirectTo: 'dashboard' }
];
