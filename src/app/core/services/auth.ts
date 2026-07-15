import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/env';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID); // Inyectamos para validar SSR vs Navegador
  private API_URL = `${environment.apiUrl}`;
  private readonly apiUrl = `${this.API_URL}/auth`; 
  private readonly TOKEN_KEY = 'jwt_token';

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId) && response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem('user_role_cliente', response.rol);
          localStorage.setItem('user_id_cliente', response.usuarioId.toString());
        }
      })
    );
  }

  estaLogueado(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.obtenerToken();
      if (!token) return false;

      // Si el token expiró, cerramos sesión automáticamente
      if (this.isTokenExpired(token)) {
        this.cerrarSesion();
        return false;
      }
      return true;
    }
    // En SSR devolvemos false por defecto para evitar hidrataciones erróneas
    return false;
  }

  obtenerToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getUsuarioId(): number | null {
    if (isPlatformBrowser(this.platformId)) {
      const id = localStorage.getItem('user_id_cliente');
      return id ? parseInt(id, 10) : null;
    }
    return null;
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('user_role_cliente');
      localStorage.removeItem('user_id_cliente');
    }
  }

  private isTokenExpired(token: string): boolean {
    // PROTECCIÓN SSR: Si no estamos en el navegador, no podemos usar window.atob
    if (!isPlatformBrowser(this.platformId)) {
      return false; 
    }

    try {
      const payloadBase64 = token.split('.')[1];
      let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      
      // Rellenar con '=' para que la longitud sea múltiplo de 4
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