import { Routes } from '@angular/router';
import { LoginComponent } from './features/landing/auth/login/login';
import { PortalComponent } from './features/portal/portal';
import { MisCitasComponent } from './features/portal/mis-citas/mis-citas';
import { PerfilComponent } from './features/portal/mi-perfil/mi-perfil';
import { MiHistorialComponent } from './features/portal/mi-historial/mi-historial';

// Asegúrate de que estas rutas coincidan con la ubicación real de tus guards
import { authGuard } from './core/guards/auth-guard';
import { noAuthGuard } from './core/guards/login-auth-no';

export const routes: Routes = [
  // Redirección inicial
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Ruta pública protegida (solo para usuarios NO logueados)
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [noAuthGuard] 
  },
  
  // Rutas privadas protegidas (solo para usuarios SÍ logueados)
  { 
    path: 'portal', 
    component: PortalComponent,
    canActivate: [authGuard],
    children: [
      // Redirección por defecto al entrar al portal
      { path: '', redirectTo: 'mis-citas', pathMatch: 'full' },
      
      // RUTAS HIJAS DEL PORTAL
      { path: 'mis-citas', component: MisCitasComponent },
      { path: 'mi-historial', component: MiHistorialComponent },
      { path: 'mi-perfil', component: PerfilComponent }
    ]
  }
];