import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CancionesService {
  private http = inject(HttpClient);
  private apiUrl = 'https://proyecto-serverless-gamma.vercel.app/api/obtenerCanciones';

  // Buscar por ID
  buscarPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?id=${id}`);
  }

  // Obtener listado con filtros de límite y plataforma
  obtenerCanciones(limit: number = 20, platform: string = ''): Observable<any> {
    let url = `${this.apiUrl}?limit=${limit}`;
    if (platform) {
      url += `&platform=${encodeURIComponent(platform)}`;
    }
    return this.http.get<any>(url);
  }
}
