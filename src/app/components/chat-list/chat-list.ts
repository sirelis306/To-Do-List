import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../models/chat';
import { ChatService } from '../../services/chat/chatService';
import { UserService } from '../../services/user/userService';
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.css',
  standalone: true,
})
export class ChatList implements OnInit {
  public searchTerm: string = '';
  public conversations: Conversation[] = [];
  public selectedConversationId: number | null = null; 

  // UI state
  public isSearchVisible: boolean = false;
  public sidebarView: 'chats' | 'new_private' | 'new_group' | 'new_meet' = 'chats';
  public isDropdownOpen: boolean = false;
  
  // Contacts state
  public systemUsers: any[] = [];
  public selectedUserIds: number[] = [];
  public currentUserId: number = 0;
  public contactSearchTerm: string = '';

  @Output() conversationSelected = new EventEmitter<Conversation>();

  constructor(
    private chatService: ChatService, 
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('kanban_user');
    if (storedUser) {
      this.currentUserId = JSON.parse(storedUser).id;
      this.cargarConversaciones();
    } else {
      this.authService.getMe().subscribe(user => {
        this.currentUserId = user.id;
        this.cargarConversaciones();
      });
    }
  }

  cargarConversaciones(): void {
    this.chatService.getConversations().subscribe(
      (data) => {
        this.conversations = data || [];
      },
      (error) => {
        console.error('Error cargando lista de conversaciones', error);
      }
    );
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversationId = conversation.id;
    this.conversationSelected.emit(conversation);
  }

  getConversationName(conv: Conversation): string {
    if (conv.type === 'group' && conv.name) {
      return conv.name;
    }
    if (conv.participants && conv.participants.length > 0) {
      const others = conv.participants.filter(p => p.id !== this.currentUserId);
      if (others.length > 0) {
        return others.map(p => p.name ? `${p.name} ${p.surname || ''}`.trim() : `Usuario #${p.id}`).join(', ');
      }
    }
    return conv.name || `Conversación #${conv.id}`;
  }

  getLastMessage(conv: any): string {
    const lastMsg = conv.lastMessage || conv.last_message;
    if (lastMsg) {
      return typeof lastMsg === 'string' ? lastMsg : (lastMsg.message || lastMsg.content || 'Sin mensajes...');
    }
    if (conv.messages && conv.messages.length > 0) {
      const last = conv.messages[conv.messages.length - 1];
      return last.message || last.content || 'Sin mensajes...';
    }
    return 'Sin mensajes...';
  }

  toggleSearch(): void {
    this.isSearchVisible = !this.isSearchVisible;
    if (!this.isSearchVisible) {
      this.searchTerm = '';
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  openNewChatView(): void {
    this.closeDropdown();
    this.sidebarView = 'new_private';
    this.selectedUserIds = [];
    this.loadSystemUsers();
  }

  openNewGroupView(): void {
    this.closeDropdown();
    this.sidebarView = 'new_group';
    this.selectedUserIds = [];
    this.contactSearchTerm = '';
    this.loadSystemUsers();
  }

  goBack(): void {
    this.sidebarView = 'chats';
    this.isSearchVisible = false;
    this.searchTerm = '';
    this.contactSearchTerm = '';
  }

  openNewMeetView(): void {
    this.closeDropdown();
    this.sidebarView = 'new_meet';
    this.selectedUserIds = [];
    this.contactSearchTerm = '';
    this.loadSystemUsers();
  }

  createInstantMeet(): void {
    const participants = this.sidebarView === 'new_meet' ? this.selectedUserIds : [];
    
    this.chatService.createInstantMeet(participants).subscribe(
      (response) => {
        const meetUrl = response?.meetUrl || response?.url || response;
        if (typeof meetUrl === 'string' && meetUrl.startsWith('http')) {
          this.chatService.joinMeet(meetUrl).subscribe(
            () => console.log('Actividad de ingreso al Meet registrada.'),
            (err) => console.error('Error registrando ingreso al Meet', err)
          );
          window.open(meetUrl, '_blank');
        } else {
          console.error('URL inválida', response);
          alert('No se pudo generar el enlace de la reunión.');
        }
        
        // Si estábamos en la vista de nueva reunión, regresamos a los chats
        if (this.sidebarView === 'new_meet') {
          this.goBack();
        }
      },
      (error) => {
        console.error('Error creando videollamada instantánea', error);
        alert('Ocurrió un error al intentar crear la reunión.');
      }
    );
  }

  loadSystemUsers(): void {
    // Se pide un límite alto (ej. 100 o 1000) para traer todos los usuarios a la vez para el modal
    this.userService.getUsers(1, 1000).subscribe(
      (response) => {
        this.systemUsers = response?.data || response || [];
      },
      (error) => console.error('Error cargando usuarios', error)
    );
  }

  onUserClick(user: any): void {
    if (this.sidebarView === 'new_private') {
      this.startPrivateChat(user.id);
    } else if (this.sidebarView === 'new_group') {
      this.toggleUserSelection(user.id);
    }
  }

  toggleUserSelection(userId: number): void {
    const idx = this.selectedUserIds.indexOf(userId);
    if (idx > -1) {
      this.selectedUserIds.splice(idx, 1);
    } else {
      this.selectedUserIds.push(userId);
    }
  }

  isSelected(userId: number): boolean {
    return this.selectedUserIds.includes(userId);
  }

  startPrivateChat(userId: number): void {
    this.chatService.createConversation('private', null, [userId]).subscribe(
      (response) => {
        this.goBack();
        this.cargarConversaciones();
        // Intentar seleccionar la conversación si el backend la devuelve
        if (response && response.id) {
          this.selectedConversationId = response.id;
          this.conversationSelected.emit(response);
        }
      },
      (error) => console.error('Error creando chat privado', error)
    );
  }

  createGroupChat(): void {
    if (this.selectedUserIds.length === 0) return;

    // Generamos un nombre por defecto porque el backend no permite name: null en grupos
    const defaultName = 'Nuevo Grupo';

    this.chatService.createConversation('group', defaultName, this.selectedUserIds).subscribe(
      (response) => {
        this.goBack();
        this.cargarConversaciones();
        if (response && response.id) {
          this.selectedConversationId = response.id;
          this.conversationSelected.emit(response);
        }
      },
      (error) => console.error('Error creando grupo', error)
    );
  }

  get filteredSystemUsers(): any[] {
    if (!this.contactSearchTerm) return this.systemUsers;
    const term = this.contactSearchTerm.toLowerCase();
    return this.systemUsers.filter(u => 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.surname && u.surname.toLowerCase().includes(term))
    );
  }

  getConversationTime(conv: any): string {
    const lastMsg = conv.lastMessage || conv.last_message;
    let timestamp = null;
    
    if (lastMsg && typeof lastMsg !== 'string') {
      timestamp = lastMsg.timestamp || lastMsg.created_at || lastMsg.createdAt;
    } else if (conv.messages && conv.messages.length > 0) {
      const last = conv.messages[conv.messages.length - 1];
      timestamp = last.timestamp || last.created_at || last.createdAt;
    }
    
    return this.formatChatDate(timestamp);
  }

  private formatChatDate(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return ''; // Invalid date
    
    const now = new Date();
    
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Ayer';
    } else {
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays < 7) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
      } else {
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
    }
  }
}
