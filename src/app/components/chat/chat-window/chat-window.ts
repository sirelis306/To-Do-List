import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chatService';
import { UserService } from '../../../services/user/userService';
import { ChatMessage, Conversation } from '../../../models/chat';
import { AuthService } from '../../../services/auth/authService';

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
  
  // Renombrar Grupo
  public isRenameGroupModalOpen: boolean = false;
  public newGroupName: string = '';

  // Gestión de Grupo
  public isLeaveGroupModalOpen: boolean = false;
  public isManageParticipantsModalOpen: boolean = false;
  
  // Confirmaciones de Gestión
  public isRemoveParticipantModalOpen: boolean = false;
  public participantToRemoveId: number | null = null;
  public isChangeRoleModalOpen: boolean = false;
  public participantToChangeRole: any = null;
  
  // Añadir Participantes
  public isAddParticipantsViewOpen: boolean = false;
  public systemUsers: any[] = [];
  public selectedUserIdsToAdd: number[] = [];
  public contactSearchTerm: string = '';

  // Modal de Edición
  public isEditModalOpen: boolean = false;
  public messageToEditObj: ChatMessage | null = null;
  public messageToEditContent: string = '';

  @Input() conversationId!: number;

  constructor(
    private chatService: ChatService, 
    private authService: AuthService,
    private userService: UserService
  ) { }

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

      // Scrollear hacia abajo
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

  getSenderName(senderId: number | undefined): string {
    if (!senderId) return 'Desconocido';
    
    if (this.conversationDetails?.participants) {
      const participant = this.conversationDetails.participants.find((p: any) => p.id === senderId);
      if (participant) {
        return participant.name ? `${participant.name} ${participant.surname || ''}`.trim() : `Usuario #${senderId}`;
      }
    }
    return `Usuario #${senderId}`;
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
        // Extraemos la URL de la respuesta
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

  // --- Logica Para Mostrar Opciones  ---
  
  get isCurrentUserAdmin(): boolean {
    if (!this.conversationDetails || this.conversationDetails.type !== 'group') return false;
    const me = this.conversationDetails.participants?.find((p: any) => p.id === this.currentUserId);
    return me?.role === 'admin' || me?.pivot?.role === 'admin' || me?.pivot?.role_id === 1; // Ajuste preventivo para distintos formatos de API
  }

  toggleChatDropdown(event: Event): void {
    event.stopPropagation();
    this.isChatDropdownOpen = !this.isChatDropdownOpen;
  }

  closeChatDropdown(): void {
    this.isChatDropdownOpen = false;
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
  
  openRenameGroupModal(): void {
    this.closeAllDropdowns();
    if (this.conversationDetails) {
      this.newGroupName = this.conversationDetails.name || '';
      this.isRenameGroupModalOpen = true;
    }
  }

  closeRenameGroupModal(): void {
    this.isRenameGroupModalOpen = false;
    this.newGroupName = '';
  }

  renameGroup(): void {
    if (!this.conversationId || !this.newGroupName.trim()) return;
    
    this.chatService.renameConversation(this.conversationId, this.newGroupName.trim()).subscribe(
      () => {
        if (this.conversationDetails) {
          this.conversationDetails.name = this.newGroupName.trim();
        }
        this.closeRenameGroupModal();
        window.location.reload(); // Recargar para reflejar cambios en la lista lateral
      },
      (err) => console.error('Error renombrando el grupo', err)
    );
  }

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

  openLeaveGroupModal(): void {
    this.closeAllDropdowns();
    this.isLeaveGroupModalOpen = true;
  }

  openManageParticipantsModal(): void {
    this.closeAllDropdowns();
    this.isManageParticipantsModalOpen = true;
  }

  closeManageParticipantsModal(): void {
    this.isManageParticipantsModalOpen = false;
    this.isAddParticipantsViewOpen = false;
  }

  openRemoveParticipantModal(userId: number): void {
    this.participantToRemoveId = userId;
    this.isRemoveParticipantModalOpen = true;
  }

  openChangeRoleModal(participant: any): void {
    this.participantToChangeRole = participant;
    this.isChangeRoleModalOpen = true;
  }

  confirmRemoveParticipant(): void {
    if (this.participantToRemoveId) {
      this.removeParticipant(this.participantToRemoveId);
    }
  }

  // Lógica de Añadir Participantes
  toggleAddParticipantsView(): void {
    this.isAddParticipantsViewOpen = !this.isAddParticipantsViewOpen;
    if (this.isAddParticipantsViewOpen) {
      this.selectedUserIdsToAdd = [];
      this.contactSearchTerm = '';
      this.loadSystemUsers();
    }
  }

  loadSystemUsers(): void {
    this.userService.getUsers(1, 1000).subscribe(
      (response) => {
        this.systemUsers = response?.data || response || [];
      },
      (error) => console.error('Error cargando usuarios', error)
    );
  }

  get filteredSystemUsersForAdding(): any[] {
    const currentParticipantIds = this.conversationDetails?.participants?.map((p: any) => p.id) || [];
    let users = this.systemUsers.filter(u => !currentParticipantIds.includes(u.id));
    
    if (this.contactSearchTerm) {
      const term = this.contactSearchTerm.toLowerCase();
      users = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) || 
        (u.surname && u.surname.toLowerCase().includes(term))
      );
    }
    return users;
  }

  toggleUserSelectionToAdd(userId: number): void {
    const idx = this.selectedUserIdsToAdd.indexOf(userId);
    if (idx > -1) {
      this.selectedUserIdsToAdd.splice(idx, 1);
    } else {
      this.selectedUserIdsToAdd.push(userId);
    }
  }

  isSelectedToAdd(userId: number): boolean {
    return this.selectedUserIdsToAdd.includes(userId);
  }

  confirmAddParticipants(): void {
    if (!this.conversationId || this.selectedUserIdsToAdd.length === 0) return;
    
    this.chatService.addParticipants(this.conversationId, this.selectedUserIdsToAdd).subscribe(
      () => {
        this.cargarDetalles(); // Recargar detalles para obtener la nueva lista
        this.isAddParticipantsViewOpen = false;
      },
      (err) => alert('Error añadiendo participantes. ' + (err.error?.message || ''))
    );
  }

  removeParticipant(userId: number): void {
    if (!this.conversationId) return;
    this.chatService.removeParticipant(this.conversationId, userId).subscribe(
      () => {
        if (this.conversationDetails && this.conversationDetails.participants) {
          this.conversationDetails.participants = this.conversationDetails.participants.filter((p: any) => p.id !== userId);
        }
        this.closeModals();
      },
      (err) => alert('Error eliminando participante. ' + (err.error?.message || ''))
    );
  }

  confirmChangeRole(): void {
    if (!this.conversationId || !this.participantToChangeRole) return;
    const participant = this.participantToChangeRole;
    const currentRole = participant.role || participant.pivot?.role || 'member';
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    this.chatService.updateParticipantRole(this.conversationId, participant.id, newRole).subscribe(
      () => {
        participant.role = newRole;
        if (participant.pivot) participant.pivot.role = newRole;
        this.closeModals();
      },
      (err) => alert('Error cambiando rol. ' + (err.error?.message || ''))
    );
  }

  confirmLeaveGroup(): void {
    if (!this.conversationId) return;
    this.chatService.leaveGroup(this.conversationId).subscribe(
      () => {
        this.closeModals();
        window.location.reload();
      },
      (err) => alert('Error al salir del grupo. ' + (err.error?.message || ''))
    );
  }

  closeModals(): void {
    this.isDeleteChatModalOpen = false;
    this.messageToDeleteId = null;
    this.messageToDeleteObj = null;
    this.isEditModalOpen = false;
    this.messageToEditObj = null;
    this.isRenameGroupModalOpen = false;
    this.isLeaveGroupModalOpen = false;
    this.isRemoveParticipantModalOpen = false;
    this.participantToRemoveId = null;
    this.isChangeRoleModalOpen = false;
    this.participantToChangeRole = null;
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
