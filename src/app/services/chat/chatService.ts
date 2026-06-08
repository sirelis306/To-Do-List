import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Conversation, ChatMessage } from '../../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  createConversation(type: 'private' | 'group', name: string | null, participantIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations`, {
      type,
      name,
      participantIds
    });
  }

  getConversation(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/${id}`);
  }

  deleteConversation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/conversations/${id}`);
  }

  getMessages(conversationId: number, limit?: number, beforeId?: number, search?: string): Observable<ChatMessage[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    if (beforeId) params = params.set('beforeId', beforeId.toString());
    if (search) params = params.set('search', search);

    return this.http.get<ChatMessage[]>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params });
  }

  sendMessage(conversationId: number, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/messages`, { message });
  }

  editMessage(id: number, message: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${id}`, { message });
  }

  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/messages/${id}`);
  }

  createMeet(conversationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/meet`, {});
  }

  createInstantMeet(participantIds: number[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/meet/instant`, { participantIds });
  }

  joinMeet(meetUrl: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/meet/join`, { meetUrl });
  }
}
