import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://217.216.94.194:8080/api/auth';
  private readonly TOKEN_KEY = 'jwt_token';

  // NUEVO: Función auxiliar para comprobar si estamos en el navegador
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token && this.isBrowser()) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem('user_role_cliente', response.rol);
          localStorage.setItem('user_id_cliente', response.usuarioId.toString());
        }
      })
    );
  }

  estaLogueado(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  obtenerToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsuarioId(): number | null {
    if (!this.isBrowser()) return null;
    const id = localStorage.getItem('user_id_cliente');
    return id ? parseInt(id, 10) : null;
  }

  cerrarSesion(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('user_role_cliente');
      localStorage.removeItem('user_id_cliente');
    }
  }
}