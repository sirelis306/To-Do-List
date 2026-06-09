import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { Tarea, EstadoTarea, Importancia } from '../../models/tarea';
import { TaskService } from '../../services/task/taskService';
import { KanbanColumn } from './kanban-column/kanban-column';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AddTaskModal } from './add-task-modal/add-task-modal';
import { CustomDropdown } from '../shared/custom-dropdown/custom-dropdown';
import { TaskDetailModal } from './task-detail-modal/task-detail-modal';
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-board',
  imports: [CommonModule, FormsModule, KanbanColumn, DragDropModule, AddTaskModal, MatFormFieldModule, MatSelectModule, CustomDropdown, TaskDetailModal], 
  templateUrl: './board.html', 
  styleUrl: './board.css',
  standalone: true,
})

export class Board implements OnInit {
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
 
  public showConfirmModal: boolean = false;
  public showSuccessModal: boolean = false;
  public modalTitle: string = "";
  public modalMessage: string = "";
  private idTareaAEliminar: number | null = null;

  constructor(private taskService: TaskService, private authService: AuthService) {}
  
  ngOnInit(): void {
    this.actualizarListas();
    this.cargarFiltrosDeCategoria();
  }

  cargarFiltrosDeCategoria(): void {
    this.taskService.getCategorias().subscribe(cats => {
      this.categoriasParaFiltrar = cats;
    });
  }

  onAgregarTarea(nuevaTarea: { titulo: string, categoria: string, importancia: Importancia, subtareas: string[]}) {
    this.taskService.agregarTarea(nuevaTarea.titulo, nuevaTarea.categoria, nuevaTarea.importancia, nuevaTarea.subtareas).subscribe(() => {
      this.actualizarListas();      
      this.mostrarModal = false;
      this.modalTitle = "¡Tarea Creada!";
      this.modalMessage = `La tarea "${nuevaTarea.titulo}" ha sido agregada con éxito.`;
      this.showSuccessModal = true;
    });
  }

  actualizarListas() {
    this.taskService.getTareasPorEstado('backlog', this.terminoBusqueda, this.filtroCategoria).subscribe(tareas => this.tareasBacklog = tareas);
    this.taskService.getTareasPorEstado('por_hacer', this.terminoBusqueda, this.filtroCategoria).subscribe(tareas => this.tareasPorHacer = tareas);
    this.taskService.getTareasPorEstado('en_progreso', this.terminoBusqueda, this.filtroCategoria).subscribe(tareas => this.tareasEnProgreso = tareas);
    this.taskService.getTareasPorEstado('completada', this.terminoBusqueda, this.filtroCategoria).subscribe(tareas => this.tareasHechas = tareas);
  }

  onFiltroChange(categoria: string) {
    this.filtroCategoria = categoria;
    this.actualizarListas();
  }

  onEliminarTarea(id: number) {
    this.taskService.getTareaPorId(id).subscribe(tarea => {
      if (tarea) {
        this.idTareaAEliminar = id;
        this.modalTitle = "Confirmación";
        this.modalMessage = `¿Estás seguro de que quieres eliminar la tarea "${tarea.titulo}"?`;
        this.showConfirmModal = true;
      }
    });
  }

  onConfirmDelete() {
    if (this.idTareaAEliminar !== null) {
      this.taskService.eliminarTarea(this.idTareaAEliminar).subscribe(() => {
        this.actualizarListas();
        this.showConfirmModal = false;
        this.idTareaAEliminar = null;
      });
    }
  }

  onCancelDelete() {
    this.showConfirmModal = false;
    this.idTareaAEliminar = null;
  }

  onCloseSuccess() {
    this.showSuccessModal = false;
  }

  onTaskCardClicked(tarea: Tarea): void {
    this.tareaSeleccionadaParaDetalle = tarea;
    this.mostrarDetalleModal = true;
  }

  onTareaActualizada() {
    this.actualizarListas();
    this.modalTitle = "¡Tarea Actualizada!";
    this.modalMessage = "Los cambios han sido guardados correctamente.";
    this.showSuccessModal = true;
  }

  onTareaDropped(event: CdkDragDrop<Tarea[]>) {
    if (event.previousContainer === event.container) return;
    
    const tarea = event.item.data as Tarea;
    const nuevoEstado = event.container.id as EstadoTarea; 
    this.taskService.moverTarea(tarea.id, nuevoEstado).subscribe(() => {
      this.actualizarListas();
    });
  }
}

