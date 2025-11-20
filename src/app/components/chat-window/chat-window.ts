import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../models/chat';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
  standalone: true,
})
export class ChatWindow implements OnInit{
  public messages: Message[] = [];
  public newMessage: string = '';
  public currentUserId: number = 2;

  ngOnInit(): void {
    this.messages = [
      { id: 1, senderId: 1, content: 'Hola, ¿como estas?', timestamp: '10:00 AM' },
      { id: 2, senderId: 2, content: 'Muy bien y tu?', timestamp: '10:01 AM' },
    ];
  }

  onSendMessage(): void {
    if (this.newMessage.trim()) {
      const msg: Message = {
        id: Date.now(),
        senderId: this.currentUserId,
        content: this.newMessage.trim(),
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      this.messages.push(msg);
      this.newMessage = '';
    }
  }
}
