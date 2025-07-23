import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface PerfilUsuario {
  id?: number;
  nombre: string;
  email: string;
  fechaNacimiento: string | null;
  genero: string | null;
  altura: number | null;
  peso: number | null;
  metaAgua: number;
  metaSueno: number;
  nivelActividad: string;
  objetivoFitness: string;
  notificacionesActivas: boolean;
  tema: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfilePage implements OnInit, OnDestroy {
  private apiUrl = 'http://localhost:5000/api';
  private subscription = new Subscription();

  loading = true;
  guardando = false;
  error: string | null = null;
  mensajeExito: string | null = null;

  perfilUsuario: PerfilUsuario = {
    nombre: '',
    email: '',
    fechaNacimiento: null,
    genero: null,
    altura: null,
    peso: null,
    metaAgua: 2.0,
    metaSueno: 8,
    nivelActividad: 'Moderado',
    objetivoFitness: 'Mantener Peso',
    notificacionesActivas: true,
    tema: 'Claro'
  };

  private perfilOriginal: PerfilUsuario = { ...this.perfilUsuario };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarPerfil();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarPerfil() {
    this.loading = true;
    this.error = null;

    // Por ahora, usar datos de prueba ya que no hay sistema de autenticación
    // En una implementación real, esto vendría del usuario autenticado
    const sub = this.http.get<any>(`${this.apiUrl}/users/1`).subscribe({
      next: (response) => {
        if (response.exito) {
          this.mapearPerfilDesdeBackend(response.datos.usuario);
          this.perfilOriginal = { ...this.perfilUsuario };
        } else {
          // Si no existe el usuario, crear uno por defecto
          this.crearUsuarioPorDefecto();
        }
        this.loading = false;
      },
      error: (error) => {
        console.log('Usuario no encontrado, usando datos por defecto');
        this.crearUsuarioPorDefecto();
        this.loading = false;
      }
    });

    this.subscription.add(sub);
  }

  private crearUsuarioPorDefecto() {
    this.perfilUsuario = {
      nombre: 'Usuario FitTrack',
      email: 'usuario@fittrack.com',
      fechaNacimiento: null,
      genero: null,
      altura: null,
      peso: null,
      metaAgua: 2.0,
      metaSueno: 8,
      nivelActividad: 'Moderado',
      objetivoFitness: 'Mantener Peso',
      notificacionesActivas: true,
      tema: 'Claro'
    };
    this.perfilOriginal = { ...this.perfilUsuario };
  }

  private mapearPerfilDesdeBackend(usuario: any) {
    this.perfilUsuario = {
      id: usuario.id,
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      fechaNacimiento: usuario.fechaNacimiento || null,
      genero: usuario.genero || null,
      altura: usuario.altura || null,
      peso: usuario.peso || null,
      metaAgua: usuario.metaAgua || 2.0,
      metaSueno: usuario.metaSueno || 8,
      nivelActividad: usuario.nivelActividad || 'Moderado',
      objetivoFitness: usuario.objetivoFitness || 'Mantener Peso',
      notificacionesActivas: usuario.notificacionesActivas !== false,
      tema: usuario.tema || 'Claro'
    };
  }

  calcularIMC(): number {
    if (!this.perfilUsuario.altura || !this.perfilUsuario.peso) return 0;
    const alturaEnMetros = this.perfilUsuario.altura / 100;
    return this.perfilUsuario.peso / (alturaEnMetros * alturaEnMetros);
  }

  obtenerCategoriaIMC(): string {
    const imc = this.calcularIMC();
    if (imc === 0) return '';
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  obtenerClaseIMC(): string {
    const imc = this.calcularIMC();
    if (imc === 0) return '';
    if (imc < 18.5) return 'imc-bajo';
    if (imc < 25) return 'imc-normal';
    if (imc < 30) return 'imc-sobrepeso';
    return 'imc-obesidad';
  }

  obtenerTextoIMC(): string {
    const imc = this.calcularIMC();
    if (imc === 0) return '';
    if (imc < 18.5) return 'Bajo Peso';
    if (imc < 25) return 'Peso Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  guardarPerfil() {
    if (!this.validarPerfil()) return;

    this.guardando = true;
    this.error = null;
    this.mensajeExito = null;

    const datosActualizados = {
      nombre: this.perfilUsuario.nombre,
      email: this.perfilUsuario.email,
      fechaNacimiento: this.perfilUsuario.fechaNacimiento,
      genero: this.perfilUsuario.genero,
      altura: this.perfilUsuario.altura,
      peso: this.perfilUsuario.peso,
      metaAgua: this.perfilUsuario.metaAgua,
      metaSueno: this.perfilUsuario.metaSueno,
      nivelActividad: this.perfilUsuario.nivelActividad,
      objetivoFitness: this.perfilUsuario.objetivoFitness,
      notificacionesActivas: this.perfilUsuario.notificacionesActivas,
      tema: this.perfilUsuario.tema
    };

    const request = this.perfilUsuario.id 
      ? this.http.put(`${this.apiUrl}/users/${this.perfilUsuario.id}`, datosActualizados)
      : this.http.post(`${this.apiUrl}/users`, datosActualizados);

    const sub = request.subscribe({
      next: (response: any) => {
        if (response.exito) {
          this.mensajeExito = 'Perfil guardado exitosamente';
          this.perfilOriginal = { ...this.perfilUsuario };
          
          // Si era un nuevo usuario, guardar el ID
          if (!this.perfilUsuario.id && response.datos.usuario) {
            this.perfilUsuario.id = response.datos.usuario.id;
          }

          // Ocultar mensaje después de 3 segundos
          setTimeout(() => {
            this.mensajeExito = null;
          }, 3000);
        } else {
          this.error = 'Error al guardar el perfil';
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al guardar perfil:', error);
        this.error = 'Error al guardar el perfil. Por favor, intenta nuevamente.';
        this.guardando = false;
      }
    });

    this.subscription.add(sub);
  }

  private validarPerfil(): boolean {
    if (!this.perfilUsuario.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }

    if (!this.perfilUsuario.email.trim()) {
      this.error = 'El email es obligatorio';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.perfilUsuario.email)) {
      this.error = 'El email no tiene un formato válido';
      return false;
    }

    if (this.perfilUsuario.metaAgua < 1 || this.perfilUsuario.metaAgua > 10) {
      this.error = 'La meta de agua debe estar entre 1 y 10 litros';
      return false;
    }

    if (this.perfilUsuario.metaSueno < 4 || this.perfilUsuario.metaSueno > 12) {
      this.error = 'La meta de sueño debe estar entre 4 y 12 horas';
      return false;
    }

    return true;
  }

  resetearPerfil() {
    this.perfilUsuario = { ...this.perfilOriginal };
    this.error = null;
    this.mensajeExito = 'Perfil restablecido a los últimos valores guardados';
    
    setTimeout(() => {
      this.mensajeExito = null;
    }, 3000);
  }

  get hayDatosMedicas(): boolean {
    return !!(this.perfilUsuario.altura && this.perfilUsuario.peso);
  }

  get metasPersonalizadas(): string[] {
    const metas: string[] = [];
    
    if (this.perfilUsuario.metaAgua !== 2.0) {
      metas.push(`Agua: ${this.perfilUsuario.metaAgua}L/día`);
    }
    
    if (this.perfilUsuario.metaSueno !== 8) {
      metas.push(`Sueño: ${this.perfilUsuario.metaSueno}h/noche`);
    }
    
    if (this.perfilUsuario.objetivoFitness !== 'Mantener Peso') {
      metas.push(`Objetivo: ${this.perfilUsuario.objetivoFitness}`);
    }
    
    return metas;
  }
}
