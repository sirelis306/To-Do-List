import { Injectable } from '@angular/core';
import { Tarea, Subtarea, EstadoTarea, Importancia } from '../models/tarea'

@Injectable({
  providedIn: 'root',
})

export class Task {
  private tareas: Tarea[] = [
    { id: 1, titulo: 'Salir a correr', estado: 'por_hacer', categoria: 'Salud', importancia: Importancia.media, subtareas: [
        { id: 101, descripcion: 'Preparar ropa deportiva', completada: false },
        { id: 102, descripcion: 'Estirar antes de salir', completada: false }
      ] },
    { id: 2, titulo: 'Comprar Comida', estado: 'en_progreso', categoria: 'Mercado', importancia: Importancia.alta, subtareas: [
        { id: 301, descripcion: 'Revisar email', completada: true },
        { id: 302, descripcion: 'Leer informe X', completada: false },
        { id: 303, descripcion: 'Preparar resumen para reunión', completada: false }
      ] },
    { id: 3, titulo: 'Hacer las asignaciones de la semana', estado: 'completada', categoria: 'Trabajo', importancia: Importancia.baja },
  ];
  private proximoId: number = 4;

  constructor() {}

  getTareasPorEstado(estado: EstadoTarea, busqueda: string, categoria?: string): Tarea[] {
    let tareas = this.tareas.filter(t => t.estado === estado);

      if (busqueda.trim() !== "") {
        tareas = tareas.filter(t => 
          t.titulo.toLowerCase().includes(busqueda.toLowerCase())
        );
      }
      if (categoria && categoria !== "") {
      tareas = tareas.filter(t => t.categoria === categoria);
      }

    return tareas;
  }

  getTareas(): Tarea[] {
    return this.tareas;
  }

  getCategorias(): string[] {
    const todasLasCategorias = this.tareas.map(t => t.categoria);
    const categoriasFiltradas = todasLasCategorias.filter((c): c is string => !!c);
    const categorias = new Set(categoriasFiltradas);

    return [...categorias];
  }

  agregarTarea(titulo: string, categoria: string, importancia: Importancia){
    if (titulo.trim()=== ""){
      return;
    }
    const nuevaTarea: Tarea = {
      id: this.proximoId,
      titulo: titulo,
      estado: 'por_hacer',
      categoria: categoria,
      importancia: importancia
    };
    this.tareas.push(nuevaTarea);
    this.proximoId++;
  }

  moverTarea(id: number, nuevoEstado: EstadoTarea){
    const tarea = this.tareas.find(t => t.id === id);
    if (tarea) {
      tarea.estado = nuevoEstado;
      console.log(`Tarea ${id} movida a ${nuevoEstado}`);
    }
  }

  eliminarTarea(id: number){
    this.tareas = this.tareas.filter(t => t.id !== id);
  }

  getSubtareasDeTarea(tareaId: number): Subtarea[] {
    const tarea = this.tareas.find(t => t.id === tareaId);
    return tarea?.subtareas || [];
  }

  agregarSubtarea(tareaId: number, descripcion: string): void {
    const tarea = this.tareas.find(t => t.id === tareaId);
    if (tarea) {
      if (!tarea.subtareas) {
        tarea.subtareas = [];
      }
      const nuevoSubtareaId = tarea.subtareas.length > 0 
      ? Math.max(...tarea.subtareas.map(s => s.id)) + 1 
      : 1;
      tarea.subtareas.push({ 
        id: nuevoSubtareaId, 
        descripcion: descripcion, 
        completada: false 
      });
    }
  }

  marcarSubtarea(tareaId: number, subtareaId: number, completada: boolean): void {
    const tarea = this.tareas.find(t => t.id === tareaId);
    const subtarea = tarea?.subtareas?.find(s => s.id === subtareaId);
    if (subtarea) {
      subtarea.completada = completada;
    }
  }

  eliminarSubtarea(tareaId: number, subtareaId: number): void {
    const tarea = this.tareas.find(t => t.id === tareaId);
    if (tarea?.subtareas) {
      tarea.subtareas = tarea.subtareas.filter(s => s.id !== subtareaId);
    }
  }

}