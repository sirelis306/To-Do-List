import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../services/calendar/calendar.service';
import { UserService } from '../../../services/user/userService';
import { Evento } from '../../../models/evento';
import { User } from '../../../models/user';
import { CustomDropdown } from '../../shared/custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdown],
  templateUrl: './add-event-modal.html',
  styleUrl: './add-event-modal.css'
})
export class AddEventModal implements OnInit {
  @Input() eventToEdit: Evento | null = null;
  @Input() selectedDate: Date | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() eventAdded = new EventEmitter<Evento>();
  @Output() eventUpdated = new EventEmitter<Evento>();

  public title: string = '';
  public place: string = '';
  public placeOtro: string = '';
  public category: string = '';
  public participants: number[] = [];
  public isCompanyWide: boolean = false;
  public tipoEvento: string = '';
  public cliente: string = '';
  public clienteOtro: string = '';
  public proveedor: string = '';

  get selectedParticipantIds(): number[] {
    return this.selectedParticipantsList.map(u => u.id);
  }

  get participantOptions(): any[] {
    return this.availableUsers.map(u => ({
      label: `${u.nombre} ${u.apellido}`,
      value: u.id,
      original: u
    }));
  }

  // Eventos disponibles
  public description: string = '';
  public date: string = '';
  public startAt: string = '';
  public endAt: string = '';

  public salas: string[] = ['disrupcion', 'evolucion', 'sala de juntas', 'expansion', 'direccion', 'fuerza', 'baños negros', 'baños blancos', 'recepción', 'otro'];
  public availableUsers: User[] = [];
  public selectedParticipantsList: User[] = [];

  public colorCategories = [
    { name: 'Verde', color: '#4caf50' },
    { name: 'Azul', color: '#2196f3' },
    { name: 'Morado', color: '#9c27b0' },
    { name: 'Rojo', color: '#f44336' },
    { name: 'Naranja', color: '#ff9800' }
  ];

  public selectedColorHex: string = '';

  public errorMessage: string = '';

  public categoryOptions = [
    { label: 'Reunión', value: 'reunion' },
    { label: 'Evento', value: 'evento' },
    { label: 'Recordatorio', value: 'recordatorio' },
    { label: 'Mantenimiento/Reparaciones', value: 'mantenimiento' }
  ];

  public visibilityOptions = [
    { label: 'Público (Intranet)', value: true },
    { label: 'Privado', value: false }
  ];

  public clientOptions = [
    { label: 'Movilnet', value: 'movilnet' },
    { label: 'Otro', value: 'otro' }
  ];

  get salaOptions(): any[] {
    return this.salas.map(s => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s
    }));
  }

  constructor(
    private calendarService: CalendarService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    if (this.eventToEdit) {
      this.title = this.eventToEdit.title || '';
      this.description = this.eventToEdit.description || '';
      if (!this.eventToEdit.place) {
        this.place = '';
        this.placeOtro = '';
      } else {
        const placeLower = this.eventToEdit.place.toLowerCase();
        if (this.salas.includes(placeLower) && placeLower !== 'otro') {
          this.place = placeLower;
        } else {
          this.place = 'otro';
          this.placeOtro = this.eventToEdit.place;
        }
      }
      this.date = this.eventToEdit.date || '';
      if (this.eventToEdit.startAt) {
        try {
          const d = new Date(this.eventToEdit.startAt);
          if (!isNaN(d.getTime())) {
            const h = d.getHours().toString().padStart(2, '0');
            const m = d.getMinutes().toString().padStart(2, '0');
            this.startAt = `${h}:${m}`;
          }
        } catch (e) {}
      }
      if (this.eventToEdit.endAt) {
        try {
          const d = new Date(this.eventToEdit.endAt);
          if (!isNaN(d.getTime())) {
            const h = d.getHours().toString().padStart(2, '0');
            const m = d.getMinutes().toString().padStart(2, '0');
            this.endAt = `${h}:${m}`;
          }
        } catch (e) {}
      }
      this.isCompanyWide = this.eventToEdit.isCompanyWide || false;
      this.tipoEvento = this.eventToEdit.tipoEvento || '';
      if (this.eventToEdit.tags) {
        const typeTag = this.eventToEdit.tags.find(t => ['reunion', 'evento', 'recordatorio'].includes(t.toLowerCase()));
        if (typeTag) {
          this.tipoEvento = typeTag.toLowerCase();
        }
      }

      if (!this.eventToEdit.cliente) {
        this.cliente = '';
        this.clienteOtro = '';
      } else {
        const found = this.clientOptions.find(c => c.value === this.eventToEdit?.cliente);
        this.cliente = found ? found.value : 'otro';
        if (this.cliente === 'otro') {
          this.clienteOtro = this.eventToEdit.cliente;
        }
      }
      
      let prov = this.eventToEdit.proveedor || '';
      if (!prov && this.eventToEdit.tags) {
        const provTag = this.eventToEdit.tags.find(t => t.startsWith('proveedor:'));
        if (provTag) prov = provTag.substring(10);
      }
      this.proveedor = prov;
      
      // El color del evento ahora se determina estrictamente por la categoría
      
      this.participants = this.eventToEdit.participants || [];
    } else {
      const initDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
      // Ajustar por la zona horaria local para evitar que se desplace un día atrás
      const offset = initDate.getTimezoneOffset() * 60000;
      const localDate = new Date(initDate.getTime() - offset);
      this.date = localDate.toISOString().split('T')[0];
    }

    this.userService.getUsers(1, 100).subscribe({
      next: (response) => {
        const data = response.data || response;
        this.availableUsers = data.map((u: any) => ({
          ...u,
          nombre: u.name || u.nombre,
          apellido: u.surname || u.apellido
        }));
        if (this.eventToEdit && this.participants.length > 0) {
          this.selectedParticipantsList = this.availableUsers.filter(u => this.participants.includes(u.id));
        }
      },
      error: (err) => console.error('Error al obtener usuarios', err)
    });
  }

  toggleParticipant(user: User) {
    const index = this.participants.indexOf(user.id);
    if (index > -1) {
      this.participants.splice(index, 1);
      this.selectedParticipantsList = this.selectedParticipantsList.filter(u => u.id !== user.id);
    } else {
      this.participants.push(user.id);
      this.selectedParticipantsList.push(user);
    }
  }

  isParticipantSelected(userId: number): boolean {
    return this.participants.includes(userId);
  }

  removeParticipant(userId: number) {
    this.participants = this.participants.filter(id => id !== userId);
    this.selectedParticipantsList = this.selectedParticipantsList.filter(u => u.id !== userId);
  }

  saveEvent() {
    this.errorMessage = ''; // reset
    if (!this.title) {
      this.errorMessage = 'Te faltó llenar el título del evento.';
      return;
    }
    if (!this.tipoEvento) {
      this.errorMessage = 'Te faltó seleccionar si es Evento, Reunión o Recordatorio.';
      return;
    }
    if (!this.date) {
      this.errorMessage = 'Te faltó seleccionar la fecha.';
      return;
    }

    const startDateTime = this.startAt && this.startAt.length === 5 ? `${this.date} ${this.startAt}:00` : null;
    const endDateTime = this.endAt && this.endAt.length === 5 ? `${this.date} ${this.endAt}:00` : null;

    const tagsArray = [];
    if (this.tipoEvento) tagsArray.push(this.tipoEvento);
    
    // Enviar siempre un color para evitar que el backend falle si espera tags[1]
    const colorMap: any = {
      'reunion': '#4caf50',
      'evento': '#2196f3',
      'recordatorio': '#9c27b0',
      'mantenimiento': '#ff9800'
    };
    tagsArray.push(colorMap[this.tipoEvento] || '#9e9e9e');

    if (this.tipoEvento === 'mantenimiento' && this.proveedor && this.proveedor.trim()) {
      tagsArray.push('proveedor:' + this.proveedor.trim());
    }

    const eventData: Evento = {
      title: this.title,
      description: this.description ? (this.description.trim() || null as any) : null,
      place: this.place === 'otro' ? (this.placeOtro.trim() || null as any) : (this.place ? this.place.trim() : null as any),
      date: this.date,
      startAt: startDateTime || null as any,
      endAt: endDateTime || null as any,
      tags: tagsArray,
      isCompanyWide: this.isCompanyWide,
      // Los siguientes campos se omiten si el API no los necesita,
      // la información de categoría y color ya va en 'tags'.
      participants: this.participants,
      cliente: this.cliente === 'otro' ? (this.clienteOtro.trim() || null as any) : (this.cliente || null)
    };

    if (this.eventToEdit && this.eventToEdit.id) {
      this.calendarService.updateEvent(this.eventToEdit.id, eventData).subscribe({
        next: () => {
          this.eventUpdated.emit({ ...eventData, id: this.eventToEdit!.id });
        },
        error: (err) => {
          console.error('Error al actualizar evento', err);
          this.errorMessage = err.error?.error || err.error?.message || 'Error al actualizar el evento.';
        }
      });
    } else {
      this.calendarService.createEvent(eventData).subscribe({
        next: () => {
          this.eventAdded.emit(eventData);
        },
        error: (err) => {
          console.error('Error al crear evento', err);
          this.errorMessage = err.error?.error || err.error?.message || 'Error al crear el evento.';
        }
      });
    }
  }
}
