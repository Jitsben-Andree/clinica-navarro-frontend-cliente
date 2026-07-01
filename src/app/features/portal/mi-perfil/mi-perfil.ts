import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PortalService } from '../../../core/services/portal';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export const matchPasswordsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('passwordNueva')?.value;
  const confirmPassword = control.get('confirmarPassword')?.value;
  return password === confirmPassword ? null : { mismatch: true };
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mi-perfil.html'
})
export class PerfilComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  usuario = signal<any>(null);
  editandoInfo = signal<boolean>(false);
  
  cargandoInfo = signal<boolean>(false);
  cargandoPass = signal<boolean>(false);
  cargandoCodigo = signal<boolean>(false);
  
  // Control de las 3 fases de seguridad
  codigoEnviado = signal<boolean>(false);
  passwordCambiada = signal<boolean>(false); // NUEVO ESTADO

  mensajeInfo = signal<{tipo: 'exito'|'error', texto: string} | null>(null);
  mensajePass = signal<{tipo: 'exito'|'error', texto: string} | null>(null);

  perfilForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required]
  });

  passwordForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', Validators.required]
  }, { validators: matchPasswordsValidator });

  ngOnInit() {
    const id = this.authService.getUsuarioId();
    if (id) {
      this.cargarPerfil(id);
    } else {
      if (typeof window !== 'undefined') this.cerrarSesion();
    }
  }

  cargarPerfil(id: number) {
    this.portalService.obtenerMiPerfil(id).subscribe(data => {
      this.usuario.set(data);
      this.perfilForm.patchValue({
        email: data.email,
        telefono: data.telefono
      });
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

  solicitarCodigo() {
    if (!this.usuario()?.email) return;

    this.cargandoCodigo.set(true);
    this.mensajePass.set(null);

    const url = 'http://localhost:8080/api/auth/forgot-password';

    this.http.post(url, { email: this.usuario().email }).subscribe({
      next: () => {
        this.codigoEnviado.set(true); 
        this.cargandoCodigo.set(false);
        this.mostrarMensaje('pass', 'exito', 'Código de seguridad enviado a tu correo. Revise su bandeja.');
      },
      error: (err) => {
        this.cargandoCodigo.set(false);
        this.mostrarMensaje('pass', 'error', 'Error de conexión. Intente nuevamente.');
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
      email: this.usuario().email,
      codigo: this.passwordForm.value.codigo,
      nuevaPassword: this.passwordForm.value.passwordNueva
    };

    const url = 'http://localhost:8080/api/auth/reset-password';

    this.http.post(url, request).subscribe({
      next: () => {
        this.cargandoPass.set(false);
        this.passwordForm.reset();
        
        // Magia UX: Ocultamos el formulario y mostramos el éxito permanente
        this.codigoEnviado.set(false); 
        this.passwordCambiada.set(true); 
        
        this.mostrarMensaje('pass', 'exito', '¡Tu contraseña ha sido cambiada y protegida con éxito!');
      },
      error: (err) => {
        this.cargandoPass.set(false);
        this.mostrarMensaje('pass', 'error', err.error?.message || 'El código ingresado es incorrecto o ha expirado.');
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