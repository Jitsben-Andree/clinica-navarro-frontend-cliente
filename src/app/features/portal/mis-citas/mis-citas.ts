import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../../core/services/portal';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mis-citas.html'
})
export class MisCitasComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Estados visuales (Signals)
  cargando = signal<boolean>(true);
  paciente = signal<any>(null);
  citas = signal<any[]>([]);

  // Estados del Modal
  mostrarModalCita = signal<boolean>(false);
  guardandoCita = signal<boolean>(false);
  mensajeFeedback = signal<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  // Doctores según nuestra Base de Datos (Script Seed)
  odontologos = [
    { id: 2, nombre: 'Dr. Roberto Navarro (Odontología General)' },
    { id: 3, nombre: 'Dra. María Fernández (Odontopediatría)' }
  ];

  // Restricción para no agendar en fechas pasadas
  minFechaHora: string = '';

  // Formulario Reactivo
  citaForm = this.fb.nonNullable.group({
    odontologoId: [0, [Validators.required, Validators.min(1)]],
    fechaHora: ['', Validators.required],
    motivo: ['', Validators.required]
  });

  ngOnInit() {
    this.establecerFechaMinima();
    
    // Obtenemos el ID del paciente logueado
    const usuarioId = this.authService.getUsuarioId() || Number(localStorage.getItem('user_id_cliente'));
    
    if (usuarioId) {
      this.portalService.obtenerMiPerfil(usuarioId).subscribe({
        next: (perfil) => {
          this.paciente.set(perfil);
          this.cargarMisCitas(perfil.id);
        },
        error: () => this.cargando.set(false)
      });
    } else {
      if (typeof window !== 'undefined') {
        this.cerrarSesion();
      }
    }
  }

  establecerFechaMinima() {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    this.minFechaHora = ahora.toISOString().slice(0, 16);
  }

  cargarMisCitas(pacienteId: number) {
    this.portalService.misCitas(pacienteId).subscribe({
      next: (data) => {
        // Ordenamos las citas de la más reciente a la más antigua
        const ordenadas = data.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
        this.citas.set(ordenadas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // ---- Lógica del Modal ----
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
        this.mostrarMensajeTemporal('exito', 'Cita agendada correctamente. Nos vemos pronto.');
        setTimeout(() => this.cerrarModal(), 1500);
      },
      error: (err) => {
        this.guardandoCita.set(false);
        this.mensajeFeedback.set({
            tipo: 'error', 
            texto: err.error?.message || 'Error al agendar. Verifica disponibilidad o intenta con otra fecha.'
        });
      }
    });
  }

  mostrarMensajeTemporal(tipo: 'exito' | 'error', texto: string) {
      this.mensajeFeedback.set({ tipo, texto });
      if (tipo === 'exito') {
          setTimeout(() => this.mensajeFeedback.set(null), 4000);
      }
  }

  // ---- Descarga de PDF ----
  descargarReceta(citaId: number) {
    this.portalService.descargarReceta(citaId).subscribe({
      next: (blob: Blob) => {
        // 1. Creamos una URL temporal con los datos binarios del PDF
        const url = window.URL.createObjectURL(blob);
        
        // 2. Creamos un enlace <a> invisible en HTML para forzar la descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receta_Medica_Cita_${citaId}.pdf`; // Nombre del archivo a guardar
        document.body.appendChild(a);
        a.click(); // Simulamos el clic de descarga
        
        // 3. Limpiamos la memoria del navegador
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        alert('Lo sentimos, hubo un problema al descargar la receta. Es posible que el doctor aún no haya emitido el documento.');
      }
    });
  }
  
  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}