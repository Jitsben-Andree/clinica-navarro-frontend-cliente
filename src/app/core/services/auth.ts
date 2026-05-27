import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://217.216.94.194:8080/api/auth'; 
  private readonly TOKEN_KEY = 'jwt_token';

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (typeof window !== 'undefined' && response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem('user_role_cliente', response.rol);
          localStorage.setItem('user_id_cliente', response.usuarioId.toString());
        }
      })
    );
  }

  estaLogueado(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(this.TOKEN_KEY);
    }
    return false;
  }

  obtenerToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getUsuarioId(): number | null {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('user_id_cliente');
      return id ? parseInt(id, 10) : null;
    }
    return null;
  }

  cerrarSesion(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('user_role_cliente');
      localStorage.removeItem('user_id_cliente');
    }
  }
}