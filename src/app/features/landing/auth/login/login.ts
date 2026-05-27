import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login-paciente',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  mostrarPassword = signal<boolean>(false);
  
  private timeoutId: any;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  togglePassword() {
    this.mostrarPassword.update(val => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      const firstInvalid = document.querySelector('.ng-invalid');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set(null);

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.cargando.set(false);
        
        if (response && response.userId) {
          localStorage.setItem('user_id_cliente', response.userId.toString());
        }
        
        this.router.navigate(['/portal/mis-citas']);
      },
      error: (err) => {
        this.cargando.set(false);
        
        let errorMessage = 'Invalid email or password. Please try again.';
        
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (err.status === 404) {
            errorMessage = 'Service unavailable. Try again later.';
          } else if (err.status === 500) {
            errorMessage = 'Server error. Contact support.';
          }
        }
        
        this.mensajeError.set(errorMessage);
        
        this.timeoutId = setTimeout(() => {
          this.mensajeError.set(null);
        }, 5000);
      }
    });
  }
}