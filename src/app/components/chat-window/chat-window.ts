import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat/chatService';
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
  standalone: true,
})
export class ChatWindow implements OnInit {
  public messages: ChatMessage[] = [];
  public newMessage: string = '';
  public currentUserId: number = 0; // Se obtiene del AuthService
  
  @Input() category: string = 'general';
  @Input() topic: string = 'welcome';

  constructor(private chatService: ChatService, private authService: AuthService) {}

  ngOnInit(): void {
    // Intentar obtener el ID del usuario actual (si está guardado en localStorage o mediante getMe)
    const storedUser = localStorage.getItem('kanban_user');
    if (storedUser) {
      this.currentUserId = JSON.parse(storedUser).id;
    } else {
      // Como fallback si no está el id localmente
      this.authService.getMe().subscribe(user => {
        this.currentUserId = user.id;
      });
    }

    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.chatService.getMessages(this.category, this.topic).subscribe(
      (history) => {
        this.messages = history;
      },
      (error) => {
        console.error('Error cargando historial de chat', error);
      }
    );
  }

  onSendMessage(): void {
    if (this.newMessage.trim()) {
      const messageContent = this.newMessage.trim();
      this.newMessage = ''; 

      this.chatService.sendMessage(this.category, this.topic, messageContent).subscribe(
        () => {
          this.cargarHistorial(); 
        },
        (error) => {
          console.error('Error enviando mensaje', error);
          this.newMessage = messageContent; 
        }
      );
    }
  }

  onDeleteMessage(messageId: number | undefined): void {
    if (!messageId) return;
    if (confirm('¿Estás seguro de eliminar este mensaje?')) {
      this.chatService.deleteMessage(messageId).subscribe(
        () => this.cargarHistorial(),
        (error) => console.error('Error eliminando mensaje', error)
      );
    }
  }

  onEditMessage(message: ChatMessage): void {
    const newContent = prompt('Editar mensaje:', message.message);
    if (newContent !== null && newContent.trim() !== '' && message.id) {
      this.chatService.editMessage(message.id, newContent.trim()).subscribe(
        () => this.cargarHistorial(),
        (error) => console.error('Error editando mensaje', error)
      );
    }
  }
}
