import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, of } from 'rxjs';
import { Tarea, Subtarea, EstadoTarea, Importancia } from '../../models/tarea';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = '/api/board';
  private tareasCache: Tarea[] = [];

  constructor(private http: HttpClient) {}

  getTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(this.apiUrl).pipe(
      tap(tareas => this.tareasCache = tareas)
    );
  }

  getTareasPorEstado(estado: EstadoTarea, busqueda: string, categoria?: string): Observable<Tarea[]> {
    return this.getTareas().pipe(
      map(tareas => {
        let filtered = tareas.filter(t => t.estado === estado);
        if (busqueda.trim() !== "") {
          filtered = filtered.filter(t => t.titulo.toLowerCase().includes(busqueda.toLowerCase()));
        }
        if (categoria && categoria !== "") {
          filtered = filtered.filter(t => t.categoria === categoria);
        }
        return filtered;
      })
    );
  }

  getTareaPorId(id: number): Observable<Tarea | undefined> {
    return this.getTareas().pipe(
      map(tareas => tareas.find(t => t.id === id))
    );
  }

  getCategorias(): Observable<string[]> {
    return this.getTareas().pipe(
      map(tareas => {
        const cats = tareas.map(t => t.categoria).filter((c): c is string => !!c);
        return [...new Set(cats)];
      })
    );
  }

  agregarTarea(titulo: string, categoria: string, importancia: Importancia, subtareas: string[]): Observable<any> {
    const nuevaTarea = {
      title: titulo,
      category: categoria,
      importance: importancia,
      status: 'Por Hacer', // Estado inicial según API
      subTasks: subtareas.map(desc => ({ title: desc, isCompleted: false }))
    };
    return this.http.post(this.apiUrl, nuevaTarea);
  }

  moverTarea(id: number, nuevoEstado: EstadoTarea): Observable<any> {
    const tarea = this.tareasCache.find(t => t.id === id);
    if (!tarea) return of(null);

    const updatedData = { ...tarea, status: nuevoEstado };
    return this.http.put(`${this.apiUrl}/${id}`, updatedData);
  }

  actualizarTarea(tareaId: number, titulo: string, categoria: string, importancia: Importancia): Observable<any> {
    const tarea = this.tareasCache.find(t => t.id === tareaId);
    if (!tarea) return of(null);

    const updatedData = { ...tarea, title: titulo, category: categoria, importance: importancia };
    return this.http.put(`${this.apiUrl}/${tareaId}`, updatedData);
  }

  eliminarTarea(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Las subtareas en la API se manejan dentro del objeto Task, no hay endpoints individuales según el spec
  marcarSubtarea(tareaId: number, subtareaId: number, completada: boolean): Observable<any> {
    const tarea = this.tareasCache.find(t => t.id === tareaId);
    if (!tarea || !tarea.subtareas) return of(null);

    const subtareasActualizadas = tarea.subtareas.map(s => 
      s.id === subtareaId ? { ...s, completada: completada } : s
    );

    return this.http.put(`${this.apiUrl}/${tareaId}`, { ...tarea, subTasks: subtareasActualizadas });
  }

  agregarSubtarea(tareaId: number, descripcion: string): Observable<any> {
    const tarea = this.tareasCache.find(t => t.id === tareaId);
    if (!tarea) return of(null);

    const nuevasSubtareas = [...(tarea.subtareas || []), { id: Date.now(), descripcion, completada: false }];
    return this.http.put(`${this.apiUrl}/${tareaId}`, { ...tarea, subTasks: nuevasSubtareas });
  }

  eliminarSubtarea(tareaId: number, subtareaId: number): Observable<any> {
    const tarea = this.tareasCache.find(t => t.id === tareaId);
    if (!tarea || !tarea.subtareas) return of(null);

    const subtareasFiltradas = tarea.subtareas.filter(s => s.id !== subtareaId);
    return this.http.put(`${this.apiUrl}/${tareaId}`, { ...tarea, subTasks: subtareasFiltradas });
  }
}