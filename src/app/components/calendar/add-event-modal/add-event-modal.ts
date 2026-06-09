import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  @Output() closeModal = new EventEmitter<void>();
  @Output() eventAdded = new EventEmitter<Evento>();

  public title: string = '';
  public place: string = '';
  public category: string = '';
  public participants: number[] = [];
  public isCompanyWide: boolean = false;
  public tipoEvento: string = '';
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

  public salas: string[] = ['disrupcion', 'evolucion', 'sal de juntas', 'expansion', 'direccion'];
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
    // Establecer la fecha predeterminada a hoy
    const today = new Date();
    this.date = today.toISOString().split('T')[0];

    // Cargar usuarios para el dropdown de participantes
    this.userService.getUsers(1, 100).subscribe({
      next: (response) => {
        // Manejar response.data o response directamente dependiendo del backend
        const data = response.data || response;
        this.availableUsers = data.map((u: any) => ({
          ...u,
          nombre: u.name || u.nombre,
          apellido: u.surname || u.apellido
        }));
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

    // Construir strings de fecha y hora
    const startDateTime = this.startAt ? `${this.date}T${this.startAt}:00` : undefined;
    const endDateTime = this.endAt ? `${this.date}T${this.endAt}:00` : undefined;

    const newEvent: Evento = {
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
      participantCount: this.participantCount
    };

    this.calendarService.createEvent(newEvent).subscribe({
      next: () => {
        this.eventAdded.emit(newEvent);
      },
      error: (err) => {
        console.error('Error al crear evento', err);
        // Fallback para demo si la API falla
        this.eventAdded.emit(newEvent);
      }
    });
  }
}
