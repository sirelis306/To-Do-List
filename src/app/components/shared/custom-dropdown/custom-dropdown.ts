import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
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
  @Input() options: any[] = [];
  @Input() selectedValue: any = "";
  @Input() icon: string = "fa-filter";
  @Input() multiSelect: boolean = false;
  @Input() selectedValues: any[] = [];
  @Input() showClearOption: boolean = false;
  @Input() dropup: boolean = false;

  @Output() valueChange = new EventEmitter<any>();
  @Output() toggleValue = new EventEmitter<any>();

  public menuAbierto: boolean = false;

  constructor(private elementRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.menuAbierto = false;
    }
  }

  seleccionarOpcion(opcion: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.multiSelect) {
      this.toggleValue.emit(opcion);
    } else {
      const value = typeof opcion === 'string' ? opcion : opcion.value;
      this.valueChange.emit(value);
      this.menuAbierto = false;
    }
  }

  isOptionSelected(opcion: any): boolean {
    if (!this.multiSelect) return false;
    const value = typeof opcion === 'string' ? opcion : opcion.value;
    return this.selectedValues.includes(value);
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
