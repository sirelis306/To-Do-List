import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CategoryAutocomplete } from '../category-autocomplete/category-autocomplete';
import { Importancia } from '../../models/tarea';
import { CustomDropdown } from '../custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-add-task-modal',
  imports: [CommonModule, FormsModule, CategoryAutocomplete, CustomDropdown],
  templateUrl: './add-task-modal.html',
  styleUrl: './add-task-modal.css',
})
export class AddTaskModal {
  public nuevaTareaTitulo: string = "";
  public nuevaTareaCategoria: string = "";
  public nuevaTareaImportancia: Importancia = Importancia.baja;
  public opcionesImportancia: string[] = Object.values(Importancia);

  @Output() tareaAgregada = new EventEmitter<{ titulo: string, categoria: string, importancia:Importancia }>();
  @Output() cerrarModal = new EventEmitter<void>();

  constructor() { }

  onImportanciaChange(valor: string) {
    this.nuevaTareaImportancia = valor as Importancia;
  }

  onCategoriaCambia(categoria: string): void {
    this.nuevaTareaCategoria = categoria;
  }

  onAgregarTarea() {
    if (this.nuevaTareaTitulo.trim() === "") return;
    this.tareaAgregada.emit({
      titulo: this.nuevaTareaTitulo,
      categoria: this.nuevaTareaCategoria.trim() || 'General',
      importancia: this.nuevaTareaImportancia
    });
    
    this.nuevaTareaTitulo = "";
  }

  get ImportanciaEnum() {
    return Object.values(Importancia);
  }

  onCerrar() {
    this.cerrarModal.emit();
  }
}
