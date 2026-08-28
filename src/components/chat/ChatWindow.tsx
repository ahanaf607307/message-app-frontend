'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Phone, Video, Info, Trash2, Edit2, Check, X, UserPlus, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ChatWindowProps {
  conversation: Conversation;
  onUpdateLastMessage: (conversationId: string, message: Message) => void;
  onRefreshConversations: () => void;
  onCloseChat: () => void;
}

export default function ChatWindow({
  conversation,
  onUpdateLastMessage,
  onRefreshConversations,
  onCloseChat,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // Message edit states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Info modal states
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [addMemberId, setAddMemberId] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/messages/${conversation.id}`);
        const data = response.data.data;
        setMessages(Array.isArray(data) ? data : data?.messages || []);

        if (socket && user?.id) {
          socket.emit('message:seen', { conversationId: conversation.id });
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Socket listeners
    if (socket) {
      socket.emit('user:join', user?.id);
      socket.emit('conversation:join', conversation.id);

      const handleNewMessage = (message: Message) => {
        if (message.conversationId === conversation.id) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
          onUpdateLastMessage(conversation.id, message);

          if (message.senderId !== user?.id) {
            socket.emit('message:seen', { conversationId: conversation.id });
          }
        }
      };

      const handleTyping = (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== user?.id) {
          setIsTyping(data.isTyping);
        }
      };

      const handleMessageSeen = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === conversation.id && data.userId !== user?.id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderId === user?.id ? { ...msg, isSeen: true } : msg
            )
          );
        }
      };

      socket.on('message:received', handleNewMessage);
      socket.on('typing:active', handleTyping);
      socket.on('message:seen', handleMessageSeen);

      return () => {
        socket.emit('conversation:leave', conversation.id);
        socket.off('message:received', handleNewMessage);
        socket.off('typing:active', handleTyping);
        socket.off('message:seen', handleMessageSeen);
      };
    }
  }, [conversation.id, user?.id, socket, onUpdateLastMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageData = {
      conversationId: conversation.id,
      senderId: user.id,
      content: newMessage.trim(),
    };

    if (socket) {
      socket.emit('message:send', messageData);
      setNewMessage('');
      socket.emit('typing:stop', conversation.id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (socket) {
      if (e.target.value.length > 0) {
        socket.emit('typing:start', conversation.id);
      } else {
        socket.emit('typing:stop', conversation.id);
      }
    }
  };

  // Edit Message REST call
  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editingContent.trim()) return;
    try {
      await api.patch(`/messages/${msgId}`, { content: editingContent.trim() });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editingContent.trim() } : m));
      setEditingMessageId(null);
      onRefreshConversations();
    } catch (err) {
      alert('Failed to edit message');
    }
  };

  // Delete Message REST call
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      onRefreshConversations();
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async () => {
    if (!confirm('Are you sure you want to delete this entire chat conversation?')) return;
    try {
      await api.delete(`/conversations/${conversation.id}`);
      setIsInfoOpen(false);
      onCloseChat();
      onRefreshConversations();
    } catch (err) {
      alert('Failed to delete conversation');
    }
  };

  // Fetch friends not in this group for adding participants
  const handleOpenInfo = async () => {
    setIsInfoOpen(true);
    setAddMemberId('');
    try {
      setInfoLoading(true);
      const friendsRes = await api.get('/connections/connected-users');
      const allFriends = friendsRes.data.data.users || [];
      // Filter out friends who are already in this conversation
      const currentParticipantUserIds = conversation.participants.map(p => p.userId);
      const availableFriends = allFriends.filter((f: User) => !currentParticipantUserIds.includes(f.id));
      setFriendsList(availableFriends);
    } catch (err) {
      console.error(err);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberId) return;

    setInfoLoading(true);
    try {
      await api.post(`/conversations/${conversation.id}/participants`, { userId: addMemberId });
      alert('Participant added successfully!');
      setAddMemberId('');
      setIsInfoOpen(false);
      onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add participant');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;
    setInfoLoading(true);
    try {
      await api.delete(`/conversations/${conversation.id}/participants/${participantId}`);
      alert('Participant removed.');
      setIsInfoOpen(false);
      onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove participant');
    } finally {
      setInfoLoading(false);
    }
  };

  const otherParticipant = conversation.participants.find(p => p.user.id !== user?.id);
  const displayName = conversation.name || otherParticipant?.user.name || 'Unknown';

  return (
    <div className="flex flex-col h-full bg-background border-l border-border relative">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <Avatar className="h-10 w-10 border border-border shadow-xs">
            <AvatarImage src={otherParticipant?.user.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-none mb-1 truncate">{displayName}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-[11px] text-muted-foreground font-medium">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-0.5">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleOpenInfo}>
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25" onClick={onCloseChat}>
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-muted/5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.id;
              const isEditingThis = editingMessageId === msg.id;

              return (
                <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Participant Avatar for group chat */}
                    {conversation.isGroupChat && !isMe && (
                      <Avatar className="h-7 w-7 border mt-0.5 border-border/50">
                        <AvatarImage src={msg.sender?.avatarUrl} />
                        <AvatarFallback className="text-[10px] bg-muted">{msg.sender?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Name for group chat */}
                      {conversation.isGroupChat && !isMe && (
                        <span className="text-[10px] text-muted-foreground mb-0.5 px-1 font-medium">{msg.sender?.name}</span>
                      )}

                      <div className="group relative flex items-center gap-1">
                        {/* Edit actions (shown on hover for our own messages) */}
                        {isMe && !isEditingThis && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150 mr-1">
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded-md hover:bg-muted" onClick={() => handleStartEdit(msg)}>
                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-500" onClick={() => handleDeleteMessage(msg.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {isEditingThis ? (
                          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                            <Input 
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="h-7 text-xs bg-background min-w-[150px] py-0"
                            />
                            <Button size="icon-sm" className="h-6 w-6 bg-green-600 hover:bg-green-700 text-white rounded" onClick={() => handleSaveEdit(msg.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded hover:bg-muted text-muted-foreground" onClick={() => setEditingMessageId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-2xs leading-relaxed ${
                            isMe 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-card border text-foreground rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-[9px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                        {format(new Date(msg.createdAt), 'p')}
                        {isMe && (
                          <span className={`text-[9px] ${msg.isSeen ? 'text-primary font-extrabold' : 'text-muted-foreground'}`}>
                            {msg.isSeen ? '• Seen' : '• Sent'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border px-4 py-2 rounded-2xl rounded-tl-none text-xs italic text-muted-foreground shadow-2xs">
                  <span className="flex items-center gap-1.5">
                    typing
                    <span className="flex space-x-0.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Footer / Input */}
      <div className="p-4 bg-background border-t border-border">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input 
            placeholder="Type a message..." 
            className="flex-1 bg-muted/40 border-transparent focus-visible:ring-primary/50 text-sm h-10"
            value={newMessage}
            onChange={handleInputChange}
          />
          <Button type="submit" size="icon" className="h-10 w-10 shadow-xs" disabled={!newMessage.trim()}>
            <Send className="h-4.5 w-4.5" />
          </Button>
        </form>
      </div>

      {/* Chat Info Modal */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{conversation.isGroupChat ? 'Group Information' : 'Chat Details'}</DialogTitle>
            <DialogDescription>
              {conversation.isGroupChat 
                ? 'Manage group participants and details.' 
                : 'View details and options for this direct conversation.'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Group specific members list */}
          {conversation.isGroupChat && (
            <div className="space-y-4">
              {/* Add member form */}
              {friendsList.length > 0 && (
                <form onSubmit={handleAddParticipant} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label htmlFor="add-member" className="text-xs font-semibold text-muted-foreground">Add New Member</label>
                    <select
                      id="add-member"
                      value={addMemberId}
                      onChange={(e) => setAddMemberId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Select a friend...</option>
                      {friendsList.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="h-9" disabled={infoLoading}>
                    <UserPlus className="h-4 w-4 mr-1.5" /> Add
                  </Button>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Members ({conversation.participants.length})</span>
                <div className="max-h-52 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-muted/10">
                  {conversation.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.user.avatarUrl} />
                          <AvatarFallback className="text-[10px] bg-muted">{p.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold">{p.user.name}</span>
                        {p.user.id === user?.id && <span className="text-[9px] text-muted-foreground">(You)</span>}
                      </div>
                      {/* Allow removing members if they aren't ourselves */}
                      {p.user.id !== user?.id && (
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600 rounded"
                          onClick={() => handleRemoveParticipant(p.id)}
                          disabled={infoLoading}
                        >
                          ✗
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!conversation.isGroupChat && otherParticipant && (
            <div className="space-y-3 p-3 bg-muted/10 rounded-lg border border-border/50 text-xs">
              <div className="flex items-center space-x-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherParticipant.user.avatarUrl} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">{otherParticipant.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm">{otherParticipant.user.name}</h4>
                  <p className="text-[10px] text-muted-foreground">Joined {format(new Date(otherParticipant.user.createdAt), 'PP')}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p><strong>Email:</strong> {otherParticipant.user.email}</p>
                <p><strong>Role:</strong> {otherParticipant.user.role}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 flex sm:flex-row flex-col">
            <Button 
              variant="outline" 
              className="text-red-500 border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20 justify-start sm:w-auto w-full gap-1.5"
              onClick={handleDeleteConversation}
            >
              <Trash2 className="h-4 w-4" /> Delete Conversation
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start sm:w-auto w-full"
              onClick={() => setIsInfoOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
