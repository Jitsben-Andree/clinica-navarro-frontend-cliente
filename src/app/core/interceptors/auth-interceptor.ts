import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID); // Inyectamos el ID de plataforma
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
      // Si el servidor responde con 401 (No autorizado) Y estamos en el navegador
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        authService.cerrarSesion(); // Limpiamos el localStorage
        router.navigate(['/login']); // Redirigimos al usuario a iniciar sesión
      }
      return throwError(() => error);
    })
  );
};