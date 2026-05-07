import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatUser } from '../../models/chat';
import { UserService } from '../../services/user/userService';

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
  public selectedUserId: number | null = null; 

  @Output() userSelected = new EventEmitter<any>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe(
      (data) => {
        this.users = data.map((u: any) => ({
          id: u.id,
          nombre: u.name + ' ' + (u.surname || ''),
          avatarUrl: '...',
          isOnline: u.isActive,
          lastMessageTime: ''
        }));
      },
      (error) => {
        console.error('Error cargando lista de chat', error);
      }
    );
  }

  selectUser(user: ChatUser): void {
    this.selectedUserId = user.id;
    this.userSelected.emit(user);
  }
}
