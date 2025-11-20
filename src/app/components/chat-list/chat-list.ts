import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatUser } from '../../models/chat';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.css',
  standalone: true,
})
export class ChatList implements OnInit {
  public searchTerm: string = '';
  public users: ChatUser[] = [];
  public selectedUserId: number | null = 2; 

  ngOnInit(): void {
    this.users = [
      { id: 1, nombre: 'Sara', avatarUrl: '...', isOnline: true, lastMessageTime: '06:00 AM' },
      { id: 2, nombre: 'Isaias', avatarUrl: '...', isOnline: true, lastMessageTime: '07:01 AM' },
      { id: 3, nombre: 'Kevin', avatarUrl: '...', isOnline: false, lastMessageTime: '13:20 PM' },
      { id: 4, nombre: 'Fabiana', avatarUrl: '...', isOnline: true, lastMessageTime: '15:00 PM' },
      { id: 5, nombre: 'Diego', avatarUrl: '...', isOnline: false, lastMessageTime: 'Ayer' },
    ];
  }
}
