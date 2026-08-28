export type UserRole = 'USER' | 'SYSTEM_OWNER' | 'BUSINESS_OWNER' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  name?: string;
  isGroupChat: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  messages: Message[];
  lastMessage?: Message;
}

export interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  user: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
