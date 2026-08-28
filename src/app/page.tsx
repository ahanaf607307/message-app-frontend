'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import DashboardPortal from '@/components/social/DashboardPortal';
import { Conversation, User, Message } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const { user, loading: authLoading, updateProfile, activeFont, changeFont } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  // Modal forms
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<string>('');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/conversations/all');
      setConversations(response.data.data.conversations || []);
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

  // Fetch connected friends for creating a conversation
  const openNewGroupModal = async () => {
    setFormError(null);
    setGroupName('');
    setSelectedFriendIds([]);
    try {
      setFormSubmitting(true);
      const response = await api.get('/connections/connected-users');
      setFriends(response.data.data.users || []);
      setIsNewGroupOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch friends:', err);
      alert('Failed to load friends list. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFriendIds.length === 0) {
      setFormError('Please select at least one participant');
      return;
    }
    const isGroup = selectedFriendIds.length > 1 || groupName.trim().length > 0;
    if (isGroup && !groupName.trim()) {
      setFormError('Group name is required for group chats');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        participantIds: selectedFriendIds,
        isGroupChat: isGroup,
        name: isGroup ? groupName.trim() : undefined,
      };
      const res = await api.post('/conversations/create', payload);
      const newConv = res.data.data;
      
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setIsNewGroupOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create conversation');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open settings with pre-filled profile details
  const openProfileModal = () => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileAvatarPreview(user.avatarUrl || '');
      setProfileAvatar(null);
      setFormError(null);
      setIsProfileOpen(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await updateProfile(profileName, profileEmail, profileAvatar);
      setIsProfileOpen(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFormError("New passwords don't match");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setIsChangePasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully!');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setFormSubmitting(false);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark';
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setThemeMode('dark');
      } else {
        document.documentElement.classList.remove('dark');
        setThemeMode('light');
      }
    }
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    localStorage.setItem('app-theme', theme);
    setThemeMode(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (authLoading || (loading && !conversations.length)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#faf6f0] text-[#0b4d3a] relative font-sans-active">
      {/* Left Sidebar Menu Drawer (Absolute Overlay with Backdrop) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/25 z-20 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 w-85 border-r border-[#ecd8bf]/60 h-full z-30 bg-background shadow-2xl transition-all duration-300 flex flex-col">
            <Sidebar 
              conversations={conversations} 
              onSelectConversation={(conv) => {
                setSelectedConversation(conv);
                setIsSidebarOpen(false); // Auto close sidebar on chat selection for premium feel
              }}
              selectedId={selectedConversation?.id}
              onOpenProfile={openProfileModal}
              onOpenChangePassword={() => {
                setFormError(null);
                setIsChangePasswordOpen(true);
              }}
              onOpenNewChat={openNewGroupModal}
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
          onOpenProfile={openProfileModal}
        />
      </div>

      {/* Messenger-style Floating Chatbox Popup */}
      {selectedConversation && (
        <div className="fixed bottom-4 right-4 w-[365px] h-[490px] bg-background border border-[#ecd8bf] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300">
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

      {/* Profile Settings Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information and profile picture.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                {profileAvatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileAvatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">{profileName.charAt(0)}</span>
                )}
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfileAvatar(file);
                    setProfileAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                Upload Photo
              </Button>
            </div>
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold">Name</label>
              <Input
                id="name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold">Email Address</label>
              <Input
                id="email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="font-select" className="text-xs font-semibold text-muted-foreground">Select System Font</label>
              <select
                id="font-select"
                value={activeFont}
                onChange={(e) => changeFont(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="sans">Geist (Default Sans)</option>
                <option value="serif">Lora (Classical Serif)</option>
                <option value="display">Space Grotesk (Modern Display)</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="theme-select" className="text-xs font-semibold text-muted-foreground">Select Theme Mode</label>
              <select
                id="theme-select"
                value={themeMode}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="light">☀️ Light Theme</option>
                <option value="dark">🌙 Dark Theme</option>
              </select>
            </div>
            {formError && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{formError}</div>}
            <DialogFooter>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Create a secure password to protect your account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="old-pass" className="text-xs font-semibold">Current Password</label>
              <Input
                id="old-pass"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-pass" className="text-xs font-semibold">New Password</label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-pass" className="text-xs font-semibold">Confirm New Password</label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {formError && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{formError}</div>}
            <DialogFooter>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Conversation / Group Modal */}
      <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Chat / Create Group</DialogTitle>
            <DialogDescription>
              Select friends to start a conversation. Add multiple friends to automatically create a Group Chat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            {selectedFriendIds.length > 1 && (
              <div className="space-y-1">
                <label htmlFor="group-name" className="text-xs font-semibold">Group Name</label>
                <Input
                  id="group-name"
                  placeholder="Marketing Team, Weekend Plan, etc."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required={selectedFriendIds.length > 1}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold">Select Participants ({selectedFriendIds.length})</label>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-muted/10">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <label 
                      key={friend.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.includes(friend.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFriendIds(prev => [...prev, friend.id]);
                          } else {
                            setSelectedFriendIds(prev => prev.filter(id => id !== friend.id));
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-bold">
                        {friend.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          friend.name.charAt(0)
                        )}
                      </div>
                      <span className="text-sm font-medium">{friend.name}</span>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No friends connected yet. Connect with users to start chats.
                  </div>
                )}
              </div>
            </div>
            {formError && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{formError}</div>}
            <DialogFooter>
              <Button type="submit" disabled={formSubmitting || friends.length === 0 || selectedFriendIds.length === 0}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedFriendIds.length > 1 ? 'Create Group' : 'Start Chat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
