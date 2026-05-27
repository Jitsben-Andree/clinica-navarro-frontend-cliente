import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Router,
  RouterModule,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { PortalService } from '../../core/services/portal';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './portal.html',
  styleUrls: ['./portal.css']
})
export class PortalComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private portalService = inject(PortalService);
  private router = inject(Router);

  pacienteNombre = signal<string>('Paciente');

  menuAbierto = signal<boolean>(false);

  mostrarBienvenida = signal<boolean>(false);

  private timeoutBienvenida: any;

  ngOnInit() {

    this.cargarPerfil();
  }

  ngOnDestroy() {

    if (this.timeoutBienvenida) {

      clearTimeout(this.timeoutBienvenida);
    }
  }

  private cargarPerfil() {

    let usuarioId = this.authService.getUsuarioId();

    if (!usuarioId && typeof window !== 'undefined') {

      const storedId =
        localStorage.getItem('user_id_cliente');

      usuarioId =
        storedId ? Number(storedId) : null;
    }

    if (usuarioId && !isNaN(usuarioId)) {

      this.portalService.obtenerMiPerfil(usuarioId)
        .subscribe({

          next: (perfil) => {

            if (perfil?.nombres) {

              const nombreCorto =
                perfil.nombres.split(' ')[0];

              this.pacienteNombre.set(nombreCorto);
            }

            this.ejecutarBienvenida();
          },

          error: (error) => {

            console.error(
              'Error al mapear credenciales del paciente:',
              error
            );

            this.pacienteNombre.set('Paciente');

            this.ejecutarBienvenida();
          }
        });

    } else {

      console.warn(
        'ID de usuario no resoluble en sesión activa'
      );

      this.forzarCerrarSesion();
    }
  }

  private ejecutarBienvenida() {

    this.mostrarBienvenida.set(true);

    this.timeoutBienvenida = setTimeout(() => {

      this.mostrarBienvenida.set(false);

    }, 4500);
  }

  toggleMenu() {

    this.menuAbierto.update(val => !val);
  }

  cerrarSesion() {

    if (typeof window !== 'undefined') {

      const confirmar = window.confirm(
        '¿Estás seguro de que deseas salir de tu portal de salud?'
      );

      if (confirmar) {

        this.forzarCerrarSesion();
      }
    }
  }

  private forzarCerrarSesion() {

    this.authService.cerrarSesion();

    this.router.navigate(['/login']);
  }
}