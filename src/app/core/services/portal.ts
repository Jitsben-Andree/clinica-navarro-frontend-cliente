import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api';

  // Obtiene los datos del paciente logueado
  obtenerMiPerfil(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pacientes/usuario/${usuarioId}`);
  }

  // Lista el historial de citas
  misCitas(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/citas/paciente/${pacienteId}`);
  }

  // Descarga el PDF de la receta
  descargarReceta(citaId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/recetas/cita/${citaId}/pdf`, { responseType: 'blob' });
  }
}