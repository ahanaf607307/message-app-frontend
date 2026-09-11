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
  isLocked?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Post {
  id: string;
  content: string;
  mediaUrl?: string | null;
  audience?: 'PUBLIC' | 'CONNECTIONS' | 'ONLY_ME';
  postType?: 'REGULAR' | 'PROFILE_PICTURE' | 'COVER_PHOTO';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    isLocked?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  comments: PostComment[];
  userLiked: boolean;
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
