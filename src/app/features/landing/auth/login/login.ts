import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login-paciente',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        // Redirige al portal de pacientes
        this.router.navigate(['/portal/mis-citas']);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.error && err.error.message) {
          this.mensajeError.set(err.error.message);
        } else {
          this.mensajeError.set('Error de conexión con el servidor.');
        }
      }
    });
  }
}