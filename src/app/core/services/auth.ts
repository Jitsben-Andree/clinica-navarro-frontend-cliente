import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  // Inicia sesión y guarda el ID del usuario en localStorage
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.usuarioId) {
          localStorage.setItem('user_id_cliente', response.usuarioId.toString());
        }
      })
    );
  }

  // Obtiene el ID del usuario logueado para usarlo en otros servicios
  getUsuarioId(): number | null {
    const id = localStorage.getItem('user_id_cliente');
    return id ? parseInt(id, 10) : null;
  }

  // Limpia la sesión
  cerrarSesion(): void {
    localStorage.removeItem('user_id_cliente');
  }

  // Verifica si el usuario está logueado
  isLoggedIn(): boolean {
    return !!localStorage.getItem('user_id_cliente');
  }
}