import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();

  // Si hay un token guardado, lo clonamos en la cabecera de la petición
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Enviamos la petición y capturamos posibles errores del servidor
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde con 401 (No autorizado)
      if (error.status === 401) {
        authService.cerrarSesion(); // Limpiamos el localStorage
        router.navigate(['/login']); // Redirigimos al usuario a iniciar sesión
      }
      return throwError(() => error);
    })
  );
};