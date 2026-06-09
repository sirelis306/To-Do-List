import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar/calendar.service';
import { Evento } from '../../models/evento';
import { AddEventModal } from './add-event-modal/add-event-modal';
import { CustomDropdown } from '../shared/custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEventModal, CustomDropdown],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar implements OnInit {
  public currentDate = new Date();
  public currentWeek: Date[] = [];
  public currentMonthDays: { date: Date, isCurrentMonth: boolean, isActive: boolean }[] = [];
  public hours: string[] = [];
  public events: Evento[] = [];
  public categories: { name: string, color: string, selected: boolean }[] = [
    { name: 'Reunión', color: '#4caf50', selected: true },
    { name: 'Evento', color: '#2196f3', selected: true },
    { name: 'Recordatorio', color: '#ff9800', selected: true }
  ];
  
  public currentMonthGrid: { date: Date, isCurrentMonth: boolean, events: Evento[] }[][] = [];
  public currentYearGrid: { monthName: string, days: {date: Date, isCurrentMonth: boolean, events?: Evento[]}[] }[] = [];
  public currentAgendaEvents: Evento[] = [];
  
  public showAddEventModal = false;

  public viewOptions = [
    { label: 'Día', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' },
    { label: 'Año', value: 'year' },
    { label: 'Agenda', value: 'agenda' }
  ];
  public selectedView = 'week';

  constructor(private calendarService: CalendarService) {
    this.generateHours();
  }

  ngOnInit(): void {
    this.updateViewData();
  }

  updateViewData() {
    this.updateWeek();
    this.generateMiniCalendar();
    
    if (this.selectedView === 'month') {
      this.generateMonthGrid();
    } else if (this.selectedView === 'year') {
      this.generateYearGrid();
    }
    
    this.loadEvents();
  }

  generateHours() {
    for (let i = 0; i < 24; i++) {
      this.hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
  }

  getMonthName(date: Date): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[date.getMonth()];
  }

  getDayName(date: Date): string {
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    return days[date.getDay()];
  }

  formatDateRange(): string {
    if (this.selectedView === 'day') {
      return `${this.getDayName(this.currentDate)}, ${this.currentDate.getDate()} de ${this.getMonthName(this.currentDate)} de ${this.currentDate.getFullYear()}`;
    } else if (this.selectedView === 'week') {
      if (!this.currentWeek || this.currentWeek.length === 0) return '';
      const start = this.currentWeek[0];
      const end = this.currentWeek[6];
      if (start.getMonth() === end.getMonth()) {
        return `${this.getMonthName(start)} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${this.getMonthName(start)} ${start.getDate()} - ${this.getMonthName(end)} ${end.getDate()}, ${end.getFullYear()}`;
    } else if (this.selectedView === 'month' || this.selectedView === 'agenda') {
      return `${this.getMonthName(this.currentDate)} ${this.currentDate.getFullYear()}`;
    } else if (this.selectedView === 'year') {
      return `${this.currentDate.getFullYear()}`;
    }
    return '';
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
    this.generateMiniCalendar();
  }

  generateMiniCalendar() {
    this.currentMonthDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startDayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = startDayOffset - 1; i >= 0; i--) {
      this.currentMonthDays.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isActive: false
      });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      this.currentMonthDays.push({
        date: d,
        isCurrentMonth: true,
        isActive: this.isSameDate(d, this.currentDate)
      });
    }
    
    let nextMonthDay = 1;
    while (this.currentMonthDays.length < 42) {
      this.currentMonthDays.push({
        date: new Date(year, month + 1, nextMonthDay++),
        isCurrentMonth: false,
        isActive: false
      });
    }
  }

  isSameDate(d1: Date, d2: Date) {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  selectDate(date: Date) {
    this.currentDate = new Date(date);
    this.updateViewData();
  }

  previous() {
    if (this.selectedView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else if (this.selectedView === 'month' || this.selectedView === 'agenda') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.selectedView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    } else if (this.selectedView === 'year') {
      this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
    }
    this.updateViewData();
  }

  next() {
    if (this.selectedView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.selectedView === 'month' || this.selectedView === 'agenda') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.selectedView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    } else if (this.selectedView === 'year') {
      this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
    }
    this.updateViewData();
  }

  previousMonthMini() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateViewData();
  }

  nextMonthMini() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateViewData();
  }

  onViewChange(view: string) {
    this.selectedView = view;
    this.updateViewData();
  }

  generateMonthGrid() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    
    let startDate = new Date(firstDay);
    const firstDayOfWeek = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    this.currentMonthGrid = [];
    let currentWeek: any[] = [];
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      currentWeek.push({
        date: d,
        isCurrentMonth: d.getMonth() === month,
        events: []
      });
      
      if (currentWeek.length === 7) {
        this.currentMonthGrid.push(currentWeek);
        currentWeek = [];
      }
    }
  }

  generateYearGrid() {
    const year = this.currentDate.getFullYear();
    this.currentYearGrid = [];
    
    for (let m = 0; m < 12; m++) {
      const monthDays = [];
      const firstDay = new Date(year, m, 1);
      
      let startDate = new Date(firstDay);
      const firstDayOfWeek = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
      startDate.setDate(startDate.getDate() - firstDayOfWeek);
      
      for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        monthDays.push({
          date: d,
          isCurrentMonth: d.getMonth() === m,
          events: [] as Evento[]
        });
      }
      
      this.currentYearGrid.push({
        monthName: this.getMonthName(firstDay),
        days: monthDays
      });
    }
  }


  loadEvents() {
    let startStr, endStr;
    if (this.selectedView === 'week' || this.selectedView === 'day') {
      startStr = this.currentWeek[0].toISOString().split('T')[0];
      endStr = this.currentWeek[6].toISOString().split('T')[0];
    } else {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month + 2, 0);
      startStr = start.toISOString().split('T')[0];
      endStr = end.toISOString().split('T')[0];
    }
    
    this.calendarService.getEvents(startStr, endStr).subscribe({
      next: (events) => {
        this.events = events;
        this.distributeEvents();
      },
      error: (err) => {
        console.error('Error fetching events, using mock data for demo', err);
        // Datos simulados (mock) por si la API no está lista
        this.events = [
          {
            id: 1,
            title: 'Product Design Course',
            description: 'Design mockups',
            place: 'disrupcion',
            date: '2026-06-09',
            startAt: '2026-06-09T10:00:00',
            endAt: '2026-06-09T12:00:00',
            tipoEvento: 'Reunión',
            tags: [],
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
            tipoEvento: 'Evento',
            tags: [],
            isCompanyWide: true
          }
        ];
        this.distributeEvents();
      }
    });
  }

  distributeEvents() {
    if (this.selectedView === 'month') {
      for (const week of this.currentMonthGrid) {
        for (const day of week) {
          day.events = this.getEventsForDay(day.date);
        }
      }
    } else if (this.selectedView === 'year') {
      for (const month of this.currentYearGrid) {
        for (const day of month.days) {
          day.events = this.getEventsForDay(day.date);
        }
      }
    } else if (this.selectedView === 'agenda') {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      
      this.currentAgendaEvents = this.events.filter(e => {
        const d = new Date(e.date);
        // Arreglar problema de zona horaria al comparar fechas
        const [eYear, eMonth, eDay] = e.date.split('-');
        return parseInt(eYear) === year && parseInt(eMonth) - 1 === month;
      });
      this.currentAgendaEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }

  onEventAdded(event?: Evento) {
    this.showAddEventModal = false;
    if (event) {
      this.events = [...this.events, event];
      this.distributeEvents();
    } else {
      this.loadEvents();
    }
  }

  getEventsForDay(date: Date): Evento[] {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
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
    if (event.tipoEvento) {
      borderColor = this.getCategoryColor(event.tipoEvento);
      bgColor = this.hexToRgba(borderColor, 0.2);
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

  getCategoryColor(tipoEvento?: string): string {
    if (!tipoEvento) return '#94a3b8'; // por defecto
    const cat = this.categories.find(c => c.name.toLowerCase() === tipoEvento.toLowerCase());
    return cat ? cat.color : '#94a3b8';
  }

  getEventDayNumber(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts[2] ? parts[2] : '';
  }

  getEventDayNameStr(dateStr: string): string {
    if (!dateStr) return '';
    // Usar la zona horaria local para parsear las partes de la fecha
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${months[date.getMonth()]}, ${days[date.getDay()]}`;
  }

  isEventVisible(event: Evento) {
    if (!event.tipoEvento) return true; // Si no tiene tipo, lo mostramos por defecto
    const selectedCategories = this.categories.filter(c => c.selected).map(c => c.name.toLowerCase());
    return selectedCategories.includes(event.tipoEvento.toLowerCase());
  }

  hexToRgba(hex: string, alpha: number) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
