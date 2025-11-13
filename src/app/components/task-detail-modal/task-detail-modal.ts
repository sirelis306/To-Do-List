import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tarea, Subtarea, Importancia, EstadoTarea } from '../../models/tarea';
import { TaskService } from '../../services/task/taskService';
import { CustomDropdown } from '../custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdown],
  templateUrl: './task-detail-modal.html',
  styleUrl: './task-detail-modal.css',
})
export class TaskDetailModal {
  @Input() tarea!: Tarea; 
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() tareaActualizada = new EventEmitter<void>();

  public nuevoSubtareaDescripcion: string = "";
  public modoEdicion: boolean = false;
  public nuevoTituloTarea: string = "";

  public tempTitulo: string = "";
  public tempCategoria: string = "";
  public tempImportancia: Importancia = Importancia.baja;
  public tempEstado: EstadoTarea = 'backlog';
  public tempSubtareas: Subtarea[] = [];

  public opcionesImportancia: string[] = Object.values(Importancia);
  public estadoLabels: { [key in EstadoTarea]: string } = {'backlog': 'Backlog', 'por_hacer': 'Por Hacer', 'en_progreso': 'En Progreso', 'completada': 'Completada'};
  public opcionesEstado: string[] = ['Backlog', 'Por Hacer', 'En Progreso', 'Completada'];
  public categoriasParaDropdown: string[] = [];

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.nuevoTituloTarea = this.tarea.titulo;
    this.categoriasParaDropdown = this.taskService.getCategorias();
  }

  onCerrar(): void {
    this.modoEdicion = false;
    this.cerrarModal.emit();
  }

 onGuardar(): void {
    const originalSubtasks = this.tarea.subtareas ? [...this.tarea.subtareas] : [];
    const tempSubtasks = this.tempSubtareas;

    this.taskService.actualizarTarea(
        this.tarea.id,
        this.tempTitulo.trim(),
        this.tempCategoria,
        this.tempImportancia
    );
    
    const deletedSubs = originalSubtasks.filter(os => !tempSubtasks.some(ts => ts.id === os.id));
    for (const sub of deletedSubs) {
      this.taskService.eliminarSubtarea(this.tarea.id, sub.id);
    }

    for (const tempSub of tempSubtasks) {
      const originalSub = originalSubtasks.find(os => os.id === tempSub.id);

      if (!originalSub) {
        this.taskService.agregarSubtarea(this.tarea.id, tempSub.descripcion);
      } else if (originalSub.completada !== tempSub.completada) {
        this.taskService.marcarSubtarea(this.tarea.id, tempSub.id, tempSub.completada);
      }
    }
    
    if (this.tempEstado !== this.tarea.estado) {
      this.taskService.moverTarea(this.tarea.id, this.tempEstado); 
    }
    
    this.modoEdicion = false;
    this.tareaActualizada.emit(); 
    this.cerrarModal.emit(); 
}

  onActivarEdicion(): void {
    this.modoEdicion = true;
    this.tempTitulo = this.tarea.titulo;
    this.tempCategoria = this.tarea.categoria || '';
    this.tempImportancia = this.tarea.importancia || Importancia.baja;
    this.tempEstado = this.tarea.estado;
    this.tempSubtareas = this.tarea.subtareas ? this.tarea.subtareas.map(s => ({...s})) : [];
  }

  guardarTitulo(): void {
    if (this.nuevoTituloTarea.trim() !== '' && this.nuevoTituloTarea !== this.tarea.titulo) {
      this.tarea.titulo = this.nuevoTituloTarea.trim();
    }
  }

  agregarSubtarea(): void {
    if (this.nuevoSubtareaDescripcion.trim() === '') return;
    this.taskService.agregarSubtarea(this.tarea.id, this.nuevoSubtareaDescripcion.trim());
    this.nuevoSubtareaDescripcion = "";
        this.tareaActualizada.emit(); 
  }

  marcarSubtarea(subtarea: Subtarea): void {
    const sub = this.tempSubtareas.find(s => s.id === subtarea.id);
    if (sub) {
      sub.completada = !sub.completada; 
    }
  }

  eliminarSubtarea(subtareaId: number): void {
    this.tempSubtareas = this.tempSubtareas.filter(s => s.id !== subtareaId);
  }
  
  public get totalSubtareas(): number {
    const source = this.modoEdicion ? this.tempSubtareas : this.tarea.subtareas;
    return source?.length || 0;
  }
  public get subtareasCompletadas(): number {
    const source = this.modoEdicion ? this.tempSubtareas : this.tarea.subtareas;
    if (!source) return 0;
    return source.filter(s => s.completada).length;
  }

  onCategoriaChange(nuevaCategoria: string): void {
    this.tempCategoria = nuevaCategoria;
  }

  onImportanciaChange(nuevaImportancia: string): void {
    this.tempImportancia = nuevaImportancia as Importancia;
  }

  onEstadoChange(nuevaEtiqueta: string): void {
    const nuevoValor = Object.keys(this.estadoLabels).find(key => this.estadoLabels[key as EstadoTarea] === nuevaEtiqueta);
    
    if (nuevoValor) {
      this.tempEstado = nuevoValor as EstadoTarea;
    }
  }
}
