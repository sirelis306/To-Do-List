import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tarea, EstadoTarea } from '../../models/tarea';
import { TaskCard } from '../task-card/task-card';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

export interface MoverTareaEvento {
  taskId: number;
  nuevoEstado: EstadoTarea;
}

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, TaskCard, DragDropModule],
  templateUrl: './kanban-column.html',
  styleUrl: './kanban-column.css',
})
export class KanbanColumn { 
  @Input() titulo: string = "Columna";
  @Input() tareas: Tarea[] = []; 
  @Input() estado!: EstadoTarea; 

  @Output() tareaDropped = new EventEmitter<CdkDragDrop<Tarea[]>>();
  @Output() eliminarTarea = new EventEmitter<number>();

  constructor() {}

  onTareaDropped(event: CdkDragDrop<Tarea[]>) {
    this.tareaDropped.emit(event);
  }

  onEliminarDesdeTarjeta(taskId: number) {
    this.eliminarTarea.emit(taskId);
  }
}
