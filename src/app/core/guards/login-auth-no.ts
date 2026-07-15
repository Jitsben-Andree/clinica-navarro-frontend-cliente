import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { isPlatformBrowser } from '@angular/common';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Si estamos en el servidor (SSR), permitimos el paso por defecto
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Si el usuario YA está logueado, lo mandamos directo al portal
  if (authService.estaLogueado()) {
    router.navigate(['/portal']); 
    return false;
  }

  // Si no está logueado, le permitimos ver el Login
  return true;
};