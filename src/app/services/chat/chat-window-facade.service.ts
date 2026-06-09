import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage, Conversation } from '../../models/chat';
import { ChatService } from './chatService';
import { ChatGroupService } from './chat-group.service';
import { UserService } from '../user/userService';

export interface ChatWindowState {
  messages: ChatMessage[];
  newMessage: string;
  currentUserId: number;
  conversationDetails: Conversation | null;

  // Modales y Menús
  isChatDropdownOpen: boolean;
  activeDropdownMessageId: number | null;
  isDeleteChatModalOpen: boolean;
  messageToDeleteId: number | null;
  
  // Renombrar Grupo
  isRenameGroupModalOpen: boolean;
  newGroupName: string;

  // Gestión de Grupo
  isLeaveGroupModalOpen: boolean;
  isManageParticipantsModalOpen: boolean;
  
  // Confirmaciones de Gestión
  isRemoveParticipantModalOpen: boolean;
  participantToRemoveId: number | null;
  isChangeRoleModalOpen: boolean;
  participantToChangeRole: any;
  
  // Añadir Participantes
  isAddParticipantsViewOpen: boolean;
  systemUsers: any[];
  selectedUserIdsToAdd: number[];
  contactSearchTerm: string;

  // Edición
  isEditModalOpen: boolean;
  messageToEditObj: ChatMessage | null;
  messageToEditContent: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatWindowFacadeService {
  private initialState: ChatWindowState = {
    messages: [],
    newMessage: '',
    currentUserId: 0,
    conversationDetails: null,
    isChatDropdownOpen: false,
    activeDropdownMessageId: null,
    isDeleteChatModalOpen: false,
    messageToDeleteId: null,
    isRenameGroupModalOpen: false,
    newGroupName: '',
    isLeaveGroupModalOpen: false,
    isManageParticipantsModalOpen: false,
    isRemoveParticipantModalOpen: false,
    participantToRemoveId: null,
    isChangeRoleModalOpen: false,
    participantToChangeRole: null,
    isAddParticipantsViewOpen: false,
    systemUsers: [],
    selectedUserIdsToAdd: [],
    contactSearchTerm: '',
    isEditModalOpen: false,
    messageToEditObj: null,
    messageToEditContent: ''
  };

  private stateSubject = new BehaviorSubject<ChatWindowState>(this.initialState);
  state$ = this.stateSubject.asObservable();

  constructor(
    private chatService: ChatService,
    private chatGroupService: ChatGroupService,
    private userService: UserService
  ) {}

  get state() {
    return this.stateSubject.value;
  }

  updateState(newState: Partial<ChatWindowState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...newState });
  }

  // Métodos de Modales y Menús
  toggleChatDropdown() {
    this.updateState({ isChatDropdownOpen: !this.state.isChatDropdownOpen });
  }

  closeAllDropdowns() {
    this.updateState({ isChatDropdownOpen: false, activeDropdownMessageId: null });
  }

  toggleMessageDropdown(messageId: number | undefined) {
    if (!messageId) return;
    if (this.state.activeDropdownMessageId === messageId) {
      this.updateState({ activeDropdownMessageId: null });
    } else {
      this.updateState({ activeDropdownMessageId: messageId, isChatDropdownOpen: false });
    }
  }

  closeModals() {
    this.updateState({
      isDeleteChatModalOpen: false,
      messageToDeleteId: null,
      isEditModalOpen: false,
      messageToEditObj: null,
      isRenameGroupModalOpen: false,
      isLeaveGroupModalOpen: false,
      isRemoveParticipantModalOpen: false,
      participantToRemoveId: null,
      isChangeRoleModalOpen: false,
      participantToChangeRole: null,
      isAddParticipantsViewOpen: false
    });
  }

  // --- Helpers de Componente ---

  get isCurrentUserAdmin(): boolean {
    const { conversationDetails, currentUserId } = this.state;
    if (!conversationDetails || conversationDetails.type !== 'group') return false;
    const me = conversationDetails.participants?.find((p: any) => p.id === currentUserId);
    return me?.role === 'admin' || me?.pivot?.role === 'admin' || me?.pivot?.role_id === 1;
  }

  get conversationTitle(): string {
    const { conversationDetails, currentUserId } = this.state;
    if (!conversationDetails) return 'Cargando...';
    if (conversationDetails.type === 'group' && conversationDetails.name) {
      return conversationDetails.name;
    }
    if (conversationDetails.participants && conversationDetails.participants.length > 0) {
      const others = conversationDetails.participants.filter(p => p.id !== currentUserId);
      if (others.length > 0) {
        return others.map(p => p.name ? `${p.name} ${p.surname || ''}`.trim() : `Usuario #${p.id}`).join(', ');
      }
    }
    return conversationDetails.name || `Conversación #${conversationDetails.id}`;
  }

  showDateDivider(index: number): boolean {
    if (index === 0) return true;
    const { messages } = this.state;
    const currentMsgTimestamp = messages[index].timestamp;
    const prevMsgTimestamp = messages[index - 1].timestamp;

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
    const { conversationDetails } = this.state;
    
    if (conversationDetails?.participants) {
      const participant = conversationDetails.participants.find((p: any) => p.id === senderId);
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

  get filteredSystemUsersForAdding(): any[] {
    const { systemUsers, conversationDetails, contactSearchTerm } = this.state;
    const currentParticipantIds = conversationDetails?.participants?.map((p: any) => p.id) || [];
    let users = systemUsers.filter(u => !currentParticipantIds.includes(u.id));
    
    if (contactSearchTerm) {
      const term = contactSearchTerm.toLowerCase();
      users = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) || 
        (u.surname && u.surname.toLowerCase().includes(term))
      );
    }
    return users;
  }

  // --- Lógica de Negocio y API ---

  initUser(): void {
    const storedUser = localStorage.getItem('kanban_user');
    if (storedUser) {
      this.updateState({ currentUserId: JSON.parse(storedUser).id });
    } else {
      // Si AuthService tuviera un método getMe(), lo usaríamos aquí
    }
  }

  loadConversation(conversationId: number): void {
    this.cargarDetalles(conversationId);
    this.cargarHistorial(conversationId);
  }

  cargarDetalles(conversationId: number): void {
    this.chatService.getConversation(conversationId).subscribe(
      (details) => this.updateState({ conversationDetails: details }),
      (error) => console.error('Error cargando detalles', error)
    );
  }

  cargarHistorial(conversationId: number): void {
    this.chatService.getMessages(conversationId).subscribe(
      (history) => {
        this.updateState({ messages: history });
        setTimeout(() => {
          const messageArea = document.querySelector('.message-area');
          if (messageArea) messageArea.scrollTop = messageArea.scrollHeight;
        }, 100);
      },
      (error) => console.error('Error cargando historial', error)
    );
  }

  onSendMessage(conversationId: number): void {
    const { newMessage, currentUserId, messages } = this.state;
    if (newMessage.trim() && conversationId) {
      const messageContent = newMessage.trim();
      this.updateState({ newMessage: '' });

      const tempId = -Date.now();
      const tempMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        message: messageContent,
        timestamp: new Date().toISOString()
      };
      this.updateState({ messages: [...messages, tempMessage] });
      
      setTimeout(() => {
        const messageArea = document.querySelector('.message-area');
        if (messageArea) messageArea.scrollTop = messageArea.scrollHeight;
      }, 50);

      this.chatService.sendMessage(conversationId, messageContent).subscribe(
        () => this.cargarHistorial(conversationId),
        (error) => {
          console.error('Error enviando mensaje', error);
          this.updateState({
            messages: this.state.messages.filter(m => m.id !== tempId),
            newMessage: messageContent
          });
        }
      );
    }
  }

  openMeet(conversationId: number): void {
    if (!conversationId) {
      alert('Por favor selecciona un chat primero.');
      return;
    }
    this.chatService.createMeet(conversationId).subscribe(
      (response) => {
        const meetUrl = response?.meetUrl || response?.url || response;
        if (typeof meetUrl === 'string' && meetUrl.startsWith('http')) {
          this.chatService.joinMeet(meetUrl).subscribe();
          window.open(meetUrl, '_blank');
        } else {
          alert('Error al generar el enlace de la reunión.');
        }
      },
      (error) => alert('No se pudo iniciar la videollamada. Inténtalo más tarde.')
    );
  }

  openRenameGroupModal(): void {
    this.closeAllDropdowns();
    if (this.state.conversationDetails) {
      this.updateState({ 
        newGroupName: this.state.conversationDetails.name || '',
        isRenameGroupModalOpen: true
      });
    }
  }

  closeRenameGroupModal(): void {
    this.updateState({ isRenameGroupModalOpen: false, newGroupName: '' });
  }

  renameGroup(conversationId: number): void {
    const { newGroupName, conversationDetails } = this.state;
    if (!conversationId || !newGroupName.trim()) return;
    
    this.chatGroupService.renameConversation(conversationId, newGroupName.trim()).subscribe(
      () => {
        if (conversationDetails) {
          conversationDetails.name = newGroupName.trim();
        }
        this.closeRenameGroupModal();
      },
      (err) => console.error('Error renombrando', err)
    );
  }

  openDeleteChatModal(): void {
    this.closeAllDropdowns();
    this.updateState({ isDeleteChatModalOpen: true });
  }

  confirmDeleteChat(conversationId: number): void {
    if (!conversationId) return;
    this.chatService.deleteConversation(conversationId).subscribe(
      () => {
        this.closeModals();
        window.location.reload();
      },
      (error) => console.error('Error eliminando chat', error)
    );
  }

  openDeleteMessageModal(messageId: number | undefined): void {
    this.closeAllDropdowns();
    if (messageId) {
      this.updateState({ messageToDeleteId: messageId });
    }
  }

  confirmDeleteMessage(): void {
    const { messageToDeleteId } = this.state;
    if (!messageToDeleteId) return;
    this.chatService.deleteMessage(messageToDeleteId).subscribe(
      () => {
        const msg = this.state.messages.find(m => m.id === messageToDeleteId);
        if (msg) this.cargarHistorial(this.state.conversationDetails?.id || 0);
        this.closeModals();
      },
      (error) => console.error('Error eliminando mensaje', error)
    );
  }

  onEditMessage(message: ChatMessage): void {
    this.closeAllDropdowns();
    this.updateState({
      messageToEditObj: message,
      messageToEditContent: message.message,
      isEditModalOpen: true
    });
  }

  closeEditModal(): void {
    this.updateState({
      isEditModalOpen: false,
      messageToEditObj: null,
      messageToEditContent: ''
    });
  }

  confirmEditMessage(): void {
    const { messageToEditObj, messageToEditContent, messages } = this.state;
    if (messageToEditObj && messageToEditContent.trim() !== '' && messageToEditObj.id) {
      const newContent = messageToEditContent.trim();
      const messageId = messageToEditObj.id;
      const originalContent = messageToEditObj.message;
      
      messageToEditObj.message = newContent;
      this.closeEditModal();

      this.chatService.editMessage(messageId, newContent).subscribe(
        () => {},
        (error) => {
          console.error('Error editando mensaje', error);
          const msg = messages.find(m => m.id === messageId);
          if (msg) msg.message = originalContent;
        }
      );
    }
  }

  openLeaveGroupModal(): void {
    this.closeAllDropdowns();
    this.updateState({ isLeaveGroupModalOpen: true });
  }

  confirmLeaveGroup(conversationId: number): void {
    if (!conversationId) return;
    this.chatGroupService.leaveGroup(conversationId).subscribe(
      () => {
        this.closeModals();
        window.location.reload();
      },
      (err) => alert('Error al salir del grupo. ' + (err.error?.message || ''))
    );
  }

  openManageParticipantsModal(): void {
    this.closeAllDropdowns();
    this.updateState({ isManageParticipantsModalOpen: true });
  }

  closeManageParticipantsModal(): void {
    this.updateState({
      isManageParticipantsModalOpen: false,
      isAddParticipantsViewOpen: false
    });
  }

  openRemoveParticipantModal(userId: number): void {
    this.updateState({
      participantToRemoveId: userId,
      isRemoveParticipantModalOpen: true
    });
  }

  confirmRemoveParticipant(conversationId: number): void {
    const { participantToRemoveId, conversationDetails } = this.state;
    if (participantToRemoveId && conversationId) {
      this.chatGroupService.removeParticipant(conversationId, participantToRemoveId).subscribe(
        () => {
          if (conversationDetails && conversationDetails.participants) {
            conversationDetails.participants = conversationDetails.participants.filter((p: any) => p.id !== participantToRemoveId);
          }
          this.closeModals();
        },
        (err) => alert('Error eliminando participante. ' + (err.error?.message || ''))
      );
    }
  }

  openChangeRoleModal(participant: any): void {
    this.updateState({
      participantToChangeRole: participant,
      isChangeRoleModalOpen: true
    });
  }

  confirmChangeRole(conversationId: number): void {
    const { participantToChangeRole } = this.state;
    if (!conversationId || !participantToChangeRole) return;
    const participant = participantToChangeRole;
    const currentRole = participant.role || participant.pivot?.role || 'member';
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    this.chatGroupService.updateParticipantRole(conversationId, participant.id, newRole).subscribe(
      () => {
        participant.role = newRole;
        if (participant.pivot) participant.pivot.role = newRole;
        this.closeModals();
      },
      (err) => alert('Error cambiando rol. ' + (err.error?.message || ''))
    );
  }

  toggleAddParticipantsView(): void {
    const newStatus = !this.state.isAddParticipantsViewOpen;
    this.updateState({
      isAddParticipantsViewOpen: newStatus,
      selectedUserIdsToAdd: [],
      contactSearchTerm: ''
    });
    if (newStatus) {
      this.userService.getUsers(1, 1000).subscribe(
        (res) => this.updateState({ systemUsers: res?.data || res || [] })
      );
    }
  }

  toggleUserSelectionToAdd(userId: number): void {
    const arr = [...this.state.selectedUserIdsToAdd];
    const idx = arr.indexOf(userId);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(userId);
    this.updateState({ selectedUserIdsToAdd: arr });
  }

  isSelectedToAdd(userId: number): boolean {
    return this.state.selectedUserIdsToAdd.includes(userId);
  }

  confirmAddParticipants(conversationId: number): void {
    const { selectedUserIdsToAdd } = this.state;
    if (!conversationId || selectedUserIdsToAdd.length === 0) return;
    
    this.chatGroupService.addParticipants(conversationId, selectedUserIdsToAdd).subscribe(
      () => {
        this.cargarDetalles(conversationId);
        this.updateState({ isAddParticipantsViewOpen: false });
      },
      (err) => alert('Error añadiendo participantes. ' + (err.error?.message || ''))
    );
  }

}

// Trigger recompile
