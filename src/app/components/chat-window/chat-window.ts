import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat/chatService';
import { ChatMessage, Conversation } from '../../models/chat';
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
  standalone: true,
})
export class ChatWindow implements OnInit, OnChanges {
  public messages: ChatMessage[] = [];
  public newMessage: string = '';
  public currentUserId: number = 0;
  public conversationDetails: Conversation | null = null;

  // Menús desplegables
  public isChatDropdownOpen: boolean = false;
  public activeDropdownMessageId: number | null = null;

  // Modales
  public isDeleteChatModalOpen: boolean = false;
  public messageToDeleteId: number | null = null;
  public messageToDeleteObj: ChatMessage | null = null;

  // Modal de Edición
  public isEditModalOpen: boolean = false;
  public messageToEditObj: ChatMessage | null = null;
  public messageToEditContent: string = '';

  @Input() conversationId!: number;

  constructor(private chatService: ChatService, private authService: AuthService) { }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('kanban_user');
    if (storedUser) {
      this.currentUserId = JSON.parse(storedUser).id;
    } else {
      this.authService.getMe().subscribe(user => {
        this.currentUserId = user.id;
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversationId'] && this.conversationId) {
      this.cargarDetalles();
      this.cargarHistorial();
    }
  }

  cargarDetalles(): void {
    this.chatService.getConversation(this.conversationId).subscribe(
      (details) => {
        this.conversationDetails = details;
      },
      (error) => console.error('Error cargando detalles de conversación', error)
    );
  }

  cargarHistorial(): void {
    if (!this.conversationId) return;
    this.chatService.getMessages(this.conversationId).subscribe(
      (history) => {
        this.messages = history;
      },
      (error) => {
        console.error('Error cargando historial de chat', error);
      }
    );
  }

  onSendMessage(): void {
    if (this.newMessage.trim() && this.conversationId) {
      const messageContent = this.newMessage.trim();
      this.newMessage = '';

      // Añadir el mensaje a la UI inmediatamente
      const tempId = -Date.now(); // ID temporal negativo
      const tempMessage: ChatMessage = {
        id: tempId,
        senderId: this.currentUserId,
        message: messageContent,
        timestamp: new Date().toISOString()
      };
      this.messages.push(tempMessage);

      // Scrollear hacia abajo (opcional, pero útil)
      setTimeout(() => this.scrollToBottom(), 50);

      this.chatService.sendMessage(this.conversationId, messageContent).subscribe(
        () => {
          // Recargar en segundo plano para obtener el ID real
          this.cargarHistorial();
        },
        (error) => {
          console.error('Error enviando mensaje', error);
          // Si falla, revertimos
          this.messages = this.messages.filter(m => m.id !== tempId);
          this.newMessage = messageContent;
        }
      );
    }
  }

  scrollToBottom(): void {
    const messageArea = document.querySelector('.message-area');
    if (messageArea) {
      messageArea.scrollTop = messageArea.scrollHeight;
    }
  }

  showDateDivider(index: number): boolean {
    if (index === 0) return true;
    const currentMsgTimestamp = this.messages[index].timestamp;
    const prevMsgTimestamp = this.messages[index - 1].timestamp;
    
    if (!currentMsgTimestamp || !prevMsgTimestamp) return false;

    const currentMsgDate = new Date(currentMsgTimestamp).toDateString();
    const prevMsgDate = new Date(prevMsgTimestamp).toDateString();
    return currentMsgDate !== prevMsgDate;
  }

  getDateLabel(timestamp: string | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  }

  canDeleteMessage(message: ChatMessage): boolean {
    if (!message.timestamp) return false;
    const msgDate = new Date(message.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    return diffMins <= 30;
  }

  onDeleteMessage(messageId: number | undefined): void {
    if (!messageId) return;
    this.openDeleteMessageModal(messageId);
  }

  onEditMessage(message: ChatMessage): void {
    this.closeAllDropdowns();
    this.messageToEditObj = message;
    this.messageToEditContent = message.message;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.messageToEditObj = null;
    this.messageToEditContent = '';
  }

  confirmEditMessage(): void {
    if (this.messageToEditObj && this.messageToEditContent.trim() !== '' && this.messageToEditObj.id) {
      const newContent = this.messageToEditContent.trim();
      const messageId = this.messageToEditObj.id;

      // Actualización optimista
      const originalContent = this.messageToEditObj.message;
      this.messageToEditObj.message = newContent;

      this.closeEditModal();

      this.chatService.editMessage(messageId, newContent).subscribe(
        () => {
        },
        (error) => {
          console.error('Error editando mensaje', error);
          // Si falla, revertimos el mensaje
          const msg = this.messages.find(m => m.id === messageId);
          if (msg) msg.message = originalContent;
        }
      );
    }
  }

  get conversationTitle(): string {
    if (!this.conversationDetails) return 'Cargando...';
    if (this.conversationDetails.type === 'group' && this.conversationDetails.name) {
      return this.conversationDetails.name;
    }
    if (this.conversationDetails.participants && this.conversationDetails.participants.length > 0) {
      const others = this.conversationDetails.participants.filter(p => p.id !== this.currentUserId);
      if (others.length > 0) {
        return others.map(p => p.name ? `${p.name} ${p.surname || ''}`.trim() : `Usuario #${p.id}`).join(', ');
      }
    }
    return this.conversationDetails.name || `Conversación #${this.conversationDetails.id}`;
  }

  openMeet(): void {
    if (!this.conversationId) {
      alert('Por favor selecciona un chat primero.');
      return;
    }

    // Solicitamos el enlace de Meet al backend
    this.chatService.createMeet(this.conversationId).subscribe(
      (response) => {
        // Extraemos la URL de la respuesta (verificamos posibles nombres)
        const meetUrl = response?.meetUrl || response?.url || response;

        if (typeof meetUrl === 'string' && meetUrl.startsWith('http')) {
          // Registramos que el usuario se ha unido
          this.chatService.joinMeet(meetUrl).subscribe(
            () => console.log('Actividad de ingreso al Meet registrada.'),
            (err) => console.error('Error registrando ingreso al Meet', err)
          );

          // Abrimos Google Meet en una pestaña nueva
          window.open(meetUrl, '_blank');
        } else {
          console.error('Formato de URL no válido:', response);
          alert('Error al generar el enlace de la reunión.');
        }
      },
      (error) => {
        console.error('Error creando la videollamada', error);
        alert('No se pudo iniciar la videollamada. Inténtalo más tarde.');
      }
    );
  }

  // --- Dropdowns Logic ---
  toggleChatDropdown(event: Event): void {
    event.stopPropagation();
    this.isChatDropdownOpen = !this.isChatDropdownOpen;
    this.activeDropdownMessageId = null;
  }

  toggleMessageDropdown(messageId: number | undefined, event: Event): void {
    event.stopPropagation();
    if (!messageId) return;
    if (this.activeDropdownMessageId === messageId) {
      this.activeDropdownMessageId = null;
    } else {
      this.activeDropdownMessageId = messageId;
      this.isChatDropdownOpen = false;
    }
  }

  closeAllDropdowns(): void {
    this.isChatDropdownOpen = false;
    this.activeDropdownMessageId = null;
  }

  // --- Lógica de Modales ---
  openDeleteChatModal(): void {
    this.closeAllDropdowns();
    this.isDeleteChatModalOpen = true;
  }

  openDeleteMessageModal(messageId: number | undefined): void {
    this.closeAllDropdowns();
    if (messageId) {
      this.messageToDeleteId = messageId;
    }
  }

  closeModals(): void {
    this.isDeleteChatModalOpen = false;
    this.messageToDeleteId = null;
    this.messageToDeleteObj = null;
  }

  confirmDeleteMessage(): void {
    if (!this.messageToDeleteId) return;
    this.chatService.deleteMessage(this.messageToDeleteId).subscribe(
      () => {
        this.cargarHistorial();
        this.closeModals();
      },
      (error) => console.error('Error eliminando mensaje', error)
    );
  }

  confirmDeleteChat(): void {
    if (!this.conversationId) return;
    this.chatService.deleteConversation(this.conversationId).subscribe(
      () => {
        this.closeModals();
        // Recargar la página o notificar al componente padre que se borró
        window.location.reload();
      },
      (error) => console.error('Error eliminando chat', error)
    );
  }
}
