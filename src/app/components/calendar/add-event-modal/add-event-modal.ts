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
  public category: string = '';
  public participants: number[] = [];
  public isCompanyWide: boolean = false;
  public tipoEvento: string = 'evento';
  public cliente: string = '';
  public clienteOtro: string = '';
  public participantName: string = '';
  public participantCount: number = 1;

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

  public salas: string[] = ['disrupcion', 'evolucion', 'sala de juntas', 'expansion', 'direccion'];
  public availableUsers: User[] = [];
  public selectedParticipantsList: User[] = [];

  public colorCategories = [
    { name: 'Product Design', color: '#4caf50' },
    { name: 'Software Engineering', color: '#2196f3' },
    { name: 'User Research', color: '#9c27b0' },
    { name: 'Marketing', color: '#f44336' },
    { name: 'Tecnología', color: '#ff9800' }
  ];

  public categoryOptions = [
    { label: 'Reunión', value: 'reunion' },
    { label: 'Evento', value: 'evento' },
    { label: 'Recordatorio', value: 'recordatorio' }
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
      this.place = this.eventToEdit.place || '';
      this.date = this.eventToEdit.date || '';
      if (this.eventToEdit.startAt) this.startAt = this.eventToEdit.startAt.includes('T') ? this.eventToEdit.startAt.split('T')[1].substring(0,5) : this.eventToEdit.startAt;
      if (this.eventToEdit.endAt) this.endAt = this.eventToEdit.endAt.includes('T') ? this.eventToEdit.endAt.split('T')[1].substring(0,5) : this.eventToEdit.endAt;
      this.isCompanyWide = this.eventToEdit.isCompanyWide || false;
      this.tipoEvento = this.eventToEdit.tipoEvento || '';
      this.cliente = this.clientOptions.find(c => c.value === this.eventToEdit?.cliente) ? (this.eventToEdit!.cliente || '') : 'otro';
      if (this.cliente === 'otro') this.clienteOtro = this.eventToEdit.cliente || '';
      this.participantName = this.eventToEdit.participantName || '';
      this.participantCount = this.eventToEdit.participantCount || 1;
      const matchedCat = this.colorCategories.find(c => c.color === this.eventToEdit?.color);
      if (matchedCat) this.category = matchedCat.name;
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
    if (!this.title || !this.date) return;

    const startDateTime = this.startAt ? `${this.date}T${this.startAt}:00` : undefined;
    const endDateTime = this.endAt ? `${this.date}T${this.endAt}:00` : undefined;

    const color = this.colorCategories.find(c => c.name === this.category)?.color;

    const eventData: Evento = {
      title: this.title,
      description: this.description,
      place: this.place,
      date: this.date,
      startAt: startDateTime,
      endAt: endDateTime,
      tags: this.category ? [this.category] : [],
      isCompanyWide: this.isCompanyWide,
      participants: this.participants,
      tipoEvento: this.tipoEvento,
      cliente: this.cliente === 'otro' ? this.clienteOtro : this.cliente,
      participantName: this.participantName,
      participantCount: this.participantCount,
      color: color
    };

    if (this.eventToEdit && this.eventToEdit.id) {
      this.calendarService.updateEvent(this.eventToEdit.id, eventData).subscribe({
        next: () => {
          this.eventUpdated.emit({ ...eventData, id: this.eventToEdit!.id });
        },
        error: (err) => {
          console.error('Error al actualizar evento', err);
          this.eventUpdated.emit({ ...eventData, id: this.eventToEdit!.id });
        }
      });
    } else {
      this.calendarService.createEvent(eventData).subscribe({
        next: () => {
          this.eventAdded.emit(eventData);
        },
        error: (err) => {
          console.error('Error al crear evento', err);
          this.eventAdded.emit(eventData);
        }
      });
    }
  }
}
