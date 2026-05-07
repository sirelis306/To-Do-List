import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: number;
  senderId?: number;
  senderName?: string;
  message: string;
  timestamp?: string;
  updatedAt?: string;
}
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  getMessages(category: string, topic: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${category}/${topic}`);
  }

  sendMessage(category: string, topic: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, {
      category,
      topic,
      message
    });
  }

  editMessage(id: number, message: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { message });
  }

  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
