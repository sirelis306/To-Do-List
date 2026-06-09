import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento } from '../../models/evento';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private apiUrl = `${environment.apiUrl}/calendar`;

  constructor(private http: HttpClient) {}

  getEvents(start?: string, end?: string, tag?: string, type?: string, isActive: boolean = true): Observable<Evento[]> {
    let params = new HttpParams().set('isActive', isActive);
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    if (tag) params = params.set('tag', tag);
    if (type) params = params.set('type', type);

    return this.http.get<Evento[]>(this.apiUrl, { params });
  }

  getEventById(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: Evento): Observable<any> {
    return this.http.post(this.apiUrl, event);
  }

  updateEvent(id: number, event: Partial<Evento>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleActiveStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  getReminders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reminders`);
  }
}
