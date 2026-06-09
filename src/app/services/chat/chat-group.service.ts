import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatGroupService {
  private apiUrl = environment.apiUrl + '/chat';

  constructor(private http: HttpClient) {}

  renameConversation(id: number, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/conversations/${id}`, { name });
  }

  leaveGroup(conversationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/leave`, {});
  }

  removeParticipant(conversationId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/conversations/${conversationId}/participants/${userId}`);
  }

  updateParticipantRole(conversationId: number, userId: number, role: 'admin' | 'member'): Observable<any> {
    return this.http.put(`${this.apiUrl}/conversations/${conversationId}/participants/${userId}/role`, { role });
  }

  addParticipants(conversationId: number, userIds: number | number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/participants`, { userId: userIds });
  }
}
