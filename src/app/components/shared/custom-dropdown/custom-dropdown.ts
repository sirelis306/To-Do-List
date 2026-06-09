import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';


@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-dropdown.html',
  styleUrl: './custom-dropdown.css'
})
export class CustomDropdown {
  @Input() label: string = "Filtrar";
  @Input() options: any[] = []; // Puede ser string[] o {label: string, value: string}[]
  @Input() selectedValue: string = "";
  @Input() icon: string = "fa-filter"; 

  @Output() valueChange = new EventEmitter<string>();

  public menuAbierto: boolean = false;

  constructor() { }

  seleccionarOpcion(opcion: any): void {
    const value = typeof opcion === 'string' ? opcion : opcion.value;
    this.valueChange.emit(value); 
    this.menuAbierto = false;  
  }

  getNombreSeleccion(): string {
    if (this.selectedValue === "") {
      return this.label;
    }
    const selected = this.options.find(op => (typeof op === 'string' ? op === this.selectedValue : op.value === this.selectedValue));
    if (selected) {
      return typeof selected === 'string' ? selected : selected.label;
    }
    return this.selectedValue;
  }

  getLabel(op: any): string {
    return typeof op === 'string' ? op : op.label;
  }
}
