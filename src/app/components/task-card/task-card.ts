import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Tarea, Importancia } from '../../models/tarea';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCard {
  @Input() tarea!: Tarea;
  @Output() eliminar = new EventEmitter<number>();

  constructor() {}

  onEliminar() {
    this.eliminar.emit(this.tarea.id);
  }

  getImportanciaClass(): string {
    switch (this.tarea.importancia) {
      case Importancia.alta: return 'flag-alta';
      case Importancia.media: return 'flag-media';
      case Importancia.baja: return 'flag-baja';
      default: return 'flag-baja'; 
    }
  }
}
