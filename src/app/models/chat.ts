export interface ChatUser {
  id: number;
  nombre: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastMessageTime?: string;
}

export interface ChatMessage {
  id?: number;
  senderId?: number;
  senderName?: string;
  message: string;
  timestamp?: string;
  updatedAt?: string;
}

export interface Conversation {
  id: number;
  type: 'private' | 'group';
  name?: string | null;
  participants?: any[];
  messages?: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}