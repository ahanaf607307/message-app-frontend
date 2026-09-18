'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Conversation, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Search, MoreVertical, Plus, UserPlus, Users, UserCheck, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: string;
  onOpenProfile: () => void;
  onOpenChangePassword: () => void;
  onOpenNewChat: () => void;
  onRefreshConversations: () => void;
}

export default function Sidebar({
  conversations,
  onSelectConversation,
  selectedId,
  onOpenProfile,
  onOpenChangePassword,
  onOpenNewChat,
  onRefreshConversations,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'chats' | 'connections'>('chats');
  const [search, setSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'groups' | 'direct'>('all');
  
  // Connections tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // 1. Search text filter
    const name = conv.name || conv.participants.find(p => p.user.id !== user?.id)?.user.name || 'Unknown';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Pill category filter
    if (chatFilter === 'groups') return conv.isGroupChat === true;
    if (chatFilter === 'direct') return conv.isGroupChat === false;
    if (chatFilter === 'unread') {
      const unseenCount = conv.unseenCount || 0;
      return (unseenCount > 0 || (conv.lastMessage && conv.lastMessage.senderId !== user?.id && !conv.lastMessage.isSeen)) && conv.id !== selectedId;
    }
    return true;
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const otherParticipant = conv.participants.find(p => p.user.id !== user?.id);
    return otherParticipant?.user.name || 'Unknown';
  };

  const getConversationAvatar = (conv: Conversation) => {
    const otherParticipant = conv.participants.find(p => p.user.id !== user?.id);
    return otherParticipant?.user.avatarUrl;
  };

  const fetchConnectionsData = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const [friendsRes, incomingRes, sentRes] = await Promise.all([
        api.get('/connections/connected-users'),
        api.get('/connections/requests/pending'),
        api.get('/connections/requests/sent')
      ]);
      setFriends(friendsRes.data.data.users || []);
      setPendingIncoming(incomingRes.data.data.requests || []);
      setPendingSent(sentRes.data.data.requests || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'connections') {
      fetchConnectionsData();
    }
  }, [activeTab, fetchConnectionsData]);

  const handleSearchUsers = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get(`/connections/search?search=${val}`);
      setSearchResults(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const handleSendConnection = async (receiverId: string) => {
    try {
      await api.post('/connections/request', { receiverId });
      toast.success('Connection request sent!');
      fetchConnectionsData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespondRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/connections/respond/${connectionId}`, { status });
      fetchConnectionsData();
      onRefreshConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await api.delete(`/connections/${connectionId}`);
      fetchConnectionsData();
      onRefreshConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove connection');
    }
  };

  const getConnectionStatus = (targetUserId: string) => {
    if (friends.some(f => f.id === targetUserId)) return 'friend';
    const incoming = pendingIncoming.find(r => r.initiatorId === targetUserId);
    if (incoming) return { type: 'incoming', connectionId: incoming.id };
    const sent = pendingSent.find(r => r.receiverId === targetUserId);
    if (sent) return { type: 'sent', connectionId: sent.id };
    return 'none';
  };

  return (
    <div className="w-85 border-l border-border flex flex-col h-full bg-background shadow-xs font-sans-active">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Avatar className="h-9 w-9 border border-border shadow-xs">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{user?.name}</span>
            {user?.role === 'SYSTEM_OWNER' && (
              <Badge variant="outline" className="text-[9px] w-fit px-1 h-3.5 border-primary/30 text-primary bg-primary/5 flex items-center gap-0.5">
                <ShieldCheck className="h-2.5 w-2.5" /> Admin
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenProfile}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenChangePassword}>
                  <Settings className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                {user?.role === 'SYSTEM_OWNER' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-primary focus:bg-primary/5">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <Link href="/admin" className="flex items-center justify-between w-full">
                        Admin Panel <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-1">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="grid grid-cols-2 w-full h-8.5 bg-muted/50 p-0.5">
            <TabsTrigger value="chats" className="text-xs h-7">Chats</TabsTrigger>
            <TabsTrigger value="connections" className="text-xs h-7">
              Connections
              {pendingIncoming.length > 0 && (
                <Badge variant="default" className="ml-1.5 h-4 min-w-[16px] px-1 text-[9px] flex items-center justify-center bg-red-500 hover:bg-red-500">
                  {pendingIncoming.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search & Listing */}
      {activeTab === 'chats' ? (
        <>
          <div className="p-4 pt-2 pb-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages..." 
                className="pl-9 bg-muted/40 border-transparent focus-visible:ring-primary/50 text-sm h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex space-x-1.5 px-4 pb-3 pt-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' }
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setChatFilter(pill.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                  chatFilter === pill.id
                    ? 'bg-primary/15 text-primary border-primary/20 shadow-2xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 border-transparent'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="px-2 space-y-0.5 pb-4">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const unseenCount = conv.unseenCount || 0;
                  const isUnread = (unseenCount > 0 || (conv.lastMessage && conv.lastMessage.senderId !== user?.id && !conv.lastMessage.isSeen)) && conv.id !== selectedId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-150 text-left border ${
                        selectedId === conv.id 
                          ? 'bg-primary/10 border-primary/20 text-primary shadow-xs' 
                          : 'border-transparent hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-11 w-11 border border-border/50 shadow-xs">
                          <AvatarImage src={getConversationAvatar(conv)} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                            {getConversationName(conv).charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'font-semibold'}`}>
                            {getConversationName(conv)}
                          </h4>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${
                            isUnread 
                              ? 'text-foreground font-bold' 
                              : selectedId === conv.id 
                              ? 'text-primary/80 font-medium' 
                              : 'text-muted-foreground'
                          }`}>
                            {conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
                          </p>
                          {isUnread && (
                            <Badge className="bg-primary hover:bg-primary text-primary-foreground text-[9px] px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full font-bold flex-shrink-0">
                              {conv.unseenCount && conv.unseenCount > 0 ? conv.unseenCount : '1'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-sm">No chats found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <div className="p-4 pt-2">
            <h5 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1 mb-2">
              <Users className="h-3 w-3" /> Active Connections ({friends.length})
            </h5>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-2 space-y-0.5 pb-4">
              {loadingConnections && friends.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-4 text-center">Loading connections...</p>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <button 
                    key={friend.id} 
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl group animate-fade-in border border-transparent transition-all cursor-pointer text-left"
                    onClick={async () => {
                      try {
                        const res = await api.post('/conversations/create', {
                          participantIds: [friend.id],
                          isGroupChat: false
                        });
                        onSelectConversation(res.data.data);
                        setActiveTab('chats');
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Failed to open chat');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-border/50 shadow-xs">
                          <AvatarImage src={friend.avatarUrl || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-bold">{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                      </div>
                      <span className="text-sm font-semibold truncate text-foreground">{friend.name}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground py-4 text-center">No connections found</p>
              )}
            </div>
          </ScrollArea>
        </>
      )}
      {/* Bottom Theme Toggle Section */}
      <div className="p-4 border-t border-border bg-background/50 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground">Select Mode</span>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold transition-all shadow-3xs cursor-pointer text-foreground"
        >
          {theme === 'dark' ? (
            <span>🌙 Dark Mode</span>
          ) : (
            <span>☀️ Light Mode</span>
          )}
        </button>
      </div>
    </div>
  );
}
