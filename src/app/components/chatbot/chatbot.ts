import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatBotService } from '../../services/chatbot/chatBotService';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
}

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {
  isOpen: boolean = false;
  isLoading: boolean = false;
  newMessage: string = "";
  isVisible: boolean = true;
  
  messages: ChatMessage[] = [
    { text: '¡Hola! Soy tu asistente virtual. Pregúntame sobre tus tareas o el inventario.', sender: 'bot', time: new Date() }
  ];
  
  private visibilitySubscription: Subscription | null = null;

  constructor(private chatBotService: ChatBotService, private cdr: ChangeDetectorRef) {
    this.chatBotService.visibility$.subscribe(visible => {
      this.isVisible = visible;
      if (!visible) {
        this.isOpen = false; // Cierra el chat si está oculto
      }
    });
  }

  //visibilidad del chatbot en el chat
  ngOnInit(): void {
    this.visibilitySubscription = this.chatBotService.visibility$.subscribe(visible => {
      this.isVisible = visible;
      if (!visible) {
        this.isOpen = false;
      }
      // Forzar la detección de cambios
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.visibilitySubscription?.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const userMsgText = this.newMessage;
    this.messages.push({ text: userMsgText, sender: 'user', time: new Date() });
    
    this.newMessage = "";
    this.isLoading = true;

    this.chatBotService.sendMessage(userMsgText).subscribe({
      next: (response: any) => {
        console.log('Respuesta de n8n:', response);
        if (!response) {
          this.messages.push({ 
            text: 'El servidor respondió, pero el mensaje estaba vacío.', 
            sender: 'bot', 
            time: new Date() 
          });
        } else {
          const botText = response.text || 
                          (response.content && response.content.parts && response.content.parts[0]?.text) || 
                          JSON.stringify(response);

          this.messages.push({ 
            text: botText, 
            sender: 'bot', 
            time: new Date() 
          });
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error de n8n:', err);
        this.messages.push({ 
          text: 'Hubo un error de comunicación.', 
          sender: 'bot', 
          time: new Date() 
        });
        this.isLoading = false;
      }
    });
  }
}
