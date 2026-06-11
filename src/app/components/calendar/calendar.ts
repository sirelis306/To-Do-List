import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar/calendar.service';
import { AuthService } from '../../services/auth/authService';
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
  public currentDate: Date = new Date();
  public selectedView: string = 'week';
  public showAddEventModal: boolean = false;
  
  public selectedEventDetails: Evento | null = null;
  public selectedEventForEdit: Evento | null = null;

  private layoutCache: Map<string, any[]> = new Map();
  
  // Control del modal de confirmación de eliminación
  public showDeleteConfirmModal: boolean = false;
  public eventToDeleteId: number | undefined = undefined;

  public currentWeek: Date[] = [];
  public currentMonthDays: { date: Date, isCurrentMonth: boolean, isActive: boolean, hasEvents?: boolean }[] = [];
  public hours: string[] = [];
  public events: Evento[] = [];
  public allEvents: Evento[] = [];
  public categories: { name: string, color: string, selected: boolean }[] = [
    { name: 'Reunión', color: '#4caf50', selected: true },
    { name: 'Evento', color: '#2196f3', selected: true },
    { name: 'Recordatorio', color: '#ff9800', selected: true }
  ];
  
  public currentMonthGrid: { date: Date, isCurrentMonth: boolean, events: Evento[] }[][] = [];
  public currentYearGrid: { monthName: string, days: {date: Date, isCurrentMonth: boolean, events?: Evento[]}[] }[] = [];
  public currentAgendaEvents: Evento[] = [];
  public agendaDays: { date: Date, events: Evento[] }[] = [];
  
  public viewOptions = [
    { label: 'Día', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' },
    { label: 'Año', value: 'year' },
    { label: 'Agenda', value: 'agenda' }
  ];

  constructor(
    private calendarService: CalendarService,
    private authService: AuthService
  ) {
    this.generateHours();
  }

  ngOnInit(): void {
    this.updateViewData();
  }

  updateViewData() {
    this.layoutCache.clear();
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
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
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
        isActive: false,
        hasEvents: this.getEventsForDay(new Date(year, month - 1, prevMonthLastDay - i)).some(e => this.isEventVisible(e))
      });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      this.currentMonthDays.push({
        date: d,
        isCurrentMonth: true,
        isActive: this.isSameDate(d, this.currentDate),
        hasEvents: this.getEventsForDay(d).some(e => this.isEventVisible(e))
      });
    }
    
    let nextMonthDay = 1;
    while (this.currentMonthDays.length < 42) {
      this.currentMonthDays.push({
        date: new Date(year, month + 1, nextMonthDay),
        isCurrentMonth: false,
        isActive: false,
        hasEvents: this.getEventsForDay(new Date(year, month + 1, nextMonthDay)).some(e => this.isEventVisible(e))
      });
      nextMonthDay++;
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

  goToDayView(date: Date, event: MouseEvent) {
    event.stopPropagation();
    this.currentDate = new Date(date);
    this.selectedView = 'day';
    this.updateViewData();
  }

  selectDateAndOpenModal(date: Date) {
    this.currentDate = new Date(date);
    this.updateViewData();
    this.showAddEventModal = true;
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
        this.allEvents = events;
        this.events = events;
        this.distributeEvents();
      },
      error: (err) => {
        console.error('Error al cargar los eventos, usando datos de demostración', err);
        this.allEvents = [
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
          }
        ];
        this.events = this.allEvents;
        this.distributeEvents();
      }
    });
  }

  distributeEvents() {
    this.layoutCache.clear(); // Asegurar que al aplicar filtros se recalcule el layout
    this.generateMiniCalendar(); // Actualiza los indicadores del mini calendario cuando cambian eventos o categorías

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
      
      this.currentAgendaEvents = this.allEvents.filter(e => {
        const [eYear, eMonth, eDay] = e.date.split('-');
        return parseInt(eYear) === year && parseInt(eMonth) - 1 === month;
      });
      
      // Agrupar eventos por día para la vista de agenda
      const groups: { [key: string]: Evento[] } = {};
      for (const event of this.currentAgendaEvents) {
        if (this.isEventVisible(event)) {
          if (!groups[event.date]) {
            groups[event.date] = [];
          }
          groups[event.date].push(event);
        }
      }
      
      this.agendaDays = Object.keys(groups).map(dateStr => {
        const [y, m, d] = dateStr.split('-');
        return {
          date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)),
          events: groups[dateStr]
        };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  }

  onEventAdded(event: Evento) {
    if (!event.id) event.id = Math.floor(Math.random() * 10000);
    this.allEvents.push(event);
    this.updateViewData();
    this.showAddEventModal = false;
  }

  onEventUpdated(event: Evento) {
    const index = this.allEvents.findIndex(e => e.id === event.id);
    if (index !== -1) {
      this.allEvents[index] = event;
    }
    this.updateViewData();
    this.showAddEventModal = false;
    this.selectedEventForEdit = null;
  }

  openEventDetails(event: Evento, clickEvent: MouseEvent) {
    clickEvent.stopPropagation();
    console.log('SELECTED EVENT DETAILS:', JSON.stringify(event));
    console.log('CURRENT USER PROFILE:', JSON.stringify(this.authService.getUserProfile()));
    this.selectedEventDetails = event;
  }

  closeEventDetails() {
    this.selectedEventDetails = null;
  }

  deleteEvent(id: number | undefined) {
    if (!id) return;
    const event = this.allEvents.find(e => e.id === id);
    if (event && !this.isEventCreator(event)) {
      return;
    }
    // Guardamos el id y abrimos el modal de confirmación propio
    this.eventToDeleteId = id;
    this.showDeleteConfirmModal = true;
  }

  confirmDelete() {
    const id = this.eventToDeleteId;
    if (!id) return;
    this.calendarService.deleteEvent(id).subscribe({
      next: () => {
        this.allEvents = this.allEvents.filter(e => e.id !== id);
        this.updateViewData();
        this.closeEventDetails();
      },
      error: (err) => {
        console.error('Error al eliminar el evento:', err);
        // Eliminamos localmente aunque falle el servidor para evitar que el usuario vea el evento eliminado
        this.allEvents = this.allEvents.filter(e => e.id !== id);
        this.updateViewData();
        this.closeEventDetails();
      }
    });
    this.showDeleteConfirmModal = false;
    this.eventToDeleteId = undefined;
  }

  cancelDelete() {
    this.showDeleteConfirmModal = false;
    this.eventToDeleteId = undefined;
  }

  editEvent(event: Evento) {
    if (!this.isEventCreator(event)) {
      return;
    }
    this.selectedEventForEdit = event;
    this.closeEventDetails();
    this.showAddEventModal = true;
  }

  getEventsForDay(date: Date): Evento[] {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return this.events.filter(e => {
      // Verificar si el startAt del evento corresponde a este día, o si es un evento de todo el día verificar la fecha
      if (e.startAt) {
        return e.startAt.startsWith(dateStr);
      }
      return e.date === dateStr;
    });
  }

  getLayoutComputedEventsForDay(date: Date): any[] {
    const dateStr = date.toISOString().split('T')[0];
    if (this.layoutCache.has(dateStr)) {
      return this.layoutCache.get(dateStr)!;
    }

    const dayEvents = this.getEventsForDay(date).filter(e => this.isEventVisible(e));
    
    // Separamos los eventos de todo el día de los que tienen hora
    const timedEvents = dayEvents.filter(e => e.startAt && e.endAt);
    const allDayEvents = dayEvents.filter(e => !e.startAt || !e.endAt);

    // Ordenar por hora de inicio
    timedEvents.sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());

    let clusters: any[][] = [];
    let currentCluster: any[] = [];
    let clusterEnd = 0;

    for (const e of timedEvents) {
      const start = new Date(e.startAt!).getTime();
      const end = new Date(e.endAt!).getTime();

      if (currentCluster.length > 0 && start >= clusterEnd) {
        clusters.push(currentCluster);
        currentCluster = [];
      }
      currentCluster.push(e);
      if (end > clusterEnd) clusterEnd = end;
    }
    if (currentCluster.length > 0) clusters.push(currentCluster);

    for (const cluster of clusters) {
      let columns: any[][] = [];

      for (const ev of cluster) {
        let placed = false;
        for (const col of columns) {
          const lastEvInCol = col[col.length - 1];
          if (new Date(ev.startAt!).getTime() >= new Date(lastEvInCol.endAt!).getTime()) {
            col.push(ev);
            placed = true;
            break;
          }
        }
        if (!placed) columns.push([ev]);
      }

      const numCols = columns.length;
      for (let i = 0; i < numCols; i++) {
        for (const ev of columns[i]) {
          ev._colIndex = i;
          ev._numCols = numCols;
        }
      }
    }

    const result = [...allDayEvents, ...timedEvents];
    this.layoutCache.set(dateStr, result);
    return result;
  }

  getEventStyle(event: any): any {
    let top = 0;
    let height = 45; // Altura fija por defecto para eventos de todo el día o sin hora

    if (event.startAt && event.endAt) {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      
      const duration = endHour - startHour;
      
      // Usando 60px por hora
      top = startHour * 60;
      height = duration * 60;
    }
    
    // Determinar el color según la categoría o el color personalizado del evento
    let borderColor = this.getEventColor(event);
    let bgColor = this.hexToRgba(borderColor, 0.18);

    let width = '90%';
    let left = '5%';

    if (event._numCols) {
      const widthPct = 90 / event._numCols;
      width = `${widthPct}%`;
      left = `calc(5% + ${event._colIndex * widthPct}%)`;
    }

    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: bgColor,
      borderLeft: `4px solid ${borderColor}`,
      position: 'absolute',
      width: width,
      left: left,
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '0.85rem',
      overflow: 'hidden',
      boxSizing: 'border-box',
      color: borderColor
    };
  }

  private normalizeString(str: string): string {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  getCategoryColor(tipoEvento?: string): string {
    if (!tipoEvento) return '#94a3b8'; // por defecto
    const normTipo = this.normalizeString(tipoEvento);
    const cat = this.categories.find(c => this.normalizeString(c.name) === normTipo);
    return cat ? cat.color : '#94a3b8';
  }

  getEventColor(event: Evento): string {
    if (event.color) return event.color;

    // Buscar si algún tag es un código hexadecimal de color
    if (event.tags && event.tags.length > 0) {
      const colorTag = event.tags.find(tag => tag.startsWith('#'));
      if (colorTag) return colorTag;
    }

    let tipo = this.getEventType(event);
    return tipo ? this.getCategoryColor(tipo) : '#9e9e9e';
  }

  getEventType(event: Evento): string {
    if (event.tipoEvento) return event.tipoEvento;
    if (event.tags && event.tags.length > 0) {
      // Buscar en los tags si hay alguno que coincida con nuestras categorías
      const tagsNorm = event.tags.map(t => this.normalizeString(t));
      if (tagsNorm.includes('reunion')) return 'reunion';
      if (tagsNorm.includes('evento')) return 'evento';
      if (tagsNorm.includes('recordatorio')) return 'recordatorio';
    }
    return '';
  }

  getEventIcon(event: Evento): string {
    const tipoEvento = this.getEventType(event);
    if (!tipoEvento) return '';
    const normTipo = this.normalizeString(tipoEvento);
    if (normTipo === 'reunion') return 'fa-users';
    if (normTipo === 'evento') return 'fa-calendar-check';
    if (normTipo === 'recordatorio') return 'fa-bell';
    return '';
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

  getEventDayNameStrShort(date: Date): string {
    const days = ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'];
    return days[date.getDay()];
  }

  getEventCreatorStr(event: any): string {
    if (event.isCompanyWide || (event.participants && event.participants.length > 0)) {
      if (event.user && event.user.nombre) {
        return ` - ${event.user.nombre}`;
      } else if (event.user && event.user.name) {
        return ` - ${event.user.name}`;
      } else if (event.owner && event.owner.nombre) {
        return ` - ${event.owner.nombre}`;
      } else if (event.owner && event.owner.name) {
        return ` - ${event.owner.name}`;
      } else if (event.participantName) {
        return ` - ${event.participantName}`;
      }
    }
    return '';
  }

  getEventCreatorOnlyStr(event: any): string {
    if (!event) return '';
    if (event.user) {
      if (event.user.nombre && event.user.apellido) {
        return `${event.user.nombre} ${event.user.apellido}`;
      }
      if (event.user.nombre) return event.user.nombre;
      if (event.user.name) return event.user.name;
    }
    if (event.owner) {
      if (event.owner.nombre && event.owner.apellido) {
        return `${event.owner.nombre} ${event.owner.apellido}`;
      }
      if (event.owner.nombre) return event.owner.nombre;
      if (event.owner.name) return event.owner.name;
    }
    if (event.participantName) return event.participantName;
    return '';
  }

  isEventVisible(event: any) {
    const tipo = this.getEventType(event);
    if (!tipo) return true; // Si no tiene tipo, lo mostramos por defecto
    const normTipo = this.normalizeString(tipo);
    const selectedCategories = this.categories.filter(c => c.selected).map(c => this.normalizeString(c.name));
    return selectedCategories.includes(normTipo);
  }

  hasVisibleEvents(events?: Evento[]): boolean {
    if (!events || events.length === 0) return false;
    return events.some(e => this.isEventVisible(e));
  }

  hexToRgba(hex: string, alpha: number) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  isEventCreator(event: Evento | null): boolean {
    if (!event) return false;
    if (!event.id) return true;
    
    const currentUser = this.authService.getUserProfile();
    if (!currentUser || !currentUser.id) return false;

    if (event.user && event.user.id) {
      return event.user.id === currentUser.id;
    }
    if ((event as any).owner && (event as any).owner.id) {
      return (event as any).owner.id === currentUser.id;
    }
    if ((event as any).userId) {
      return (event as any).userId === currentUser.id;
    }
    if ((event as any).user_id) {
      return (event as any).user_id === currentUser.id;
    }
    
    // Si no hay información de usuario creador en absoluto, permitir edición
    if (!event.user && !(event as any).owner && !(event as any).userId && !(event as any).user_id) {
      return true;
    }
    
    return false;
  }
}
