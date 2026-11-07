import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArcElement, Chart, PieController, Tooltip } from 'chart.js';
import { Subscription } from 'rxjs';
import { CancionesService } from './services/canciones';

Chart.register(PieController, ArcElement, Tooltip);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  private cancionesService = inject(CancionesService);
  private detalleSubscription?: Subscription;
  private grafico?: Chart<'pie'>;
  @ViewChild('graficoPlataformas') graficoPlataformas!: ElementRef<HTMLCanvasElement>;

  // Variables de estado
  canciones: any[] = [];
  totalRegistros: number | null = null;
  cancionEncontrada: Record<string, unknown> | null = null;

  limite: number = 20;
  plataforma: string = '';

  cargando: boolean = false;
  mensajeError: string = '';
  cargandoDetalle = false;
  errorDetalle = '';
  distribucion: { plataforma: string; cantidad: number; porcentaje: number; color: string }[] = [];

  ngOnInit() {
    this.cargarCanciones();
  }

  ngAfterViewInit() {
    this.grafico = new Chart(this.graficoPlataformas.nativeElement, {
      type: 'pie',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false },
    });
    this.actualizarGrafico();
  }

  ngOnDestroy() {
    this.detalleSubscription?.unsubscribe();
    this.grafico?.destroy();
  }

  // Cargar lista con filtros (límite y plataforma)
  cargarCanciones() {
    this.cargando = true;
    this.mensajeError = '';
    this.cancionesService.obtenerCanciones(this.limite, this.plataforma).subscribe({
      next: (res) => {
        if (res.exito) {
          this.canciones = res.data;
          this.totalRegistros = res.totalRegistros ?? null;
          this.calcularDistribucion();
        }
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = 'Error al cargar las canciones desde la Serverless Function.';
        this.cargando = false;
      },
    });
  }

  private calcularDistribucion() {
    const cantidades = new Map<string, { plataforma: string; cantidad: number }>();
    for (const cancion of this.canciones) {
      const plataforma =
        typeof cancion.platform === 'string' && cancion.platform.trim()
          ? cancion.platform.trim()
          : 'General';
      const clave = plataforma.toLowerCase();
      const actual = cantidades.get(clave);
      if (actual) {
        actual.cantidad++;
      } else {
        cantidades.set(clave, { plataforma, cantidad: 1 });
      }
    }
    const colores: Record<string, string> = {
      android: '#198754',
      ios: '#3867ae',
      windows: '#da8d23',
      'web player': '#ba4964',
      general: '#6c757d',
    };
    const otrosColores = ['#7b5ca5', '#287e82', '#bc623b', '#677d27'];
    let indiceColor = 0;
    this.distribucion = Array.from(cantidades.entries()).map(([clave, valor]) => ({
      ...valor,
      porcentaje: (valor.cantidad * 100) / this.canciones.length,
      color: colores[clave] ?? otrosColores[indiceColor++ % otrosColores.length],
    }));
    this.actualizarGrafico();
  }

  private actualizarGrafico() {
    if (!this.grafico) return;
    this.grafico.data.labels = this.distribucion.map((item) => item.plataforma);
    this.grafico.data.datasets[0].data = this.distribucion.map((item) => item.cantidad);
    this.grafico.data.datasets[0].backgroundColor = this.distribucion.map((item) => item.color);
    this.grafico.update();
  }

  verDetalle(id: string, dialogo: HTMLDialogElement) {
    this.detalleSubscription?.unsubscribe();
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.cancionEncontrada = null;
    dialogo.showModal();

    this.detalleSubscription = this.cancionesService.buscarPorId(id).subscribe({
      next: (res) => {
        if (res.exito && res.data) {
          this.cancionEncontrada = res.data;
        } else {
          this.errorDetalle = res.mensaje || 'No se encontró la canción.';
        }
        this.cargandoDetalle = false;
      },
      error: (err) => {
        this.errorDetalle = err.error?.mensaje || 'No se pudo cargar el detalle de la canción.';
        this.cargandoDetalle = false;
      },
    });
  }

  cerrarDetalle() {
    this.detalleSubscription?.unsubscribe();
    this.cancionEncontrada = null;
    this.cargandoDetalle = false;
    this.errorDetalle = '';
  }

  mostrarValor(valor: unknown): string {
    if (valor === null || valor === undefined) return 'N/A';
    return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
  }
}
