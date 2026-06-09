import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar/calendar.service';
import { Evento } from '../../models/evento';
import { AddEventModal } from './add-event-modal/add-event-modal';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEventModal],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar implements OnInit {
  public currentDate = new Date();
  public currentWeek: Date[] = [];
  public hours: string[] = [];
  public events: Evento[] = [];
  public categories: { name: string, color: string, selected: boolean }[] = [
    { name: 'Product Design', color: '#4caf50', selected: true },
    { name: 'Software Engineering', color: '#2196f3', selected: true },
    { name: 'User Research', color: '#9c27b0', selected: true },
    { name: 'Marketing', color: '#f44336', selected: true },
    { name: 'Tecnología', color: '#ff9800', selected: true }
  ];
  
  public showAddEventModal = false;

  constructor(private calendarService: CalendarService) {
    this.generateHours();
  }

  ngOnInit(): void {
    this.updateWeek();
    this.loadEvents();
  }

  generateHours() {
    for (let i = 0; i < 24; i++) {
      this.hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
  }

  updateWeek() {
    this.currentWeek = [];
    const currentDay = this.currentDate.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1; // 0 is Sunday, we want Monday as first day
    
    const monday = new Date(this.currentDate);
    monday.setDate(this.currentDate.getDate() - distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      this.currentWeek.push(day);
    }
  }

  previousWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.updateWeek();
    this.loadEvents();
  }

  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.updateWeek();
    this.loadEvents();
  }

  loadEvents() {
    // Ideally we should pass start and end dates to filter, for now let's just get all
    const startStr = this.currentWeek[0].toISOString().split('T')[0];
    const endStr = this.currentWeek[6].toISOString().split('T')[0];
    
    this.calendarService.getEvents(startStr, endStr).subscribe({
      next: (events) => {
        this.events = events;
      },
      error: (err) => {
        console.error('Error fetching events, using mock data for demo', err);
        // Fallback mock data if API is not fully ready
        this.events = [
          {
            id: 1,
            title: 'Product Design Course',
            description: 'Design mockups',
            place: 'disrupcion',
            date: '2026-06-09',
            startAt: '2026-06-09T10:00:00',
            endAt: '2026-06-09T12:00:00',
            tags: ['Product Design'],
            isCompanyWide: false
          },
          {
            id: 2,
            title: 'Frontend development',
            description: 'Angular stuff',
            place: 'evolucion',
            date: '2026-06-12',
            startAt: '2026-06-12T11:00:00',
            endAt: '2026-06-12T13:00:00',
            tags: ['Software Engineering'],
            isCompanyWide: true
          }
        ];
      }
    });
  }

  onEventAdded() {
    this.showAddEventModal = false;
    this.loadEvents();
  }

  getEventsForDay(date: Date): Evento[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(e => {
      // Check if event startAt falls in this day, or if it's an all day event check date
      if (e.startAt) {
        return e.startAt.startsWith(dateStr);
      }
      return e.date === dateStr;
    });
  }

  getEventStyle(event: Evento): any {
    if (!event.startAt || !event.endAt) return {};
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const duration = endHour - startHour;
    
    // Using 60px per hour
    const top = startHour * 60;
    const height = duration * 60;
    
    // Find color based on tag
    let bgColor = '#e0e0e0';
    let borderColor = '#9e9e9e';
    if (event.tags && event.tags.length > 0) {
      const cat = this.categories.find(c => c.name.toLowerCase() === event.tags[0].toLowerCase());
      if (cat) {
        bgColor = this.hexToRgba(cat.color, 0.2);
        borderColor = cat.color;
      }
    }

    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: bgColor,
      borderLeft: `4px solid ${borderColor}`,
      position: 'absolute',
      width: '90%',
      left: '5%',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '0.85rem',
      overflow: 'hidden',
      boxSizing: 'border-box'
    };
  }

  isEventVisible(event: Evento): boolean {
    if (!event.tags || event.tags.length === 0) return true;
    const cat = this.categories.find(c => c.name === event.tags[0]);
    return cat ? cat.selected : true;
  }

  hexToRgba(hex: string, alpha: number) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
