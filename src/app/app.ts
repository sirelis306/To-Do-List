import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { Tarea, EstadoTarea, Importancia } from './models/tarea';
import { Task } from './services/task';
import { KanbanColumn } from './components/kanban-column/kanban-column';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AddTaskModal } from './components/add-task-modal/add-task-modal';
import { CustomDropdown } from './components/custom-dropdown/custom-dropdown';
import { TaskDetailModal } from './components/task-detail-modal/task-detail-modal';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, KanbanColumn, DragDropModule, AddTaskModal, MatFormFieldModule, MatSelectModule, CustomDropdown, TaskDetailModal], 
  templateUrl: './app.html', 
  styleUrl: './app.css',
  standalone: true,
})

export class App implements OnInit {
  public tareasPorHacer: Tarea[] = [];
  public tareasEnProgreso: Tarea[] = [];
  public tareasHechas: Tarea[] = [];
  public terminoBusqueda: string = "";
  public mostrarModal: boolean = false;
  public categoriasParaFiltrar: string[] = [];
  public filtroCategoria: string = "";
  public mostrarDetalleModal: boolean = false;
  public tareaSeleccionadaParaDetalle: Tarea | null = null;
 
  constructor(private task: Task) {
  }
  
  ngOnInit(): void {
    this.actualizarListas();
    this.cargarFiltrosDeCategoria();
  }

  cargarFiltrosDeCategoria(): void {
    this.categoriasParaFiltrar = this.task.getCategorias();
  }

  onAgregarTarea(nuevaTarea: { titulo: string, categoria: string, importancia: Importancia}) {
    this.task.agregarTarea(nuevaTarea.titulo, nuevaTarea.categoria, nuevaTarea.importancia); 
    this.actualizarListas();      
    this.mostrarModal = false;     
  }

  actualizarListas() {
    this.tareasPorHacer = this.task.getTareasPorEstado('por_hacer', this.terminoBusqueda, this.filtroCategoria);
    this.tareasEnProgreso = this.task.getTareasPorEstado('en_progreso', this.terminoBusqueda, this.filtroCategoria);
    this.tareasHechas = this.task.getTareasPorEstado('completada', this.terminoBusqueda, this.filtroCategoria);
  }

  onFiltroChange(categoria: string) {
    this.filtroCategoria = categoria;
    this.actualizarListas();
  }

  onEliminarTarea(id: number) {
      this.task.eliminarTarea(id);
      this.actualizarListas();
  }

  onTaskCardClicked(tarea: Tarea): void {
    this.tareaSeleccionadaParaDetalle = tarea;
    this.mostrarDetalleModal = true;
  }

  onTareaDropped(event: CdkDragDrop<Tarea[]>) {
    if (event.previousContainer === event.container) {

      return;
    }
    
    const tarea = event.item.data as Tarea;
    const nuevoEstado = event.container.id as EstadoTarea; 
    this.task.moverTarea(tarea.id, nuevoEstado);
    this.actualizarListas();
  }
}
