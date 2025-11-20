export interface ChatUser {
  id: number;
  nombre: string;
  avatarUrl: string;
  isOnline: boolean; 
  lastMessageTime: string;
}

export interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
}

export interface Conversation {
  user: ChatUser;
  messages: Message[];
}