import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://217.216.94.194:8080/api';

  // Obtiene los datos del paciente (nombre, id)
  obtenerMiPerfil(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pacientes/usuario/${usuarioId}`);
  }

  // Lista el historial de citas de este paciente
  misCitas(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/citas/paciente/${pacienteId}`);
  }

  // Descarga el PDF de la receta
  descargarReceta(citaId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/recetas/cita/${citaId}/pdf`, { responseType: 'blob' });
  }

  // Envía la solicitud para agendar una nueva cita desde el portal
  agendarCita(cita: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/citas`, cita);

  }
  
  actualizarPerfil(usuarioId: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pacientes/usuario/${usuarioId}/perfil`, datos);
  }

  cambiarPassword(usuarioId: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pacientes/usuario/${usuarioId}/password`, datos);
  }

  obtenerMiFicha(pacienteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fichas/paciente/${pacienteId}`);
  }

  obtenerMiOdontograma(fichaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/odontogramas/ficha/${fichaId}`);
  }
}