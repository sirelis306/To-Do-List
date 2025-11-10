import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';


@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './custom-dropdown.html',
  styleUrl: './custom-dropdown.css'
})
export class CustomDropdown {
  @Input() label: string = "Filtrar";
  @Input() options: string[] = []; 
  @Input() selectedValue: string = "";

  @Output() valueChange = new EventEmitter<string>();

  public menuAbierto: boolean = false;

  constructor() { }

  seleccionarOpcion(opcion: string): void {
    this.valueChange.emit(opcion); 
    this.menuAbierto = false;  
  }

  getNombreSeleccion(): string {
    if (this.selectedValue === "") {
      return this.label; //
    }
    return this.selectedValue;
  }
}
