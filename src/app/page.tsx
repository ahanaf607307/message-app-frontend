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

  // Modal forms
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<string>('');
  const [profileNickname, setProfileNickname] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLivesIn, setProfileLivesIn] = useState('');
  const [profileFromCity, setProfileFromCity] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileWorkplace, setProfileWorkplace] = useState('');
  const [profileWorkTitle, setProfileWorkTitle] = useState('');
  const [profileEducationDept, setProfileEducationDept] = useState('');
  const [profileEducationSchool, setProfileEducationSchool] = useState('');
  const [profileCover, setProfileCover] = useState<File | null>(null);
  const [profileCoverPreview, setProfileCoverPreview] = useState<string>('');
  const [profileIsLocked, setProfileIsLocked] = useState(false);
  
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
      toast.error('Failed to load friends list. Please try again.');
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
      setProfileNickname(user.nickname || '');
      setProfileBio(user.bio || '');
      setProfileLivesIn(user.livesIn || '');
      setProfileFromCity(user.fromCity || '');
      setProfileGender(user.gender || '');
      setProfileWorkplace(user.workplace || '');
      setProfileWorkTitle(user.workTitle || '');
      setProfileEducationDept(user.educationDept || '');
      setProfileEducationSchool(user.educationSchool || '');
      setProfileCoverPreview(user.coverUrl || '');
      setProfileCover(null);
      setProfileIsLocked(user.isLocked || false);
      setFormError(null);
      setIsProfileOpen(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await updateProfile({
        name: profileName,
        email: profileEmail,
        nickname: profileNickname,
        bio: profileBio,
        livesIn: profileLivesIn,
        fromCity: profileFromCity,
        gender: profileGender,
        workplace: profileWorkplace,
        workTitle: profileWorkTitle,
        educationDept: profileEducationDept,
        educationSchool: profileEducationSchool,
        isLocked: profileIsLocked,
        avatarFile: profileAvatar,
        coverFile: profileCover
      });
      setIsProfileOpen(false);
      toast.success('Profile updated successfully!');
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
      toast.success('Password changed successfully!');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setFormSubmitting(false);
    }
  };

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

      {/* Profile Settings Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl border border-border/80 bg-background shadow-2xl p-0">
          
          {/* Header Banner */}
          <div className="bg-linear-to-r from-emerald-600 to-teal-800 dark:from-indigo-950 dark:to-teal-950 p-6 text-white relative">
            <h2 className="text-xl font-extrabold tracking-tight">Profile Settings</h2>
            <p className="text-xs text-emerald-100 dark:text-muted-foreground mt-1">Customize your social identity card, workplace details, and preferences.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6 p-6">
            
            {/* 1. Visual Media Section */}
            <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
                <span className="text-lg">🖼️</span>
                <h3 className="text-xs font-black uppercase tracking-wider">Profile & Cover Media</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Avatar upload */}
                <div className="flex flex-col items-center justify-center p-4 bg-background dark:bg-card border border-dashed border-border rounded-xl space-y-3 relative group">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ecd8bf] dark:border-border bg-muted flex items-center justify-center shadow-sm">
                    {profileAvatarPreview ? (
                      <img src={profileAvatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-muted-foreground">{profileName?.charAt(0)}</span>
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
                    className="h-8 text-xs font-bold border-border hover:bg-muted cursor-pointer shadow-3xs"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    Change Avatar
                  </Button>
                </div>

                {/* Cover upload */}
                <div className="flex flex-col items-center justify-center p-4 bg-background dark:bg-card border border-dashed border-border rounded-xl space-y-3 relative group">
                  <div className="relative w-full h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center shadow-xs">
                    {profileCoverPreview ? (
                      <img src={profileCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground italic font-semibold">No cover photo set</span>
                    )}
                  </div>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfileCover(file);
                        setProfileCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs font-bold border-border hover:bg-muted cursor-pointer shadow-3xs"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    Change Cover
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. Profile Identity Section */}
            <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
                <span className="text-lg">👤</span>
                <h3 className="text-xs font-black uppercase tracking-wider">Identity & Bio</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold">Full Name</label>
                  <Input
                    id="name"
                    placeholder="e.g. User One"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nickname" className="text-xs font-bold">Nickname (optional)</label>
                  <Input
                    id="nickname"
                    placeholder="e.g. MasterMind"
                    value={profileNickname}
                    onChange={(e) => setProfileNickname(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio" className="text-xs font-bold">Bio Status Quote</label>
                <textarea
                  id="bio"
                  rows={2}
                  placeholder="Tell people about yourself..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                />
              </div>
            </div>

            {/* 3. Location & Details Section */}
            <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
                <span className="text-lg">📍</span>
                <h3 className="text-xs font-black uppercase tracking-wider">Personal details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="livesIn" className="text-xs font-bold">Current City</label>
                  <Input
                    id="livesIn"
                    placeholder="e.g. Dhaka, Bangladesh"
                    value={profileLivesIn}
                    onChange={(e) => setProfileLivesIn(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="fromCity" className="text-xs font-bold">Hometown</label>
                  <Input
                    id="fromCity"
                    placeholder="e.g. Rangpur City"
                    value={profileFromCity}
                    onChange={(e) => setProfileFromCity(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="gender" className="text-xs font-bold">Gender</label>
                  <Input
                    id="gender"
                    placeholder="e.g. Male"
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
              </div>
            </div>

            {/* 4. Work & Education Section */}
            <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
                <span className="text-lg">💼</span>
                <h3 className="text-xs font-black uppercase tracking-wider">Work & Education</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="workplace" className="text-xs font-bold">Workplace Company</label>
                  <Input
                    id="workplace"
                    placeholder="e.g. Join Venture AI"
                    value={profileWorkplace}
                    onChange={(e) => setProfileWorkplace(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="workTitle" className="text-xs font-bold">Job Title / Specialty</label>
                  <Input
                    id="workTitle"
                    placeholder="e.g. Wordpress Theme & Plugin Developer"
                    value={profileWorkTitle}
                    onChange={(e) => setProfileWorkTitle(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="educationSchool" className="text-xs font-bold">School / University</label>
                  <Input
                    id="educationSchool"
                    placeholder="e.g. Canadian University of Bangladesh"
                    value={profileEducationSchool}
                    onChange={(e) => setProfileEducationSchool(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="educationDept" className="text-xs font-bold">Department / Major</label>
                  <Input
                    id="educationDept"
                    placeholder="e.g. Department of CSE"
                    value={profileEducationDept}
                    onChange={(e) => setProfileEducationDept(e.target.value)}
                    className="h-9.5 rounded-lg border-border bg-background"
                  />
                </div>
              </div>
            </div>

            {/* 5. Account Settings (System preference & Profile Lock) */}
            <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
                <span className="text-lg">🔒</span>
                <h3 className="text-xs font-black uppercase tracking-wider">Privacy & Profile Lock</h3>
              </div>

              <div className="p-3.5 bg-background dark:bg-card rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#0b4d3a] dark:text-foreground">Lock Profile</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    When locked, non-connections can only see your avatar and cover photo. Your posts, photos, and personal details are hidden.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileIsLocked(!profileIsLocked)}
                  className={`h-7 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer ${profileIsLocked ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {profileIsLocked ? '🔒 Locked' : '🔓 Unlocked'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="font-select" className="text-xs font-bold">System Font</label>
                  <select
                    id="font-select"
                    value={activeFont}
                    onChange={(e) => changeFont(e.target.value as any)}
                    className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-semibold"
                  >
                    <option value="sans">Geist (Default Sans)</option>
                    <option value="serif">Lora (Classical Serif)</option>
                    <option value="display">Space Grotesk (Modern Display)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="theme-select" className="text-xs font-bold">Theme Mode</label>
                  <select
                    id="theme-select"
                    value={themeMode}
                    onChange={(e) => handleThemeChange(e.target.value as any)}
                    className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-semibold"
                  >
                    <option value="light">☀️ Light Mode</option>
                    <option value="dark">🌙 Dark Mode</option>
                  </select>
                </div>
              </div>
            </div>

            {formError && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{formError}</div>}
            
            <DialogFooter className="pt-4 border-t border-border flex items-center justify-between gap-3 bg-muted/5 p-4 -mx-6 -mb-6">
              <Button type="button" variant="outline" className="cursor-pointer font-bold border-border shadow-3xs" onClick={() => setIsProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting} className="cursor-pointer font-bold bg-[#0b4d3a] hover:bg-[#08362b] text-white shadow-3xs px-6">
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save All Changes
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
