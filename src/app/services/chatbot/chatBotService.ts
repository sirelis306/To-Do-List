import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskService } from '../task/taskService';
import { ArticleService } from '../article/articleService'; 

@Injectable({
  providedIn: 'root',
})
export class ChatBotService {
  private readonly N8N_URL = '/webhook/chatbot';

  constructor(
    private http: HttpClient,
    private taskService: TaskService,
    private articleService: ArticleService
  ) { }

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
