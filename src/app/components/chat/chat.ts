import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatList } from '../chat-list/chat-list';
import { ChatWindow } from '../chat-window/chat-window';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, ChatList, ChatWindow],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
  standalone: true,
})
export class Chat {

}
