import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PortalService } from '../../../core/services/portal';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Validador personalizado (fuera de la clase para que sea una función pura)
export const matchPasswordsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('passwordNueva')?.value;
  const confirmPassword = control.get('confirmarPassword')?.value;
  return password === confirmPassword ? null : { mismatch: true };
};

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-perfil.html'
})
export class PerfilComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  usuario = signal<any>(null);
  editandoInfo = signal<boolean>(false);
  
  cargandoInfo = signal<boolean>(false);
  cargandoPass = signal<boolean>(false);
  mensajeInfo = signal<{tipo: 'exito'|'error', texto: string} | null>(null);
  mensajePass = signal<{tipo: 'exito'|'error', texto: string} | null>(null);

  perfilForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required]
  });

  // Aplicamos el validador cruzado al nivel del grupo (FormGroup)
  passwordForm = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', Validators.required]
  }, { validators: matchPasswordsValidator });

  ngOnInit() {
    let id = this.authService.getUsuarioId();
    if (!id && typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id_cliente');
      id = storedId ? Number(storedId) : null;
    }

    if (id && !isNaN(id)) {
      this.cargarPerfil(id);
    } else {
      if (typeof window !== 'undefined') this.cerrarSesion();
    }
  }

  cargarPerfil(id: number) {
    this.portalService.obtenerMiPerfil(id).subscribe({
      next: (data) => {
        this.usuario.set(data);
        this.perfilForm.patchValue({
          email: data.email,
          telefono: data.telefono
        });
      },
      error: () => this.mostrarMensaje('info', 'error', 'No se pudo cargar la información del perfil.')
    });
  }

  guardarDatosContacto() {
    if (this.perfilForm.invalid) return;
    
    this.cargandoInfo.set(true);
    this.mensajeInfo.set(null);
    
    this.portalService.actualizarPerfil(this.usuario().id, this.perfilForm.value).subscribe({
      next: (res) => {
        this.usuario.set(res);
        this.editandoInfo.set(false);
        this.cargandoInfo.set(false);
        this.mostrarMensaje('info', 'exito', 'Datos actualizados correctamente.');
      },
      error: (err) => {
        this.cargandoInfo.set(false);
        this.mostrarMensaje('info', 'error', err.error?.message || 'Error al actualizar datos.');
      }
    });
  }

  cambiarContrasena() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.cargandoPass.set(true);
    this.mensajePass.set(null);

    const request = {
      passwordActual: this.passwordForm.value.passwordActual,
      passwordNueva: this.passwordForm.value.passwordNueva
    };

    this.portalService.cambiarPassword(this.usuario().id, request).subscribe({
      next: () => {
        this.cargandoPass.set(false);
        this.passwordForm.reset();
        this.mostrarMensaje('pass', 'exito', '¡Tu contraseña ha sido cambiada por seguridad!');
      },
      error: (err) => {
        this.cargandoPass.set(false);
        this.mostrarMensaje('pass', 'error', err.error?.message || 'La contraseña actual es incorrecta.');
      }
    });
  }

  mostrarMensaje(tipoForm: 'info' | 'pass', tipoMsj: 'exito' | 'error', texto: string) {
    if (tipoForm === 'info') {
      this.mensajeInfo.set({ tipo: tipoMsj, texto });
      setTimeout(() => this.mensajeInfo.set(null), 4000);
    } else {
      this.mensajePass.set({ tipo: tipoMsj, texto });
      setTimeout(() => this.mensajePass.set(null), 4000);
    }
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}