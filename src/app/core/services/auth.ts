import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/env';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}`;
  private readonly apiUrl = `${this.API_URL}/auth`; 
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
      const token = this.obtenerToken();
      if (!token) return false;

      // Si el token expiró, cerramos sesión automáticamente
      if (this.isTokenExpired(token)) {
        this.cerrarSesion();
        return false;
      }
      return true;
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

  private isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    // SOLUCIÓN: Rellenar con '=' para que la longitud sea múltiplo de 4
    // Esto evita que window.atob se rompa al recargar la página
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(window.atob(base64));
    
    // Verificamos el tiempo
    const expTime = payload.exp * 1000;
    return Date.now() >= expTime;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return true; 
  }
}
}