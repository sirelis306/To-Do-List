import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../services/calendar/calendar.service';
import { UserService } from '../../../services/user/userService';
import { Evento } from '../../../models/evento';
import { User } from '../../../models/user';

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-event-modal.html',
  styleUrl: './add-event-modal.css'
})
export class AddEventModal implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() eventAdded = new EventEmitter<Evento>();

  public title: string = '';
  public place: string = '';
  public category: string = '';
  public participants: number[] = []; // User IDs
  public isCompanyWide: boolean = false;
  public description: string = '';
  public date: string = '';
  public startAt: string = '';
  public endAt: string = '';

  public salas: string[] = ['disrupcion', 'evolucion', 'sal de juntas', 'expansion', 'direccion'];
  public availableUsers: User[] = [];
  public selectedParticipantsList: User[] = [];

  constructor(
    private calendarService: CalendarService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Set default date to today
    const today = new Date();
    this.date = today.toISOString().split('T')[0];
    
    // Load users for participants dropdown
    this.userService.getUsers(1, 100).subscribe({
      next: (response) => {
        // Handle response.data or response directly depending on backend
        this.availableUsers = response.data || response;
      },
      error: (err) => console.error('Error fetching users', err)
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

    // Build datetime strings
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
      participants: this.participants
    };

    this.calendarService.createEvent(newEvent).subscribe({
      next: () => {
        this.eventAdded.emit(newEvent);
      },
      error: (err) => {
        console.error('Error creating event', err);
        // Fallback for demo if API fails
        this.eventAdded.emit(newEvent);
      }
    });
  }
}
