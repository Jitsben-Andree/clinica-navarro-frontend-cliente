import { Routes } from '@angular/router';
import { LoginComponent } from './features/landing/auth/login/login';
import { PortalComponent } from './features/portal/portal';
import { MisCitasComponent } from './features/portal/mis-citas/mis-citas';
import { PerfilComponent } from './features/portal/mi-perfil/mi-perfil';
import { MiHistorialComponent } from './features/portal/mi-historial/mi-historial';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  { 
    path: 'portal', 
    component: PortalComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'mis-citas', pathMatch: 'full' },
      
      // RUTAS HIJAS
      { path: 'mis-citas', component: MisCitasComponent },
      { path: 'mi-historial', component: MiHistorialComponent },
      { path: 'mi-perfil', component: PerfilComponent }
    ]
  }
];