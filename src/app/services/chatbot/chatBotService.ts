import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { TaskService } from '../task/taskService';
import { ArticleService } from '../article/articleService'; 

@Injectable({
  providedIn: 'root',
})
export class ChatBotService {
  private readonly N8N_URL = '/webhook-test/chatbot';
  private visibilitySubject = new BehaviorSubject<boolean>(true);
  public visibility$ = this.visibilitySubject.asObservable();

  constructor(
    private http: HttpClient,
    private taskService: TaskService,
    private articleService: ArticleService
  ) { }

  setVisibility(visible: boolean): void {
    this.visibilitySubject.next(visible);
  }

  sendMessage(userMessage: string): Observable<any> {
    const contexto = {
      tareas: this.taskService.getTareas(), 
      inventario: this.articleService.getArticles('') 
    };

    const body = {
      message: userMessage,
      context: contexto,
      timestamp: new Date().toISOString()
    };

    return this.http.post(this.N8N_URL, body);
  }
}
