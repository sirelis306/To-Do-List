import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatWindowFacadeService } from '../../../services/chat/chat-window-facade.service';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
  standalone: true,
  providers: [ChatWindowFacadeService] // Provide facade per instance
})
export class ChatWindow implements OnInit, OnChanges {
  @Input() conversationId!: number;

  constructor(public facade: ChatWindowFacadeService) { }

  ngOnInit(): void {
    this.facade.initUser();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversationId'] && this.conversationId) {
      this.facade.loadConversation(this.conversationId);
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messageArea = document.querySelector('.message-area');
      if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
      }
    }, 100);
  }
}
