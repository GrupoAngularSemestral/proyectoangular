import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AchievementService } from '../../services/achievement';

export interface LogroDisplay {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  icono: string;
  puntos: number;
  rareza: string;
  desbloqueado: boolean;
  fechaObtenido?: Date;
  progreso?: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.html',
  styleUrls: ['./achievements.css']
})
export class ArchivementsPage implements OnInit, OnDestroy {
  logrosDisponibles: LogroDisplay[] = [];
  logrosObtenidos: LogroDisplay[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  
  private subscription: Subscription = new Subscription();

  constructor(private achievementService: AchievementService) {}

  ngOnInit() {
    this.cargarLogros();
    this.suscribirAActualizaciones();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private cargarLogros() {
    this.isLoading = true;
    this.errorMessage = '';
    // El servicio se encarga de cargar automáticamente
    this.achievementService.cargarLogros();
  }

  private suscribirAActualizaciones() {
    // Suscribirse a cambios en logros
    this.subscription.add(
      this.achievementService.logros$.subscribe({
        next: (logros) => {
          this.logrosDisponibles = logros.disponibles.map(logro => ({
            id: logro.id,
            nombre: logro.nombre,
            descripcion: logro.descripcion,
            tipo: logro.tipo,
            icono: this.getIconoLogro(logro.tipo),
            puntos: logro.puntos,
            rareza: logro.rareza,
            desbloqueado: false
          }));

          this.logrosObtenidos = logros.obtenidos.map(logro => ({
            id: logro.id,
            nombre: logro.nombre,
            descripcion: logro.descripcion,
            tipo: logro.tipo,
            icono: this.getIconoLogro(logro.tipo),
            puntos: logro.puntos,
            rareza: logro.rareza,
            desbloqueado: true,
            fechaObtenido: logro.fechaObtenido ? new Date(logro.fechaObtenido) : new Date()
          }));
          
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = 'Error al cargar los logros: ' + error.message;
          this.isLoading = false;
        }
      })
    );
  }

  private getIconoLogro(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'habito': '🎯',
      'racha': '🔥',
      'progreso': '📈',
      'tiempo': '⏰',
      'cantidad': '💪',
      'consistencia': '⭐',
      'especial': '🏆',
      'semanal': '📅',
      'mensual': '🗓️'
    };
    return iconos[tipo] || '🏅';
  }

  getRarezaClass(rareza: string): string {
    const clases: { [key: string]: string } = {
      'comun': 'rareza-comun',
      'raro': 'rareza-raro',
      'epico': 'rareza-epico',
      'legendario': 'rareza-legendario'
    };
    return clases[rareza] || 'rareza-comun';
  }

  getTotalPuntos(): number {
    return this.logrosObtenidos.reduce((total, logro) => total + logro.puntos, 0);
  }

  getPorcentajeCompletado(): number {
    const total = this.logrosDisponibles.length + this.logrosObtenidos.length;
    return total > 0 ? Math.round((this.logrosObtenidos.length / total) * 100) : 0;
  }

  recargarLogros() {
    this.cargarLogros();
    this.successMessage = 'Logros actualizados correctamente';
    setTimeout(() => this.successMessage = '', 3000);
  }
}
