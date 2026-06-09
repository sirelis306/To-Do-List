import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatList } from './chat-list/chat-list';
import { ChatWindow } from './chat-window/chat-window';
import { ChatBotService } from '../../services/chatbot/chatBotService';
import { Conversation } from '../../models/chat';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, ChatList, ChatWindow],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
  standalone: true,
})
export class Chat implements OnInit, OnDestroy {
  public selectedConversationId: number | null = null;

  constructor(private chatBotService: ChatBotService) {}

  ngOnInit(): void {
    // Oculta el chatbot cuando entras a la página de chat
    this.chatBotService.setVisibility(false);
  }

  ngOnDestroy(): void {
    // Muestra el chatbot cuando sales de la página de chat
    this.chatBotService.setVisibility(true);
  }

  onConversationSelected(conversation: Conversation): void {
    this.selectedConversationId = conversation.id;
  }
}
