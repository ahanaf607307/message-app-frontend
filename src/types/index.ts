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
  connectionId?: string;
  nickname?: string;
  bio?: string;
  coverUrl?: string;
  livesIn?: string;
  fromCity?: string;
  gender?: string;
  workplace?: string;
  workTitle?: string;
  educationDept?: string;
  educationSchool?: string;
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
  unseenCount?: number;
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
  isSeen?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
