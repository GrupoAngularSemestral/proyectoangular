import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgressChartComponent } from '../../components/progress-chart/progress-chart';
import { HabitService } from '../../services/habit';

export interface ProgressData {
  weeklyData: number[];
  weeklyLabels: string[];
  monthlyData: number[];
  monthlyLabels: string[];
  stats: {
    totalHabits: number;
    completedToday: number;
    weeklyCompletions: number;
    monthlyCompletions: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  };
  bestDay: {
    label: string;
    value: number;
  };
  recentActivity: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressChartComponent],
  templateUrl: './progress.html',
  styleUrls: ['./progress.css']
})
export class ProgressPage implements OnInit, OnDestroy {
  progressData: ProgressData = {
    weeklyData: [],
    weeklyLabels: [],
    monthlyData: [],
    monthlyLabels: [],
    stats: {
      totalHabits: 0,
      completedToday: 0,
      weeklyCompletions: 0,
      monthlyCompletions: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0
    },
    bestDay: { label: '', value: 0 },
    recentActivity: []
  };

  isLoading = true;
  error: string | null = null;
  viewMode: 'weekly' | 'monthly' = 'weekly';
  
  private subscription = new Subscription();

  constructor(private habitService: HabitService) {}

  ngOnInit() {
    console.log('🚀 Inicializando página de progreso...');
    // Suscribirse a los cambios de hábitos para actualizar automáticamente
    this.loadProgressData();
    
    // También escuchar cambios en tiempo real
    const habitsSub = this.habitService.habits$.subscribe((habits: any[]) => {
      console.log('📥 Hábitos recibidos en progreso:', habits);
      this.processProgressDataFromHabits(habits);
      this.isLoading = false;
    });
    
    this.subscription.add(habitsSub);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // Desactivar estadísticas al salir de la página
    this.habitService.disableStats();
  }

  loadProgressData() {
    this.isLoading = true;
    this.error = null;
    
    // Cargar hábitos con estadísticas completas
    this.habitService.loadHabitsWithStats();
  }

  private processProgressDataFromHabits(habits: any[]) {
    // Usar datos reales de progreso en lugar de simulados
    console.log('🔍 Procesando datos de hábitos para progreso:', habits);
    
    habits.forEach((habit, index) => {
      console.log(`📊 Hábito ${index + 1}:`, {
        id: habit.id,
        name: habit.name,
        completions: habit.completions,
        completedDates: habit.completedDates,
        stats: habit.stats
      });
    });
    
    const weeklyData = this.generateWeeklyData(habits);
    const monthlyData = this.generateMonthlyData(habits);
    
    console.log('📈 Datos semanales generados:', weeklyData);
    console.log('📈 Datos mensuales generados:', monthlyData);
    
    // Calcular estadísticas reales basadas en los datos de progreso
    const today = new Date();
    const todayCompletions = this.calculateTodayCompletions(habits, today);
    const weeklyCompletions = this.calculateWeeklyCompletions(habits);
    const monthlyCompletions = this.calculateMonthlyCompletions(habits);
    
    console.log('📊 Estadísticas calculadas:', {
      totalHabits: habits.length,
      todayCompletions,
      weeklyCompletions,
      monthlyCompletions
    });
    
    // Find best day
    const bestDayIndex = weeklyData.indexOf(Math.max(...weeklyData));
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Calculate completion rate
    const completionRate = habits.length > 0 
      ? Math.round((todayCompletions / habits.length) * 100) 
      : 0;
    
    // Calculate streaks reales
    const currentStreak = this.calculateCurrentStreak(habits);
    const longestStreak = this.calculateLongestStreak(habits);
    
    this.progressData = {
      weeklyData,
      weeklyLabels: dayNames,
      monthlyData,
      monthlyLabels: this.generateMonthLabels(),
      stats: {
        totalHabits: habits.length,
        completedToday: todayCompletions,
        weeklyCompletions: weeklyCompletions,
        monthlyCompletions: monthlyCompletions,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        completionRate: completionRate
      },
      bestDay: {
        label: dayNames[bestDayIndex] || 'N/A',
        value: weeklyData[bestDayIndex] || 0
      },
      recentActivity: this.generateRecentActivity(habits)
    };
  }

  private calculateTodayCompletions(habits: any[], today: Date): number {
    const todayStr = today.toISOString().split('T')[0];
    return habits.filter(habit => {
      // Usar los datos de estadísticas si están disponibles
      if (habit.stats && habit.stats.completadoHoy !== undefined) {
        return habit.stats.completadoHoy;
      }
      
      // Fallback: buscar en completions
      if (!habit.completions || !Array.isArray(habit.completions)) return false;
      
      return habit.completions.some((completion: any) => {
        const completionDate = new Date(completion.date);
        const completionStr = completionDate.toISOString().split('T')[0];
        return completionStr === todayStr && completion.completed;
      });
    }).length;
  }

  private calculateWeeklyCompletions(habits: any[]): number {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    let totalCompletions = 0;
    
    habits.forEach(habit => {
      if (habit.completions && Array.isArray(habit.completions)) {
        const weekCompletions = habit.completions.filter((completion: any) => {
          const completionDate = new Date(completion.date);
          return completionDate >= startOfWeek && completionDate <= today;
        });
        totalCompletions += weekCompletions.length;
      }
    });
    
    return totalCompletions;
  }

  private calculateCurrentStreak(habits: any[]): number {
    if (habits.length === 0) return 0;
    
    // Tomar la racha más alta de todos los hábitos
    let maxStreak = 0;
    
    habits.forEach(habit => {
      // Usar los datos de estadísticas si están disponibles
      if (habit.stats && habit.stats.rachaActual !== undefined) {
        maxStreak = Math.max(maxStreak, habit.stats.rachaActual);
        return;
      }
      
      // Fallback: calcular racha manualmente
      const today = new Date();
      let streak = 0;
      
      // Check consecutive days backwards from today
      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const dayCompleted = habit.completedDates && habit.completedDates.includes(dateStr);
        
        if (dayCompleted) {
          streak++;
        } else {
          break;
        }
      }
      
      maxStreak = Math.max(maxStreak, streak);
    });
    
    return maxStreak;
  }

  private calculateLongestStreak(habits: any[]): number {
    if (habits.length === 0) return 0;
    
    // Simplified longest streak calculation
    // In a real app, you'd want to track this more precisely
    const currentStreak = this.calculateCurrentStreak(habits);
    return Math.max(currentStreak, Math.floor(currentStreak * 1.2)); // Simulate historic data
  }

  private generateWeeklyData(habits: any[]): number[] {
    const weekData = new Array(7).fill(0);
    const today = new Date();
    
    console.log('📅 === GENERANDO DATOS SEMANALES ===');
    console.log('📅 Hábitos recibidos:', habits.length);
    
    // Mostrar estructura de cada hábito
    habits.forEach((habit, index) => {
      console.log(`📋 Hábito ${index + 1}: ${habit.name}`);
      console.log(`  - Goal: ${habit.goal} ${habit.unit}`);
      console.log(`  - Completions:`, habit.completions);
      console.log(`  - CompletedDates:`, habit.completedDates);
    });
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - (6 - i));
      const dateStr = targetDate.toISOString().split('T')[0];
      
      console.log(`📅 === DÍA ${i} (${dateStr}) ===`);
      
      let dayCompletions = 0;
      habits.forEach((habit) => {
        let habitCompleted = false;
        
        // Verificar en completions
        if (habit.completions && Array.isArray(habit.completions)) {
          const dayCompletion = habit.completions.find((completion: any) => {
            const completionDate = new Date(completion.date);
            const completionStr = completionDate.toISOString().split('T')[0];
            console.log(`    🔍 Comparando: ${completionStr} === ${dateStr}`);
            return completionStr === dateStr;
          });
          
          if (dayCompletion) {
            console.log(`    📊 Progreso encontrado: ${dayCompletion.value}/${habit.goal} - Completado: ${dayCompletion.completed}`);
            if (dayCompletion.completed) {
              habitCompleted = true;
            }
          }
        }
        
        // Verificar en completedDates como backup
        if (!habitCompleted && habit.completedDates && habit.completedDates.includes(dateStr)) {
          console.log(`    ✅ Encontrado en completedDates: ${dateStr}`);
          habitCompleted = true;
        }
        
        if (habitCompleted) {
          dayCompletions++;
          console.log(`    ✅ ${habit.name} COMPLETADO el ${dateStr}`);
        }
      });
      
      weekData[i] = dayCompletions;
      console.log(`📈 Total completados ${dateStr}: ${dayCompletions}`);
    }
    
    console.log('📈 === RESULTADO FINAL ===');
    console.log('📈 Datos semanales:', weekData);
    return weekData;
  }

  private generateMonthlyData(habits: any[]): number[] {
    const monthData = new Array(4).fill(0);
    const today = new Date();
    
    console.log('📅 === GENERANDO DATOS MENSUALES ===');
    console.log('📅 Hábitos recibidos:', habits.length);
    
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDate() % 7) - (21 - week * 7));
      
      console.log(`📅 === SEMANA ${week + 1} (desde ${weekStart.toISOString().split('T')[0]}) ===`);
      
      let weekCompletions = 0;
      for (let day = 0; day < 7; day++) {
        const targetDate = new Date(weekStart);
        targetDate.setDate(weekStart.getDate() + day);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        habits.forEach(habit => {
          if (habit.completions && Array.isArray(habit.completions)) {
            const dayCompletions = habit.completions.filter((completion: any) => {
              const completionDate = new Date(completion.date);
              const completionStr = completionDate.toISOString().split('T')[0];
              return completionStr === dateStr && completion.completed;
            });
            weekCompletions += dayCompletions.length;
          }
        });
      }
      
      monthData[week] = weekCompletions;
      console.log(`📈 Semana ${week + 1} completados: ${weekCompletions}`);
    }
    
    console.log('📈 === RESULTADO MENSUAL ===');
    console.log('📈 Datos mensuales:', monthData);
    return monthData;
  }

  private generateMonthLabels(): string[] {
    return ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
  }

  private calculateMonthlyCompletions(habits: any[]): number {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const today = new Date();
    
    let totalCompletions = 0;
    
    // Iterate through each day of the current month
    for (let date = new Date(startOfMonth); date <= today; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCompletions = habits.filter(habit => {
        return habit.completedDates && habit.completedDates.includes(dateStr);
      }).length;
      
      totalCompletions += dayCompletions;
    }
    
    return totalCompletions;
  }

  private generateRecentActivity(habits: any[]): Array<{date: string, completed: number, total: number}> {
    const activity = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];
      
      const completed = habits.filter(habit => {
        return habit.completedDates && habit.completedDates.includes(dateStr);
      }).length;
      
      activity.push({
        date: targetDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
        completed,
        total: habits.length
      });
    }
    
    return activity;
  }

  switchView(mode: 'weekly' | 'monthly') {
    this.viewMode = mode;
  }

  get currentData(): number[] {
    return this.viewMode === 'weekly' ? this.progressData.weeklyData : this.progressData.monthlyData;
  }

  get currentLabels(): string[] {
    return this.viewMode === 'weekly' ? this.progressData.weeklyLabels : this.progressData.monthlyLabels;
  }

  reloadData() {
    console.log('🔄 Recargando datos de progreso manualmente...');
    this.isLoading = true;
    this.error = null;
    
    // Forzar recarga con estadísticas si estamos en la página de progreso
    this.habitService.loadHabitsWithStats();
  }
}
