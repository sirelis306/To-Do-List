import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { Tarea, EstadoTarea, Importancia } from '../../models/tarea';
import { TaskService } from '../../services/task/taskService';
import { KanbanColumn } from '../kanban-column/kanban-column';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AddTaskModal } from '../add-task-modal/add-task-modal';
import { CustomDropdown } from '../custom-dropdown/custom-dropdown';
import { TaskDetailModal } from '../task-detail-modal/task-detail-modal';
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-board',
  imports: [CommonModule, FormsModule, KanbanColumn, DragDropModule, AddTaskModal, MatFormFieldModule, MatSelectModule, CustomDropdown, TaskDetailModal], 
  templateUrl: './board.html', 
  styleUrl: './board.css',
  standalone: true,
})

export class Board {
  public tareasBacklog: Tarea[] = [];
  public tareasPorHacer: Tarea[] = [];
  public tareasEnProgreso: Tarea[] = [];
  public tareasHechas: Tarea[] = [];
  public terminoBusqueda: string = "";
  public mostrarModal: boolean = false;
  public categoriasParaFiltrar: string[] = [];
  public filtroCategoria: string = "";
  public mostrarDetalleModal: boolean = false;
  public tareaSeleccionadaParaDetalle: Tarea | null = null;
 
  constructor(private taskService: TaskService, private authService: AuthService) {
  }
  
  ngOnInit(): void {
    this.actualizarListas();
    this.cargarFiltrosDeCategoria();
  }

  cargarFiltrosDeCategoria(): void {
    this.categoriasParaFiltrar = this.taskService.getCategorias();
  }

  onAgregarTarea(nuevaTarea: { titulo: string, categoria: string, importancia: Importancia, subtareas: string[]}) {
    this.taskService.agregarTarea(nuevaTarea.titulo, nuevaTarea.categoria, nuevaTarea.importancia, nuevaTarea.subtareas); 
    this.actualizarListas();      
    this.mostrarModal = false;     
  }

  actualizarListas() {
    this.tareasBacklog = this.taskService.getTareasPorEstado('backlog', this.terminoBusqueda, this.filtroCategoria);
    this.tareasPorHacer = this.taskService.getTareasPorEstado('por_hacer', this.terminoBusqueda, this.filtroCategoria);
    this.tareasEnProgreso = this.taskService.getTareasPorEstado('en_progreso', this.terminoBusqueda, this.filtroCategoria);
    this.tareasHechas = this.taskService.getTareasPorEstado('completada', this.terminoBusqueda, this.filtroCategoria);
  }

  onFiltroChange(categoria: string) {
    this.filtroCategoria = categoria;
    this.actualizarListas();
  }

  onEliminarTarea(id: number) {
      this.taskService.eliminarTarea(id);
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
    this.taskService.moverTarea(tarea.id, nuevoEstado);
    this.actualizarListas();
  }

  
}

