import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../services/task';

@Component({
  selector: 'app-category-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-autocomplete.html',
  styleUrl: './category-autocomplete.css'
})
export class CategoryAutocomplete implements OnInit {

  @Output() categoriaSeleccionada = new EventEmitter<string>();

  public terminoBusqueda: string = "";
  public sugerencias: string[] = [];
  public mostrarSugerencias: boolean = false;

  private todasLasCategorias: string[] = []; 

  constructor(private task: Task) { }

 
  ngOnInit(): void {
    this.todasLasCategorias = this.task.getCategorias();
  }

  onInput(): void {
    if (this.terminoBusqueda.trim() === '') {
      this.sugerencias = [];
      this.mostrarSugerencias = false;
      } else {
      this.sugerencias = this.todasLasCategorias.filter(c => 
        c.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
      );
      this.mostrarSugerencias = true;
    }

    this.categoriaSeleccionada.emit(this.terminoBusqueda.trim());
  }

  onSelectSugerencia(sugerencia: string): void {
    this.terminoBusqueda = sugerencia; 
    this.mostrarSugerencias = false;    
    this.categoriaSeleccionada.emit(this.terminoBusqueda.trim());
  }

  
  onBlur(): void {
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }
}
