import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  
  messages: ChatMessage[] = [
    { text: '¡Hola! Soy tu asistente virtual. Pregúntame sobre tus tareas o el inventario.', sender: 'bot', time: new Date() }
  ];

  constructor(private chatBotService: ChatBotService) {}

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
