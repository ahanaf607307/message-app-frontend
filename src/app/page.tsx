'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/chat/Sidebar';
import { useTheme } from '@/context/ThemeContext';
import ChatWindow from '@/components/chat/ChatWindow';
import DashboardPortal from '@/components/social/DashboardPortal';
import { Conversation, User, Message } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import EditProfileModal from '@/components/modals/EditProfileModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import CreateGroupModal from '@/components/modals/CreateGroupModal';

export default function Home() {
  const { user, loading: authLoading, updateProfile, activeFont, changeFont } = useAuth();
  const { theme: themeMode, setTheme: handleThemeChange } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/conversations/all');
      const data = response.data.data.conversations || [];
      const mapped = data.map((c: any) => ({
        ...c,
        lastMessage: c.messages?.[0] || c.lastMessage
      }));
      setConversations(mapped);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Reactive Socket updates for global conversation list
  useEffect(() => {
    const socket = getSocket();
    if (socket && user) {
      socket.emit('user:join', user.id);

      const handleGlobalMessage = (message: Message) => {
        setConversations((prev) => {
          const exists = prev.some((conv) => conv.id === message.conversationId);
          if (exists) {
            return prev.map((conv) =>
              conv.id === message.conversationId
                ? { ...conv, lastMessage: message, updatedAt: new Date().toISOString() }
                : conv
            ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          } else {
            fetchConversations();
            return prev;
          }
        });
      };

      socket.on('message:received', handleGlobalMessage);
      return () => {
        socket.off('message:received', handleGlobalMessage);
      };
    }
  }, [user, fetchConversations]);



  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (authLoading || (loading && !conversations.length)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#faf6f0] text-[#0b4d3a] relative font-sans-active">
      {/* Right Sidebar Menu Drawer (Absolute Overlay with Backdrop) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 top-16 bg-black/25 z-20 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute right-0 top-16 bottom-0 w-85 border-l border-[#ecd8bf]/60 z-30 bg-background shadow-2xl transition-all duration-300 flex flex-col">
            <Sidebar 
              conversations={conversations} 
              onSelectConversation={(conv) => {
                setSelectedConversation(conv);
                setIsSidebarOpen(false); // Auto close sidebar on chat selection for premium feel
              }}
              selectedId={selectedConversation?.id}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
              onOpenNewChat={() => setIsNewGroupOpen(true)}
              onRefreshConversations={fetchConversations}
            />
          </div>
        </>
      )}

      {/* Main Right Area - Always Dashboard Portal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardPortal
          currentUser={user}
          onRefreshConversations={fetchConversations}
          onSelectConversation={setSelectedConversation}
          onSwitchToChats={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenProfile={() => setIsProfileOpen(true)}
          unreadConversationCount={conversations.reduce((acc, conv) => acc + (conv.unseenCount || 0), 0)}
        />
      </div>

      {/* Messenger-style Floating Chatbox Popup */}
      {selectedConversation && (
        <div className="fixed bottom-4 right-4 w-[365px] h-[490px] bg-background border border-[#ecd8bf] dark:border-border/80 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300">
          <ChatWindow 
            conversation={selectedConversation} 
            onUpdateLastMessage={(conversationId, message) => {
              setConversations(prev => prev.map(conv => 
                conv.id === conversationId ? { ...conv, lastMessage: message, updatedAt: new Date().toISOString() } : conv
              ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            }}
            onRefreshConversations={fetchConversations}
            onCloseChat={() => setSelectedConversation(null)}
          />
        </div>
      )}

      <EditProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
      
      <CreateGroupModal 
        isOpen={isNewGroupOpen} 
        onClose={() => setIsNewGroupOpen(false)}
        onConversationCreated={(newConv) => {
          setConversations(prev => [newConv, ...prev]);
          setSelectedConversation(newConv);
        }}
      />
    </main>
  );
}
