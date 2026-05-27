import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalService } from '../../../core/services/portal';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-mi-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-historial.html'
})
export class MiHistorialComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AuthService);

  cargando = signal<boolean>(true);
  ficha = signal<any>(null);
  dientes = signal<any[]>(this.generarDientesVacios());

  ngOnInit() {
    const usuarioId = this.authService.getUsuarioId();
    if (usuarioId) {
      this.portalService.obtenerMiPerfil(usuarioId).subscribe({
        next: (perfil) => this.cargarFichaYOdontograma(perfil.id),
        error: () => this.cargando.set(false)
      });
    }
  }

  cargarFichaYOdontograma(pacienteId: number) {
    this.portalService.obtenerMiFicha(pacienteId).subscribe({
      next: (ficha) => {
        this.ficha.set(ficha);
        
        // Si tiene ficha, buscamos su odontograma
        if (ficha.id) {
          this.portalService.obtenerMiOdontograma(ficha.id).subscribe({
            next: (odonto) => {
              const base = this.generarDientesVacios();
              if (odonto.detalles && odonto.detalles.length > 0) {
                odonto.detalles.forEach((d: any) => {
                  const idx = base.findIndex(b => b.numeroPieza === d.numeroPieza);
                  if (idx !== -1) base[idx] = d;
                });
              }
              this.dientes.set(base);
              this.cargando.set(false);
            }
          });
        } else {
          this.cargando.set(false);
        }
      },
      error: () => this.cargando.set(false)
    });
  }

  generarDientesVacios(): any[] {
    const piezas = [
      18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28,
      48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38
    ];
    return piezas.map(p => ({ numeroPieza: p, estadoDiagnostico: 'Sano', observaciones: '' }));
  }

  getColorDiente(estado: string): string {
    switch(estado) {
      case 'Caries': return 'bg-red-500 text-white border-red-700 shadow-red-200';
      case 'Curación': return 'bg-blue-500 text-white border-blue-700 shadow-blue-200';
      case 'Ausente': return 'bg-gray-800 text-gray-300 border-gray-900 opacity-80';
      case 'Extracción Indicada': return 'bg-orange-500 text-white border-orange-700 shadow-orange-200';
      case 'Endodoncia': return 'bg-purple-500 text-white border-purple-700 shadow-purple-200';
      default: return 'bg-white text-gray-800 border-gray-200 shadow-sm';
    }
  }
}