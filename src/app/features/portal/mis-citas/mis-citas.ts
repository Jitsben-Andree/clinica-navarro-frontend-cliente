import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PortalService } from '../../../core/services/portal';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mis-citas.html'
})
export class MisCitasComponent implements OnInit {

  private portalService = inject(PortalService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Estados visuales principales
  cargando = signal<boolean>(true);
  paciente = signal<any>(null);
  citas = signal<any[]>([]);

  // Estados del modal y UX
  mostrarModalCita = signal<boolean>(false);
  guardandoCita = signal<boolean>(false);
  mensajeFeedback = signal<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  // Datos dinámicos
  odontologos = signal<any[]>([]);
  minFechaHora: string = '';

  // Formulario reactivo estricto
  citaForm = this.fb.nonNullable.group({
    odontologoId: [0, [Validators.required, Validators.min(1)]],
    fechaHora: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit() {
    this.establecerFechaMinima();
    this.cargarOdontologos();

    // Obtener ID usuario de forma segura (SSR-safe)
    let usuarioId = this.authService.getUsuarioId();
    if (!usuarioId && typeof window !== 'undefined') {
      usuarioId = Number(localStorage.getItem('user_id_cliente'));
    }

    if (usuarioId && !isNaN(usuarioId)) {
      this.portalService.obtenerMiPerfil(usuarioId).subscribe({
        next: (perfil) => {
          this.paciente.set(perfil);
          this.cargarMisCitas(perfil.id);
        },
        error: () => {
          this.cargando.set(false);
          this.mostrarMensajeTemporal('error', 'No se pudo cargar la información del perfil.');
        }
      });
    } else {
      if (typeof window !== 'undefined') this.cerrarSesion();
    }
  }

  cargarOdontologos() {
    this.portalService.obtenerOdontologos().subscribe({
      next: (data) => this.odontologos.set(data),
      error: (err) => console.error('Error al cargar odontólogos', err)
    });
  }

  establecerFechaMinima() {
    if (typeof window !== 'undefined') {
      const ahora = new Date();
      // Ajuste de zona horaria para inputs datetime-local
      ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
      this.minFechaHora = ahora.toISOString().slice(0, 16);
    }
  }

  cargarMisCitas(pacienteId: number) {
    this.cargando.set(true);
    this.portalService.misCitas(pacienteId).subscribe({
      next: (data) => {
        // Orden cronológico: Más recientes primero
        const ordenadas = data.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
        this.citas.set(ordenadas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  abrirModal() {
    this.citaForm.reset({ odontologoId: 0, fechaHora: '', motivo: '' });
    this.mensajeFeedback.set(null);
    this.mostrarModalCita.set(true);
  }

  cerrarModal() {
    this.mostrarModalCita.set(false);
  }

  guardarCita() {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      return;
    }

    const formValues = this.citaForm.getRawValue();
    const nuevaCita = {
      pacienteId: this.paciente().id,
      odontologoId: Number(formValues.odontologoId),
      fechaHora: formValues.fechaHora,
      motivo: formValues.motivo
    };

    this.guardandoCita.set(true);
    this.mensajeFeedback.set(null);

    this.portalService.agendarCita(nuevaCita).subscribe({
      next: () => {
        this.guardandoCita.set(false);
        this.cargarMisCitas(this.paciente().id);
        this.mostrarMensajeTemporal('exito', 'Su cita ha sido agendada correctamente. Nos vemos pronto.');
        setTimeout(() => this.cerrarModal(), 2000); // Cierra tras 2 segundos de éxito
      },
      error: (err) => {
        this.guardandoCita.set(false);
        this.mensajeFeedback.set({
          tipo: 'error',
          texto: err.error?.message || 'El especialista ya tiene una cita en ese horario. Por favor, elija otra hora.'
        });
      }
    });
  }

  mostrarMensajeTemporal(tipo: 'exito' | 'error', texto: string) {
    this.mensajeFeedback.set({ tipo, texto });
    if (tipo === 'exito') {
      setTimeout(() => {
        this.mensajeFeedback.set(null);
      }, 5000);
    }
  }

  descargarReceta(citaId: number) {
    this.portalService.descargarReceta(citaId).subscribe({
      next: (blob: Blob) => {
        if (typeof window === 'undefined') return;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receta_Medica_CN_${citaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        this.mostrarMensajeTemporal('error', 'El documento no está disponible o el médico aún no lo ha emitido.');
      }
    });
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}