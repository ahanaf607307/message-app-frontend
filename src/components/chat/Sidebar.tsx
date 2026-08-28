'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Conversation, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Search, MoreVertical, Plus, UserPlus, Users, UserCheck, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import Link from 'next/link';

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
      // Heuristic: show threads where last message is sent by someone else
      return conv.lastMessage && conv.lastMessage.senderId !== user?.id && conv.id !== selectedId;
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
      alert('Connection request sent!');
      fetchConnectionsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespondRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/connections/respond/${connectionId}`, { status });
      fetchConnectionsData();
      onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await api.delete(`/connections/${connectionId}`);
      fetchConnectionsData();
      onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove connection');
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
    <div className="w-85 border-r border-border flex flex-col h-full bg-background shadow-xs font-sans-active">
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
                placeholder="Search Messenger..." 
                className="pl-9 bg-muted/40 border-transparent focus-visible:ring-primary/50 text-sm h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Messenger Style Filter Pills */}
          <div className="flex space-x-1.5 px-4 pb-3 pt-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'groups', label: 'Groups' },
              { id: 'direct', label: 'Connected' }
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
                  const isUnread = conv.lastMessage && conv.lastMessage.senderId !== user?.id && conv.id !== selectedId;
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
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
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
                            <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0"></div>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Find and connect with users..." 
                className="pl-9 bg-muted/40 border-transparent focus-visible:ring-primary/50 text-sm h-9"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-4">
              {/* Search Results */}
              {searchQuery && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                    <Search className="h-3 w-3" /> Search Results
                  </h5>
                  <div className="space-y-1">
                    {searchResults.length > 0 ? (
                      searchResults.filter(u => u.id !== user?.id).map((foundUser) => {
                        const status = getConnectionStatus(foundUser.id);
                        return (
                          <div key={foundUser.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={foundUser.avatarUrl} />
                                <AvatarFallback className="bg-muted text-muted-foreground text-xs">{foundUser.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold truncate">{foundUser.name}</span>
                            </div>
                            <div>
                              {status === 'friend' && (
                                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 bg-green-500/5 flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" /> Connected
                                </Badge>
                              )}
                              {typeof status === 'object' && status.type === 'sent' && (
                                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Sent
                                </Badge>
                              )}
                              {typeof status === 'object' && status.type === 'incoming' && (
                                <div className="flex space-x-1">
                                  <Button size="icon-sm" className="h-6 w-6 text-[10px] rounded bg-primary hover:bg-primary/95 text-white" onClick={() => handleRespondRequest(status.connectionId, 'accepted')}>
                                    ✓
                                  </Button>
                                  <Button variant="outline" size="icon-sm" className="h-6 w-6 text-[10px] rounded border-red-500/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" onClick={() => handleRespondRequest(status.connectionId, 'rejected')}>
                                    ✗
                                  </Button>
                                </div>
                              )}
                              {status === 'none' && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5 gap-1.5 text-primary hover:bg-primary/5 hover:text-primary" onClick={() => handleSendConnection(foundUser.id)}>
                                  <UserPlus className="h-3.5 w-3.5" /> Connect
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-muted-foreground py-2 text-center">No users found matching search query</p>
                    )}
                  </div>
                  <DropdownMenuSeparator className="opacity-50" />
                </div>
              )}

              {/* Incoming Requests (Styled in Facebook Connection Request Card Grid Layout) */}
              {pendingIncoming.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                      <UserPlus className="h-3 w-3 text-primary animate-pulse" /> Connection Requests
                    </h5>
                    <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer">See all</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {pendingIncoming.map((req) => (
                      <div key={req.id} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xs flex flex-col hover:border-border/80 transition-colors">
                        <div className="aspect-square bg-muted relative overflow-hidden flex-shrink-0">
                          {req.sender.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={req.sender.avatarUrl} alt={req.sender.name} className="w-full h-full object-cover animate-fade-in" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-lg text-muted-foreground bg-primary/5 text-primary">
                              {req.sender.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="p-2 flex flex-col flex-1 justify-between bg-muted/5 min-h-[95px]">
                          <span className="font-bold text-xs text-foreground truncate mb-2 block">{req.sender.name}</span>
                          <div className="space-y-1.5 mt-auto">
                            <Button 
                              size="sm" 
                              className="w-full h-7 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
                              onClick={() => handleRespondRequest(req.id, 'accepted')}
                            >
                              Confirm
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-7 text-[10px] border-transparent bg-secondary/80 hover:bg-secondary text-foreground font-semibold rounded-lg cursor-pointer"
                              onClick={() => handleRespondRequest(req.id, 'rejected')}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected People List */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                  <Users className="h-3 w-3" /> Connected People ({friends.length})
                </h5>
                {loadingConnections && friends.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground py-4 text-center">Loading connections list...</p>
                ) : friends.length > 0 ? (
                  <div className="space-y-0.5">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg group animate-fade-in">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.avatarUrl} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold truncate">{friend.name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-[10px] px-2 text-primary hover:bg-primary/5 hover:text-primary font-bold cursor-pointer"
                            onClick={async () => {
                              try {
                                const res = await api.post('/conversations/create', {
                                  participantIds: [friend.id],
                                  isGroupChat: false
                                });
                                onSelectConversation(res.data.data);
                                setActiveTab('chats');
                              } catch (e: any) {
                                alert(e.response?.data?.message || 'Failed to open chat');
                              }
                            }}
                          >
                            Chat
                          </Button>
                          {friend.connectionId && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold cursor-pointer"
                              title="Disconnect connection"
                              onClick={() => handleRemoveConnection(friend.connectionId!)}
                            >
                              ✗
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground py-4 text-center">No connected people yet</p>
                )}
              </div>

              {/* Sent Requests */}
              {pendingSent.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Sent Requests ({pendingSent.length})
                  </h5>
                  <div className="space-y-1">
                    {pendingSent.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg animate-fade-in">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={req.receiver.avatarUrl} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">{req.receiver.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold truncate">{req.receiver.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs px-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          onClick={() => handleRemoveConnection(req.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
