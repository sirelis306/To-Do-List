import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tarea, Subtarea, Importancia, EstadoTarea } from '../../models/tarea';
import { Task } from '../../services/task/task';
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
  public editandoTitulo: boolean = false;
  public nuevoTituloTarea: string = "";

  public opcionesImportancia: string[] = Object.values(Importancia);
  public estadoLabels: { [key in EstadoTarea]: string } = {'por_hacer': 'Por Hacer', 'en_progreso': 'En Progreso', 'completada': 'Completada'};
  public opcionesEstado: string[] = ['Por Hacer', 'En Progreso', 'Completada'];
  public categoriasParaDropdown: string[] = [];

  constructor(private task: Task) { }

  ngOnInit(): void {
    this.nuevoTituloTarea = this.tarea.titulo;
    this.categoriasParaDropdown = this.task.getCategorias();
  }

  onCerrar(): void {
    this.cerrarModal.emit();
  }

  onGuardar(): void {
    this.tareaActualizada.emit(); 
    this.onCerrar(); 
  }

  guardarTitulo(): void {
    if (this.nuevoTituloTarea.trim() !== '' && this.nuevoTituloTarea !== this.tarea.titulo) {
      this.tarea.titulo = this.nuevoTituloTarea.trim();
      this.tareaActualizada.emit();
    }
    this.editandoTitulo = false;
  }

  agregarSubtarea(): void {
    if (this.nuevoSubtareaDescripcion.trim() === '') return;

    this.task.agregarSubtarea(this.tarea.id, this.nuevoSubtareaDescripcion.trim());
    this.nuevoSubtareaDescripcion = "";
    this.tareaActualizada.emit();
  }

  marcarSubtarea(subtarea: Subtarea): void {
    this.task.marcarSubtarea(this.tarea.id, subtarea.id, !subtarea.completada);
    this.tareaActualizada.emit(); 
  }

  eliminarSubtarea(subtareaId: number): void {
    this.task.eliminarSubtarea(this.tarea.id, subtareaId);
    this.tareaActualizada.emit(); 
  }
  public get totalSubtareas(): number {
    return this.tarea.subtareas?.length || 0;
  }

  public get subtareasCompletadas(): number {
    if (!this.tarea.subtareas) {
      return 0;
    }
    return this.tarea.subtareas.filter(s => s.completada).length;
  }

  onCategoriaChange(nuevaCategoria: string): void {
    this.tarea.categoria = nuevaCategoria;
    this.tareaActualizada.emit();
  }

  onImportanciaChange(nuevaImportancia: string): void {
    this.tarea.importancia = nuevaImportancia as Importancia;
    this.tareaActualizada.emit(); 
  }

  onEstadoChange(nuevaEtiqueta: string): void { 
    const nuevoValor = Object.keys(this.estadoLabels).find(key => this.estadoLabels[key as EstadoTarea] === nuevaEtiqueta);

    if (nuevoValor) {
      this.task.moverTarea(this.tarea.id, nuevoValor as EstadoTarea);
      this.tareaActualizada.emit(); 
    }
  }
}
