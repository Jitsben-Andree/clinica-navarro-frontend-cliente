import { Portal } from './../portal';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PortalService } from '../../../core/services/portal';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-citas.html'
})
export class MisCitasComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal<boolean>(true);
  paciente = signal<any>(null);
  citas = signal<any[]>([]);

  ngOnInit() {
    // Asegúrate de que getUsuarioId() exista en tu auth.ts
    const usuarioId = this.authService.getUsuarioId ? this.authService.getUsuarioId() : Number(localStorage.getItem('user_id_cliente'));
    
    if (usuarioId) {
      this.portalService.obtenerMiPerfil(usuarioId).subscribe({
        next: (perfil) => {
          this.paciente.set(perfil);
          this.cargarMisCitas(perfil.id);
        },
        error: () => this.cargando.set(false)
      });
    } else {
      this.cerrarSesion();
    }
  }

  cargarMisCitas(pacienteId: number) {
    this.portalService.misCitas(pacienteId).subscribe({
      next: (data) => {
        // Ordenamos más recientes primero
        const ordenadas = data.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
        this.citas.set(ordenadas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  descargarReceta(citaId: number) {
    this.portalService.descargarReceta(citaId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }
  
  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}