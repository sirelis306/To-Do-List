import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Tarea, Importancia } from '../../models/tarea';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule, DragDropModule, TitleCasePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCard {
  @Input() tarea!: Tarea;
  @Output() eliminar = new EventEmitter<number>();
  @Output() cardClicked = new EventEmitter<Tarea>();

  constructor() {}

  onEliminar() {
    this.eliminar.emit(this.tarea.id);
  }
  
  onCardClick(): void {
    this.cardClicked.emit(this.tarea);
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
